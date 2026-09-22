from pydantic import BaseModel


class SubjectCreate(BaseModel):
    name: str
    code: str
    sessions_required: int = 1
    duration_minutes: int = 180
    required_lab_type: str | None = None
    department_id: int
    faculty_id: int | None = None


class SubjectUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    sessions_required: int | None = None
    duration_minutes: int | None = None
    required_lab_type: str | None = None
    department_id: int | None = None
    faculty_id: int | None = None


class SubjectOut(BaseModel):
    id: int
    name: str
    code: str
    sessions_required: int
    duration_minutes: int
    required_lab_type: str | None
    department_id: int
    department_name: str | None = None
    faculty_id: int | None = None
    faculty_name: str | None = None

    model_config = {"from_attributes": True}

