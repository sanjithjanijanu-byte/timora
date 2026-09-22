from pydantic import BaseModel


class ExamScheduleCreate(BaseModel):
    exam_date: str
    time_slot_id: int
    section_id: int
    batch_id: int
    subject_id: int
    lab_id: int
    incharge_id: int
    co_incharge_id: int
    status: str = "scheduled"


class ExamScheduleUpdate(BaseModel):
    exam_date: str | None = None
    time_slot_id: int | None = None
    section_id: int | None = None
    batch_id: int | None = None
    subject_id: int | None = None
    lab_id: int | None = None
    incharge_id: int | None = None
    co_incharge_id: int | None = None
    status: str | None = None


class ExamScheduleOut(BaseModel):
    id: int
    exam_date: str
    time_slot_id: int
    time_slot_label: str | None = None
    start_time: str | None = None
    end_time: str | None = None
    section_id: int
    class_name: str | None = None
    section_name: str | None = None
    batch_id: int
    batch_name: str | None = None
    subject_id: int
    subject_name: str | None = None
    lab_id: int
    lab_name: str | None = None
    incharge_id: int
    incharge_name: str | None = None
    co_incharge_id: int
    co_incharge_name: str | None = None
    status: str

    model_config = {"from_attributes": True}


class ScheduleRequest(BaseModel):
    """Request payload for the auto-scheduler."""
    section_ids: list[int]
    subject_ids: list[int]
    lab_ids: list[int]
    faculty_ids: list[int]
    time_slot_ids: list[int]
    exam_dates: list[str]
    max_batch_size: int = 35


class ConflictItem(BaseModel):
    conflict_type: str       # faculty_clash, lab_clash, batch_clash, capacity_violation, etc.
    severity: str            # error, warning
    message: str
    schedule_id: int | None = None
    related_ids: list[int] = []


class ScheduleResult(BaseModel):
    scheduled: list[ExamScheduleOut]
    unscheduled: list[dict]
    conflicts: list[ConflictItem]
    total_scheduled: int
    total_unscheduled: int
