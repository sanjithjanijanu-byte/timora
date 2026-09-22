from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.faculty import Faculty
from models.department import Department
from models.subject import Subject, SubjectSectionCoordinator
from models.class_section import Class, Section
from models.batch import Batch
from schemas.faculty import (
    FacultyCreate,
    FacultyUpdate,
    FacultyOut,
    FacultyAssignmentOut,
    FacultyAssignmentCreate,
)

from services.conflict_detector import sync_faculty_workloads

router = APIRouter(prefix="/api/faculty", tags=["Faculty"])


def _build_faculty_assignments(fac_id: int, db: Session) -> list[FacultyAssignmentOut]:
    """Return all Class and Batch teaching assignments for a faculty member."""
    rows = db.query(SubjectSectionCoordinator).filter(
        SubjectSectionCoordinator.faculty_id == fac_id
    ).all()
    assignments = []
    for r in rows:
        subj = r.subject
        sec = r.section
        cls = sec.parent_class if sec else None
        b = r.batch
        b_name = b.name if b else "All Batches"
        if subj and sec:
            assignments.append(FacultyAssignmentOut(
                id=r.id,
                subject_id=subj.id,
                subject_name=subj.name,
                subject_code=subj.code,
                class_id=cls.id if cls else 0,
                class_name=cls.name if cls else "Class",
                year_semester=cls.year_semester if cls else None,
                section_id=sec.id,
                section_name=sec.name,
                batch_id=r.batch_id,
                batch_name=b_name,
            ))
    return assignments


@router.post("/sync-workload")
def recalculate_faculty_workloads(db: Session = Depends(get_db)):
    """Recalculate and update current_load for all faculty based on scheduled exams."""
    loads = sync_faculty_workloads(db)
    return {"status": "success", "workloads": loads}


@router.get("", response_model=list[FacultyOut])
@router.get("/", response_model=list[FacultyOut])
def list_faculty(department_id: int | None = None, db: Session = Depends(get_db)):
    sync_faculty_workloads(db)
    q = db.query(Faculty)
    if department_id is not None:
        q = q.filter(Faculty.department_id == department_id)
    rows = q.all()
    result = []
    for f in rows:
        out = FacultyOut.model_validate(f)
        out.department_name = f.department.name if f.department else None
        out.assigned_classes = _build_faculty_assignments(f.id, db)
        result.append(out)
    return result


@router.get("/{fac_id}", response_model=FacultyOut)
def get_faculty(fac_id: int, db: Session = Depends(get_db)):
    f = db.query(Faculty).filter(Faculty.id == fac_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Faculty not found")
    out = FacultyOut.model_validate(f)
    out.department_name = f.department.name if f.department else None
    out.assigned_classes = _build_faculty_assignments(f.id, db)
    return out


@router.get("/{fac_id}/assignments", response_model=list[FacultyAssignmentOut])
def get_faculty_assignments(fac_id: int, db: Session = Depends(get_db)):
    f = db.query(Faculty).filter(Faculty.id == fac_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Faculty not found")
    return _build_faculty_assignments(fac_id, db)


@router.post("/{fac_id}/assignments", response_model=list[FacultyAssignmentOut])
def assign_class_batch_to_faculty(
    fac_id: int,
    data: FacultyAssignmentCreate,
    db: Session = Depends(get_db),
):
    f = db.query(Faculty).filter(Faculty.id == fac_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Faculty not found")

    subj = db.query(Subject).filter(Subject.id == data.subject_id).first()
    sec = db.query(Section).filter(Section.id == data.section_id).first()
    if not subj or not sec:
        raise HTTPException(status_code=400, detail="Invalid Subject or Section")

    target_batch_id = data.batch_id if data.batch_id and data.batch_id > 0 else None

    # Check if an existing mapping exists for this subject, section, and batch
    q = db.query(SubjectSectionCoordinator).filter(
        SubjectSectionCoordinator.subject_id == data.subject_id,
        SubjectSectionCoordinator.section_id == data.section_id,
    )
    if target_batch_id:
        q = q.filter(SubjectSectionCoordinator.batch_id == target_batch_id)
    else:
        q = q.filter(SubjectSectionCoordinator.batch_id.is_(None))

    existing = q.first()
    if existing:
        existing.faculty_id = fac_id
    else:
        db.add(SubjectSectionCoordinator(
            subject_id=data.subject_id,
            section_id=data.section_id,
            batch_id=target_batch_id,
            faculty_id=fac_id,
        ))

    db.commit()
    return _build_faculty_assignments(fac_id, db)


@router.delete("/{fac_id}/assignments/{assignment_id}", response_model=list[FacultyAssignmentOut])
def delete_faculty_assignment(fac_id: int, assignment_id: int, db: Session = Depends(get_db)):
    record = db.query(SubjectSectionCoordinator).filter(
        SubjectSectionCoordinator.id == assignment_id,
        SubjectSectionCoordinator.faculty_id == fac_id,
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Assignment not found")
    db.delete(record)
    db.commit()
    return _build_faculty_assignments(fac_id, db)


@router.post("", response_model=FacultyOut, status_code=201)
@router.post("/", response_model=FacultyOut, status_code=201)
def create_faculty(data: FacultyCreate, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.id == data.department_id).first()
    if not dept:
        raise HTTPException(status_code=400, detail="Department not found")
    fac = Faculty(**data.model_dump())
    db.add(fac)
    db.commit()
    db.refresh(fac)
    out = FacultyOut.model_validate(fac)
    out.department_name = dept.name
    return out


@router.put("/{fac_id}", response_model=FacultyOut)
def update_faculty(fac_id: int, data: FacultyUpdate, db: Session = Depends(get_db)):
    fac = db.query(Faculty).filter(Faculty.id == fac_id).first()
    if not fac:
        raise HTTPException(status_code=404, detail="Faculty not found")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(fac, key, val)
    db.commit()
    db.refresh(fac)
    out = FacultyOut.model_validate(fac)
    out.department_name = fac.department.name if fac.department else None
    return out


@router.delete("/{fac_id}", status_code=204)
def delete_faculty(fac_id: int, db: Session = Depends(get_db)):
    fac = db.query(Faculty).filter(Faculty.id == fac_id).first()
    if not fac:
        raise HTTPException(status_code=404, detail="Faculty not found")
    db.delete(fac)
    db.commit()
