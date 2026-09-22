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


class TeachingSectionSummary(BaseModel):
    section_id: int
    section_name: str
    class_id: int
    class_name: str
    year_semester: str | None = None
    coordinator_id: int | None = None
    coordinator_name: str | None = None
    coordinator_code: str | None = None
    is_custom: bool = False


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
    coordinators_count: int = 0
    teaching_sections: list[TeachingSectionSummary] = []

    model_config = {"from_attributes": True}


class SectionCoordinatorItem(BaseModel):
    section_id: int
    section_name: str
    class_id: int
    class_name: str
    year_semester: str | None = None
    department_id: int | None = None
    department_name: str | None = None
    student_count: int = 0
    faculty_id: int | None = None
    faculty_name: str | None = None
    faculty_id_code: str | None = None
    is_custom: bool = False


class SectionCoordinatorUpdate(BaseModel):
    section_id: int
    faculty_id: int | None = None

