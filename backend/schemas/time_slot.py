from pydantic import BaseModel


class TimeSlotCreate(BaseModel):
    label: str
    start_time: str
    end_time: str
    duration_minutes: int = 180


class TimeSlotUpdate(BaseModel):
    label: str | None = None
    start_time: str | None = None
    end_time: str | None = None
    duration_minutes: int | None = None


class TimeSlotOut(BaseModel):
    id: int
    label: str
    start_time: str
    end_time: str
    duration_minutes: int

    model_config = {"from_attributes": True}
