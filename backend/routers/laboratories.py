from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.laboratory import Laboratory
from schemas.laboratory import LaboratoryCreate, LaboratoryUpdate, LaboratoryOut

router = APIRouter(prefix="/api/laboratories", tags=["Laboratories"])


@router.get("", response_model=list[LaboratoryOut])
@router.get("/", response_model=list[LaboratoryOut])
def list_laboratories(db: Session = Depends(get_db)):
    return db.query(Laboratory).all()


@router.get("/{lab_id}", response_model=LaboratoryOut)
def get_laboratory(lab_id: int, db: Session = Depends(get_db)):
    lab = db.query(Laboratory).filter(Laboratory.id == lab_id).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Laboratory not found")
    return lab


@router.post("", response_model=LaboratoryOut, status_code=201)
@router.post("/", response_model=LaboratoryOut, status_code=201)
def create_laboratory(data: LaboratoryCreate, db: Session = Depends(get_db)):
    lab = Laboratory(**data.model_dump())
    db.add(lab)
    db.commit()
    db.refresh(lab)
    return lab


@router.put("/{lab_id}", response_model=LaboratoryOut)
def update_laboratory(lab_id: int, data: LaboratoryUpdate, db: Session = Depends(get_db)):
    lab = db.query(Laboratory).filter(Laboratory.id == lab_id).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Laboratory not found")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(lab, key, val)
    db.commit()
    db.refresh(lab)
    return lab


@router.delete("/{lab_id}", status_code=204)
def delete_laboratory(lab_id: int, db: Session = Depends(get_db)):
    lab = db.query(Laboratory).filter(Laboratory.id == lab_id).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Laboratory not found")
    db.delete(lab)
    db.commit()
