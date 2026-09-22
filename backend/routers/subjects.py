from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.subject import Subject
from models.department import Department
from schemas.subject import SubjectCreate, SubjectUpdate, SubjectOut

router = APIRouter(prefix="/api/subjects", tags=["Subjects"])


@router.get("", response_model=list[SubjectOut])
@router.get("/", response_model=list[SubjectOut])
def list_subjects(department_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(Subject)
    if department_id is not None:
        q = q.filter(Subject.department_id == department_id)
    rows = q.all()
    result = []
    for s in rows:
        out = SubjectOut.model_validate(s)
        out.department_name = s.department.name if s.department else None
        out.faculty_name = s.assigned_faculty.name if s.assigned_faculty else None
        result.append(out)
    return result


@router.get("/{subj_id}", response_model=SubjectOut)
def get_subject(subj_id: int, db: Session = Depends(get_db)):
    s = db.query(Subject).filter(Subject.id == subj_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Subject not found")
    out = SubjectOut.model_validate(s)
    out.department_name = s.department.name if s.department else None
    out.faculty_name = s.assigned_faculty.name if s.assigned_faculty else None
    return out


@router.post("", response_model=SubjectOut, status_code=201)
@router.post("/", response_model=SubjectOut, status_code=201)
def create_subject(data: SubjectCreate, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.id == data.department_id).first()
    if not dept:
        raise HTTPException(status_code=400, detail="Department not found")
    subj = Subject(**data.model_dump())
    db.add(subj)
    db.commit()
    db.refresh(subj)
    out = SubjectOut.model_validate(subj)
    out.department_name = dept.name
    out.faculty_name = subj.assigned_faculty.name if subj.assigned_faculty else None
    return out


@router.put("/{subj_id}", response_model=SubjectOut)
def update_subject(subj_id: int, data: SubjectUpdate, db: Session = Depends(get_db)):
    subj = db.query(Subject).filter(Subject.id == subj_id).first()
    if not subj:
        raise HTTPException(status_code=404, detail="Subject not found")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(subj, key, val)
    db.commit()
    db.refresh(subj)
    out = SubjectOut.model_validate(subj)
    out.department_name = subj.department.name if subj.department else None
    out.faculty_name = subj.assigned_faculty.name if subj.assigned_faculty else None
    return out



@router.delete("/{subj_id}", status_code=204)
def delete_subject(subj_id: int, db: Session = Depends(get_db)):
    subj = db.query(Subject).filter(Subject.id == subj_id).first()
    if not subj:
        raise HTTPException(status_code=404, detail="Subject not found")
    db.delete(subj)
    db.commit()
