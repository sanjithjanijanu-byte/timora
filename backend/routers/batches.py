import math
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.batch import Batch
from models.class_section import Section
from schemas.batch import BatchCreate, BatchUpdate, BatchOut, AutoBatchRequest

router = APIRouter(prefix="/api/batches", tags=["Batches"])


@router.get("", response_model=list[BatchOut])
@router.get("/", response_model=list[BatchOut])
def list_batches(section_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(Batch)
    if section_id is not None:
        q = q.filter(Batch.section_id == section_id)
    rows = q.all()
    result = []
    for b in rows:
        out = BatchOut.model_validate(b)
        out.section_name = b.section.name if b.section else None
        out.class_name = b.section.parent_class.name if b.section and b.section.parent_class else None
        result.append(out)
    return result


@router.get("/{batch_id}", response_model=BatchOut)
def get_batch(batch_id: int, db: Session = Depends(get_db)):
    b = db.query(Batch).filter(Batch.id == batch_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Batch not found")
    out = BatchOut.model_validate(b)
    out.section_name = b.section.name if b.section else None
    out.class_name = b.section.parent_class.name if b.section and b.section.parent_class else None
    return out


@router.post("", response_model=BatchOut, status_code=201)
@router.post("/", response_model=BatchOut, status_code=201)
def create_batch(data: BatchCreate, db: Session = Depends(get_db)):
    sec = db.query(Section).filter(Section.id == data.section_id).first()
    if not sec:
        raise HTTPException(status_code=400, detail="Section not found")
    batch = Batch(**data.model_dump())
    db.add(batch)
    db.commit()
    db.refresh(batch)
    out = BatchOut.model_validate(batch)
    out.section_name = sec.name
    out.class_name = sec.parent_class.name if sec.parent_class else None
    return out


@router.put("/{batch_id}", response_model=BatchOut)
def update_batch(batch_id: int, data: BatchUpdate, db: Session = Depends(get_db)):
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(batch, key, val)
    db.commit()
    db.refresh(batch)
    out = BatchOut.model_validate(batch)
    out.section_name = batch.section.name if batch.section else None
    out.class_name = batch.section.parent_class.name if batch.section and batch.section.parent_class else None
    return out


@router.delete("/{batch_id}", status_code=204)
def delete_batch(batch_id: int, db: Session = Depends(get_db)):
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    db.delete(batch)
    db.commit()


@router.post("/auto-generate", response_model=list[BatchOut])
def auto_generate_batches(data: AutoBatchRequest, db: Session = Depends(get_db)):
    """Automatically divide a section's students into batches based on max batch size."""
    sec = db.query(Section).filter(Section.id == data.section_id).first()
    if not sec:
        raise HTTPException(status_code=400, detail="Section not found")

    student_count = sec.student_count
    if student_count <= 0:
        raise HTTPException(status_code=400, detail="Section has no students")

    # Delete existing batches for this section
    db.query(Batch).filter(Batch.section_id == data.section_id).delete()

    num_batches = math.ceil(student_count / data.max_batch_size)
    base_size = student_count // num_batches
    remainder = student_count % num_batches

    created = []
    for i in range(num_batches):
        size = base_size + (1 if i < remainder else 0)
        batch = Batch(
            section_id=data.section_id,
            name=f"B{i + 1}",
            size=size,
        )
        db.add(batch)
        created.append(batch)

    db.commit()
    for b in created:
        db.refresh(b)

    result = []
    for b in created:
        out = BatchOut.model_validate(b)
        out.section_name = sec.name
        out.class_name = sec.parent_class.name if sec.parent_class else None
        result.append(out)
    return result
