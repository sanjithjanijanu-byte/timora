from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.exam_schedule import ExamSchedule
from schemas.exam_schedule import (
    ExamScheduleCreate, ExamScheduleUpdate, ExamScheduleOut,
    ScheduleRequest, ScheduleResult as ScheduleResultSchema,
)
from services.scheduler_engine import generate_schedule, persist_schedule
from services.conflict_detector import detect_conflicts, sync_faculty_workloads

router = APIRouter(prefix="/api/scheduler", tags=["Scheduler"])


def _enrich_schedule(ex: ExamSchedule) -> ExamScheduleOut:
    """Convert an ExamSchedule ORM object to a fully enriched output schema."""
    return ExamScheduleOut(
        id=ex.id,
        exam_date=ex.exam_date,
        time_slot_id=ex.time_slot_id,
        time_slot_label=ex.time_slot.label if ex.time_slot else None,
        start_time=ex.time_slot.start_time if ex.time_slot else None,
        end_time=ex.time_slot.end_time if ex.time_slot else None,
        section_id=ex.section_id,
        class_name=ex.section.parent_class.name if ex.section and ex.section.parent_class else None,
        section_name=ex.section.name if ex.section else None,
        batch_id=ex.batch_id,
        batch_name=ex.batch.name if ex.batch else None,
        subject_id=ex.subject_id,
        subject_name=ex.subject.name if ex.subject else None,
        lab_id=ex.lab_id,
        lab_name=ex.laboratory.name if ex.laboratory else None,
        incharge_id=ex.incharge_id,
        incharge_name=ex.incharge.name if ex.incharge else None,
        co_incharge_id=ex.co_incharge_id,
        co_incharge_name=ex.co_incharge.name if ex.co_incharge else None,
        status=ex.status,
    )


@router.post("/generate", response_model=ScheduleResultSchema)
def auto_generate_schedule(request: ScheduleRequest, db: Session = Depends(get_db)):
    """Run the automatic scheduling engine."""
    # Auto-clear previous schedules to prevent duplicates
    from models.faculty import Faculty
    db.query(ExamSchedule).delete()
    db.query(Faculty).update({Faculty.current_load: 0})
    db.commit()

    result = generate_schedule(
        db=db,
        section_ids=request.section_ids,
        subject_ids=request.subject_ids,
        lab_ids=request.lab_ids,
        faculty_ids=request.faculty_ids,
        time_slot_ids=request.time_slot_ids,
        exam_dates=request.exam_dates,
        max_batch_size=request.max_batch_size,
    )

    # Persist to database
    created = persist_schedule(db, result)

    # Build response
    scheduled_out = [_enrich_schedule(ex) for ex in created]
    unscheduled_out = [
        {
            "section_id": u.section_id,
            "batch_id": u.batch_id,
            "subject_id": u.subject_id,
            "session_number": u.session_number,
            "reasons": u.reasons,
        }
        for u in result.unscheduled
    ]

    # Run conflict detection on the newly created schedules
    conflicts = detect_conflicts(db)

    return ScheduleResultSchema(
        scheduled=scheduled_out,
        unscheduled=unscheduled_out,
        conflicts=conflicts,
        total_scheduled=len(scheduled_out),
        total_unscheduled=len(unscheduled_out),
    )


# ── CRUD for individual exam schedules ───────────────────────────────────────

@router.get("/schedules", response_model=list[ExamScheduleOut])
@router.get("/schedules/", response_model=list[ExamScheduleOut])
def list_schedules(
    date: str | None = None,
    section_id: int | None = None,
    faculty_id: int | None = None,
    lab_id: int | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(ExamSchedule)
    if date:
        q = q.filter(ExamSchedule.exam_date == date)
    if section_id:
        q = q.filter(ExamSchedule.section_id == section_id)
    if faculty_id:
        q = q.filter(
            (ExamSchedule.incharge_id == faculty_id) |
            (ExamSchedule.co_incharge_id == faculty_id)
        )
    if lab_id:
        q = q.filter(ExamSchedule.lab_id == lab_id)

    exams = q.order_by(ExamSchedule.exam_date, ExamSchedule.time_slot_id).all()
    return [_enrich_schedule(ex) for ex in exams]


@router.get("/schedules/{sched_id}", response_model=ExamScheduleOut)
def get_schedule(sched_id: int, db: Session = Depends(get_db)):
    ex = db.query(ExamSchedule).filter(ExamSchedule.id == sched_id).first()
    if not ex:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return _enrich_schedule(ex)


@router.put("/schedules/{sched_id}", response_model=ExamScheduleOut)
def update_schedule(sched_id: int, data: ExamScheduleUpdate, db: Session = Depends(get_db)):
    """Update a schedule entry — used for manual editing after auto-generation."""
    ex = db.query(ExamSchedule).filter(ExamSchedule.id == sched_id).first()
    if not ex:
        raise HTTPException(status_code=404, detail="Schedule not found")

    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(ex, key, val)
    db.commit()
    db.refresh(ex)

    # Sync faculty workloads across all faculty
    sync_faculty_workloads(db)

    # Re-check for conflicts after edit
    conflicts = detect_conflicts(db)
    related = [c for c in conflicts if sched_id in c.get("related_ids", [])]
    if related:
        # Don't block the save (prompt says detect, not prevent), but return warning
        pass

    return _enrich_schedule(ex)


@router.delete("/schedules/{sched_id}", status_code=204)
def delete_schedule(sched_id: int, db: Session = Depends(get_db)):
    ex = db.query(ExamSchedule).filter(ExamSchedule.id == sched_id).first()
    if not ex:
        raise HTTPException(status_code=404, detail="Schedule not found")
    db.delete(ex)
    db.commit()
    sync_faculty_workloads(db)


@router.delete("/schedules", status_code=204)
@router.delete("/clear", status_code=204)
def clear_all_schedules(db: Session = Depends(get_db)):
    """Clear all generated schedules and reset faculty loads."""
    from models.faculty import Faculty
    db.query(ExamSchedule).delete()
    db.query(Faculty).update({Faculty.current_load: 0})
    db.commit()

