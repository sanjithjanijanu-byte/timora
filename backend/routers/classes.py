from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.class_section import Class, Section
from models.department import Department
from models.subject import Subject
from schemas.class_section import (
    ClassCreate, ClassUpdate, ClassOut,
    SectionCreate, SectionUpdate, SectionOut,
    SectionDetailOut, SubjectFacultyInfo,
)

router = APIRouter(prefix="/api", tags=["Classes & Sections"])


# ── Classes ──────────────────────────────────────────────────────────────────

@router.get("/classes", response_model=list[ClassOut])
@router.get("/classes/", response_model=list[ClassOut])
def list_classes(db: Session = Depends(get_db)):
    rows = db.query(Class).all()
    result = []
    for c in rows:
        out = ClassOut.model_validate(c)
        out.department_name = c.department.name if c.department else None
        result.append(out)
    return result


@router.get("/classes/{cls_id}", response_model=ClassOut)
def get_class(cls_id: int, db: Session = Depends(get_db)):
    c = db.query(Class).filter(Class.id == cls_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Class not found")
    out = ClassOut.model_validate(c)
    out.department_name = c.department.name if c.department else None
    return out


@router.post("/classes", response_model=ClassOut, status_code=201)
@router.post("/classes/", response_model=ClassOut, status_code=201)
def create_class(data: ClassCreate, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.id == data.department_id).first()
    if not dept:
        raise HTTPException(status_code=400, detail="Department not found")
    cls = Class(**data.model_dump())
    db.add(cls)
    db.commit()
    db.refresh(cls)
    out = ClassOut.model_validate(cls)
    out.department_name = dept.name
    return out


@router.put("/classes/{cls_id}", response_model=ClassOut)
def update_class(cls_id: int, data: ClassUpdate, db: Session = Depends(get_db)):
    cls = db.query(Class).filter(Class.id == cls_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(cls, key, val)
    db.commit()
    db.refresh(cls)
    out = ClassOut.model_validate(cls)
    out.department_name = cls.department.name if cls.department else None
    return out


@router.delete("/classes/{cls_id}", status_code=204)
def delete_class(cls_id: int, db: Session = Depends(get_db)):
    cls = db.query(Class).filter(Class.id == cls_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    db.delete(cls)
    db.commit()


# ── Sections ─────────────────────────────────────────────────────────────────

@router.get("/sections", response_model=list[SectionOut])
@router.get("/sections/", response_model=list[SectionOut])
def list_sections(class_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(Section)
    if class_id is not None:
        q = q.filter(Section.class_id == class_id)
    rows = q.all()
    result = []
    for s in rows:
        out = SectionOut.model_validate(s)
        out.class_name = s.parent_class.name if s.parent_class else None
        dept = s.parent_class.department if s.parent_class else None
        out.department_name = dept.name if dept else None
        result.append(out)
    return result


@router.get("/sections/{sec_id}", response_model=SectionOut)
def get_section(sec_id: int, db: Session = Depends(get_db)):
    s = db.query(Section).filter(Section.id == sec_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Section not found")
    out = SectionOut.model_validate(s)
    out.class_name = s.parent_class.name if s.parent_class else None
    dept = s.parent_class.department if s.parent_class else None
    out.department_name = dept.name if dept else None
    return out


@router.get("/sections/{sec_id}/details", response_model=SectionDetailOut)
@router.get("/sections/{sec_id}/details/", response_model=SectionDetailOut)
def get_section_details(sec_id: int, db: Session = Depends(get_db)):
    """Return a section with all subjects in its department and their assigned faculty."""
    s = db.query(Section).filter(Section.id == sec_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Section not found")

    cls = s.parent_class
    dept = cls.department if cls else None
    dept_id = dept.id if dept else None

    # Get all subjects in this department
    subjects = []
    if dept_id:
        subj_rows = db.query(Subject).filter(Subject.department_id == dept_id).all()
        for subj in subj_rows:
            fac = subj.assigned_faculty
            subjects.append(SubjectFacultyInfo(
                subject_id=subj.id,
                subject_name=subj.name,
                subject_code=subj.code,
                required_lab_type=subj.required_lab_type,
                sessions_required=subj.sessions_required,
                duration_minutes=subj.duration_minutes,
                faculty_id=fac.id if fac else None,
                faculty_name=fac.name if fac else None,
                faculty_id_code=fac.faculty_id_code if fac else None,
            ))

    return SectionDetailOut(
        id=s.id,
        class_id=s.class_id,
        class_name=cls.name if cls else None,
        department_name=dept.name if dept else None,
        name=s.name,
        student_count=s.student_count,
        subjects=subjects,
    )


@router.post("/sections", response_model=SectionOut, status_code=201)
@router.post("/sections/", response_model=SectionOut, status_code=201)
def create_section(data: SectionCreate, db: Session = Depends(get_db)):
    cls = db.query(Class).filter(Class.id == data.class_id).first()
    if not cls:
        raise HTTPException(status_code=400, detail="Class not found")
    sec = Section(**data.model_dump())
    db.add(sec)
    db.commit()
    db.refresh(sec)
    out = SectionOut.model_validate(sec)
    out.class_name = cls.name
    dept = cls.department if cls else None
    out.department_name = dept.name if dept else None
    return out


@router.put("/sections/{sec_id}", response_model=SectionOut)
def update_section(sec_id: int, data: SectionUpdate, db: Session = Depends(get_db)):
    sec = db.query(Section).filter(Section.id == sec_id).first()
    if not sec:
        raise HTTPException(status_code=404, detail="Section not found")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(sec, key, val)
    db.commit()
    db.refresh(sec)
    out = SectionOut.model_validate(sec)
    out.class_name = sec.parent_class.name if sec.parent_class else None
    dept = sec.parent_class.department if sec.parent_class else None
    out.department_name = dept.name if dept else None
    return out


@router.delete("/sections/{sec_id}", status_code=204)
def delete_section(sec_id: int, db: Session = Depends(get_db)):
    sec = db.query(Section).filter(Section.id == sec_id).first()
    if not sec:
        raise HTTPException(status_code=404, detail="Section not found")
    db.delete(sec)
    db.commit()

