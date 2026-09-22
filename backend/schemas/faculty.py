from pydantic import BaseModel


class FacultyCreate(BaseModel):
    name: str
    faculty_id_code: str
    department_id: int
    expertise: str | None = None
    max_load: int = 5
    is_available: bool = True


class FacultyUpdate(BaseModel):
    name: str | None = None
    faculty_id_code: str | None = None
    department_id: int | None = None
    expertise: str | None = None
    max_load: int | None = None
    is_available: bool | None = None


class FacultyOut(BaseModel):
    id: int
    name: str
    faculty_id_code: str
    department_id: int
    department_name: str | None = None
    expertise: str | None
    max_load: int
    current_load: int
    is_available: bool

    model_config = {"from_attributes": True}
