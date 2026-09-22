from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.time_slot import TimeSlot
from schemas.time_slot import TimeSlotCreate, TimeSlotUpdate, TimeSlotOut

router = APIRouter(prefix="/api/time-slots", tags=["Time Slots"])


@router.get("", response_model=list[TimeSlotOut])
@router.get("/", response_model=list[TimeSlotOut])
def list_time_slots(db: Session = Depends(get_db)):
    return db.query(TimeSlot).all()


@router.get("/{slot_id}", response_model=TimeSlotOut)
def get_time_slot(slot_id: int, db: Session = Depends(get_db)):
    slot = db.query(TimeSlot).filter(TimeSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Time slot not found")
    return slot


@router.post("", response_model=TimeSlotOut, status_code=201)
@router.post("/", response_model=TimeSlotOut, status_code=201)
def create_time_slot(data: TimeSlotCreate, db: Session = Depends(get_db)):
    slot = TimeSlot(**data.model_dump())
    db.add(slot)
    db.commit()
    db.refresh(slot)
    return slot


@router.put("/{slot_id}", response_model=TimeSlotOut)
def update_time_slot(slot_id: int, data: TimeSlotUpdate, db: Session = Depends(get_db)):
    slot = db.query(TimeSlot).filter(TimeSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Time slot not found")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(slot, key, val)
    db.commit()
    db.refresh(slot)
    return slot


@router.delete("/{slot_id}", status_code=204)
def delete_time_slot(slot_id: int, db: Session = Depends(get_db)):
    slot = db.query(TimeSlot).filter(TimeSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Time slot not found")
    db.delete(slot)
    db.commit()


@router.post("/seed-defaults", response_model=list[TimeSlotOut])
def seed_default_slots(db: Session = Depends(get_db)):
    """Create the three default 3-hour exam slots if none exist."""
    existing = db.query(TimeSlot).count()
    if existing > 0:
        return db.query(TimeSlot).all()

    defaults = [
        TimeSlot(label="Slot 1", start_time="08:30", end_time="11:30", duration_minutes=180),
        TimeSlot(label="Slot 2", start_time="11:30", end_time="14:30", duration_minutes=180),
        TimeSlot(label="Slot 3", start_time="14:30", end_time="17:30", duration_minutes=180),
    ]
    db.add_all(defaults)
    db.commit()
    for s in defaults:
        db.refresh(s)
    return defaults
