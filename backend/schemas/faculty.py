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


class FacultyAssignmentOut(BaseModel):
    id: int
    subject_id: int
    subject_name: str
    subject_code: str
    class_id: int
    class_name: str
    year_semester: str | None = None
    section_id: int
    section_name: str
    batch_id: int | None = None
    batch_name: str | None = None


class FacultyAssignmentCreate(BaseModel):
    subject_id: int
    section_id: int
    batch_id: int | None = None


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
    assigned_classes: list[FacultyAssignmentOut] = []

    model_config = {"from_attributes": True}
