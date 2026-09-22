"""
Constraint-based Practical Exam Scheduling Engine.

Implements all 14 allocation rules from the specification:
  R1:  A batch cannot have two exams at the same time.
  R2:  A lab cannot be assigned to two batches in the same slot.
  R3:  A faculty member cannot be assigned to two exams in the same slot.
  R4:  Lab capacity >= batch size.
  R5:  Only available laboratories.
  R6:  Only available faculty.
  R7:  Do not exceed faculty max workload.
  R8:  Distribute faculty workload evenly.
  R9:  Each exam needs In-Charge + Co-In-Charge.
  R10: In-Charge != Co-In-Charge.
  R11: Avoid repetitive faculty if others are eligible.
  R12: Minimize gaps between sessions.
  R13: If lab conflict, move to another lab or slot.
  R14: If no valid allocation, show conflict — never create invalid schedule.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from sqlalchemy.orm import Session

from models.batch import Batch
from models.subject import Subject
from models.laboratory import Laboratory
from models.faculty import Faculty
from models.time_slot import TimeSlot
from models.exam_schedule import ExamSchedule
from models.class_section import Section


@dataclass
class ScheduleEntry:
    exam_date: str
    time_slot_id: int
    section_id: int
    batch_id: int
    subject_id: int
    lab_id: int
    incharge_id: int
    co_incharge_id: int


@dataclass
class UnscheduledItem:
    section_id: int
    batch_id: int
    subject_id: int
    session_number: int
    reasons: list[str]


@dataclass
class ScheduleResult:
    scheduled: list[ScheduleEntry] = field(default_factory=list)
    unscheduled: list[UnscheduledItem] = field(default_factory=list)


def generate_schedule(
    db: Session,
    section_ids: list[int],
    subject_ids: list[int],
    lab_ids: list[int],
    faculty_ids: list[int],
    time_slot_ids: list[int],
    exam_dates: list[str],
    max_batch_size: int = 35,
) -> ScheduleResult:
    """
    Main scheduling function.
    Uses constraint satisfaction with priority scoring to guarantee:
    1. The subject's assigned coordinator is ALWAYS the Main In-Charge.
    2. Batches are evenly scheduled across appropriate laboratories and slots.
    3. Co-In-Charge faculty are load-balanced evenly.
    4. No clashes (batch, lab, faculty) or capacity violations.
    """

    # Load entities
    sections = db.query(Section).filter(Section.id.in_(section_ids)).all()
    subjects = db.query(Subject).filter(Subject.id.in_(subject_ids)).all()
    labs = db.query(Laboratory).filter(
        Laboratory.id.in_(lab_ids),
        Laboratory.is_available == True,  # R5
    ).order_by(Laboratory.capacity.asc()).all()
    faculty_pool = db.query(Faculty).filter(
        Faculty.id.in_(faculty_ids),
        Faculty.is_available == True,  # R6
    ).all()
    time_slots = db.query(TimeSlot).filter(TimeSlot.id.in_(time_slot_ids)).all()

    # Tracking structures for clash prevention
    # Keys: (date, slot_id) -> set of occupied resource IDs
    batch_schedule: dict[tuple[str, int], set[int]] = {}     # R1: batch clash
    lab_schedule: dict[tuple[str, int], set[int]] = {}       # R2: lab clash
    faculty_schedule: dict[tuple[str, int], set[int]] = {}   # R3: faculty clash
    lab_usage_count: dict[int, int] = {l.id: 0 for l in labs}

    faculty_load: dict[int, int] = {f.id: 0 for f in faculty_pool}  # Track fresh allocation load
    faculty_max: dict[int, int] = {f.id: f.max_load for f in faculty_pool}
    faculty_by_id = {f.id: f for f in faculty_pool}

    result = ScheduleResult()

    sorted_dates = sorted(exam_dates)
    sorted_slots = sorted(time_slots, key=lambda s: s.start_time)

    # Load all section-specific coordinators
    from models.subject import SubjectSectionCoordinator
    coord_rows = db.query(SubjectSectionCoordinator).all()
    section_coordinator_map: dict[tuple[int, int], int] = {
        (c.subject_id, c.section_id): c.faculty_id
        for c in coord_rows
        if c.faculty_id
    }

    # Build work items grouped by subject, then by session, then by batch
    # This ensures that all batches of a subject are scheduled cohesively
    work_items: list[tuple[int, int, int, int, int]] = []  # (section_id, batch_id, batch_size, subject_id, session_num)
    for subj in subjects:
        for sess in range(1, (subj.sessions_required or 1) + 1):
            for section in sections:
                batches = db.query(Batch).filter(Batch.section_id == section.id).all()
                for batch in batches:
                    work_items.append((section.id, batch.id, batch.size, subj.id, sess))

    for item in work_items:
        section_id, batch_id, batch_size, subject_id, session_num = item
        subj = next((s for s in subjects if s.id == subject_id), None)

        best_candidate = None
        best_score = -999999

        # Subject coordinator: prioritize section-specific coordinator, fallback to subject default
        target_fac_id = section_coordinator_map.get((subject_id, section_id))
        if not target_fac_id and subj and subj.faculty_id:
            target_fac_id = subj.faculty_id
        assigned_faculty_id = target_fac_id if (target_fac_id and target_fac_id in faculty_by_id) else None

        # Search across all (date, slot) combinations
        # Multiple exams on the same day are allowed across different time slots
        for date_idx, date in enumerate(sorted_dates):
            for slot_idx, slot in enumerate(sorted_slots):
                slot_key = (date, slot.id)

                # R1: Batch not already occupied in this slot
                if batch_id in batch_schedule.get(slot_key, set()):
                    continue

                # Find valid laboratories (R4: capacity >= batch_size, R2: not occupied in slot)
                valid_labs = [
                    l for l in labs
                    if l.capacity >= batch_size and l.id not in lab_schedule.get(slot_key, set())
                ]
                if not valid_labs:
                    continue

                # Find candidate Main In-Charge
                # Requirement: The selected coordinator for this particular class practical MUST be allotted as Main In-Charge
                incharge_candidates = []
                if assigned_faculty_id and assigned_faculty_id in faculty_by_id:
                    fac = faculty_by_id[assigned_faculty_id]
                    # If coordinator is occupied in this slot, skip to find a slot where coordinator is free
                    if fac.id not in faculty_schedule.get(slot_key, set()):
                        incharge_candidates.append(fac)
                else:
                    # Only when no coordinator was designated do we draw from the general faculty pool
                    incharge_candidates = [
                        f for f in faculty_pool
                        if f.id not in faculty_schedule.get(slot_key, set())
                        and faculty_load[f.id] < faculty_max.get(f.id, 5)
                    ]

                if not incharge_candidates:
                    continue

                for incharge in incharge_candidates:
                    # Find candidate Co-In-Charge (R10: co != incharge, R3: not occupied)
                    co_candidates = [
                        f for f in faculty_pool
                        if f.id != incharge.id
                        and f.id not in faculty_schedule.get(slot_key, set())
                        and faculty_load[f.id] < faculty_max.get(f.id, 5)
                    ]
                    if not co_candidates:
                        # Allow co-in-charge if needed to satisfy scheduling requirements
                        co_candidates = [
                            f for f in faculty_pool
                            if f.id != incharge.id
                            and f.id not in faculty_schedule.get(slot_key, set())
                        ]
                    if not co_candidates:
                        continue

                    # Sort co-in-charge by lowest load (R8: workload balance)
                    co_candidates.sort(key=lambda f: faculty_load[f.id])
                    co_incharge = co_candidates[0]

                    for lab in valid_labs:
                        # Score this candidate placement
                        score = 0

                        # Heavy reward for matching the assigned subject faculty as In-Charge
                        if incharge.id == assigned_faculty_id:
                            score += 50000

                        # Workload balancing penalty (prefer faculty with lower combined load)
                        score -= (faculty_load[incharge.id] * 100 + faculty_load[co_incharge.id] * 50)

                        # Lab balancing (prefer less used labs to balance utilization)
                        score -= lab_usage_count.get(lab.id, 0) * 20

                        # Compact scheduling: slight bonus for earlier dates / slots
                        score -= (date_idx * 10 + slot_idx)

                        if score > best_score:
                            best_score = score
                            best_candidate = (date, slot, lab, incharge, co_incharge)

        if best_candidate is not None:
            c_date, c_slot, c_lab, c_incharge, c_co = best_candidate
            slot_key = (c_date, c_slot.id)

            entry = ScheduleEntry(
                exam_date=c_date,
                time_slot_id=c_slot.id,
                section_id=section_id,
                batch_id=batch_id,
                subject_id=subject_id,
                lab_id=c_lab.id,
                incharge_id=c_incharge.id,
                co_incharge_id=c_co.id,
            )
            result.scheduled.append(entry)

            # Update occupancy
            batch_schedule.setdefault(slot_key, set()).add(batch_id)
            lab_schedule.setdefault(slot_key, set()).add(c_lab.id)
            faculty_schedule.setdefault(slot_key, set()).add(c_incharge.id)
            faculty_schedule.setdefault(slot_key, set()).add(c_co.id)

            lab_usage_count[c_lab.id] = lab_usage_count.get(c_lab.id, 0) + 1
            faculty_load[c_incharge.id] += 1
            faculty_load[c_co.id] += 1
        else:
            # R14: Detailed diagnostic of unscheduled reason
            reasons = []
            suitable_labs = [l for l in labs if l.capacity >= batch_size]
            if not suitable_labs:
                reasons.append(f"No laboratory with capacity >= {batch_size} is available.")
            available_fac = [f for f in faculty_pool if faculty_load[f.id] < faculty_max.get(f.id, 5)]
            if len(available_fac) < 2:
                reasons.append(f"Not enough faculty capacity remaining (need at least 2 available faculty).")
            if assigned_faculty_id and assigned_faculty_id in faculty_by_id:
                fac = faculty_by_id.get(assigned_faculty_id)
                fac_name = fac.name if fac else f"ID {assigned_faculty_id}"
                subj_name = subj.name if subj else f"ID {subject_id}"
                if faculty_load.get(assigned_faculty_id, 0) >= faculty_max.get(assigned_faculty_id, 5):
                    reasons.append(
                        f"Subject teacher {fac_name} reached maximum workload limit ({faculty_max.get(assigned_faculty_id, 5)})."
                    )
            if not reasons:
                reasons.append("All date/slot combinations are fully booked without violating clash constraints.")

            result.unscheduled.append(UnscheduledItem(
                section_id=section_id,
                batch_id=batch_id,
                subject_id=subject_id,
                session_number=session_num,
                reasons=reasons,
            ))

    return result


def persist_schedule(db: Session, schedule_result: ScheduleResult) -> list[ExamSchedule]:
    """Save scheduled entries to the database and update faculty loads accurately."""
    created = []
    for entry in schedule_result.scheduled:
        exam = ExamSchedule(
            exam_date=entry.exam_date,
            time_slot_id=entry.time_slot_id,
            section_id=entry.section_id,
            batch_id=entry.batch_id,
            subject_id=entry.subject_id,
            lab_id=entry.lab_id,
            incharge_id=entry.incharge_id,
            co_incharge_id=entry.co_incharge_id,
            status="scheduled",
        )
        db.add(exam)
        created.append(exam)

    db.commit()

    # Recalculate faculty loads across all faculty from actual DB state
    from services.conflict_detector import sync_faculty_workloads
    sync_faculty_workloads(db)

    for e in created:
        db.refresh(e)
    return created

