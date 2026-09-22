from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse, PlainTextResponse
from sqlalchemy.orm import Session
import io
from database import get_db
from models.exam_schedule import ExamSchedule
from services.export_service import export_csv, export_excel_bytes, export_pdf_bytes

router = APIRouter(prefix="/api/export", tags=["Export"])


def _get_filtered_schedules(db: Session, section_id: int | None, faculty_id: int | None, lab_id: int | None, batch_id: int | None = None):
    q = db.query(ExamSchedule)
    if section_id:
        q = q.filter(ExamSchedule.section_id == section_id)
    if batch_id:
        q = q.filter(ExamSchedule.batch_id == batch_id)
    if faculty_id:
        q = q.filter(
            (ExamSchedule.incharge_id == faculty_id) |
            (ExamSchedule.co_incharge_id == faculty_id)
        )
    if lab_id:
        q = q.filter(ExamSchedule.lab_id == lab_id)
    return q.order_by(ExamSchedule.exam_date, ExamSchedule.time_slot_id).all()


@router.get("/csv")
def download_csv(
    section_id: int | None = None,
    batch_id: int | None = None,
    faculty_id: int | None = None,
    lab_id: int | None = None,
    db: Session = Depends(get_db),
):
    schedules = _get_filtered_schedules(db, section_id, faculty_id, lab_id, batch_id)
    csv_content = export_csv(db, schedules)
    return PlainTextResponse(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=exam_schedule.csv"},
    )


@router.get("/excel")
def download_excel(
    section_id: int | None = None,
    batch_id: int | None = None,
    faculty_id: int | None = None,
    lab_id: int | None = None,
    db: Session = Depends(get_db),
):
    schedules = _get_filtered_schedules(db, section_id, faculty_id, lab_id, batch_id)
    excel_bytes = export_excel_bytes(db, schedules)
    return StreamingResponse(
        io.BytesIO(excel_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=exam_schedule.xlsx"},
    )


@router.get("/pdf")
def download_pdf(
    section_id: int | None = None,
    batch_id: int | None = None,
    faculty_id: int | None = None,
    lab_id: int | None = None,
    db: Session = Depends(get_db),
):
    schedules = _get_filtered_schedules(db, section_id, faculty_id, lab_id, batch_id)
    pdf_bytes = export_pdf_bytes(db, schedules)
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=exam_schedule.pdf"},
    )

