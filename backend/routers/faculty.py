from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.faculty import Faculty
from models.department import Department
from schemas.faculty import FacultyCreate, FacultyUpdate, FacultyOut

from services.conflict_detector import sync_faculty_workloads

router = APIRouter(prefix="/api/faculty", tags=["Faculty"])


@router.post("/sync-workload")
def recalculate_faculty_workloads(db: Session = Depends(get_db)):
    """Recalculate and update current_load for all faculty based on scheduled exams."""
    loads = sync_faculty_workloads(db)
    return {"status": "success", "workloads": loads}


@router.get("", response_model=list[FacultyOut])
@router.get("/", response_model=list[FacultyOut])
def list_faculty(department_id: int | None = None, db: Session = Depends(get_db)):
    # Keep current loads accurate
    sync_faculty_workloads(db)
    q = db.query(Faculty)
    if department_id is not None:
        q = q.filter(Faculty.department_id == department_id)
    rows = q.all()
    result = []
    for f in rows:
        out = FacultyOut.model_validate(f)
        out.department_name = f.department.name if f.department else None
        result.append(out)
    return result



@router.get("/{fac_id}", response_model=FacultyOut)
def get_faculty(fac_id: int, db: Session = Depends(get_db)):
    f = db.query(Faculty).filter(Faculty.id == fac_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Faculty not found")
    out = FacultyOut.model_validate(f)
    out.department_name = f.department.name if f.department else None
    return out


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
