from pydantic import BaseModel


class LaboratoryCreate(BaseModel):
    name: str
    lab_number: str | None = None
    building: str | None = None
    floor: str | None = None
    capacity: int
    equipment: str | None = None
    lab_type: str | None = None
    is_available: bool = True


class LaboratoryUpdate(BaseModel):
    name: str | None = None
    lab_number: str | None = None
    building: str | None = None
    floor: str | None = None
    capacity: int | None = None
    equipment: str | None = None
    lab_type: str | None = None
    is_available: bool | None = None


class LaboratoryOut(BaseModel):
    id: int
    name: str
    lab_number: str | None
    building: str | None
    floor: str | None
    capacity: int
    equipment: str | None
    lab_type: str | None
    is_available: bool

    model_config = {"from_attributes": True}
