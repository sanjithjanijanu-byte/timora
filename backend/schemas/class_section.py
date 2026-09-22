from pydantic import BaseModel


class ClassCreate(BaseModel):
    name: str
    department_id: int
    year_semester: str | None = None
    total_students: int = 0


class ClassUpdate(BaseModel):
    name: str | None = None
    department_id: int | None = None
    year_semester: str | None = None
    total_students: int | None = None


class ClassOut(BaseModel):
    id: int
    name: str
    department_id: int
    department_name: str | None = None
    year_semester: str | None = None
    total_students: int

    model_config = {"from_attributes": True}


class SectionCreate(BaseModel):
    class_id: int
    name: str
    student_count: int = 0


class SectionUpdate(BaseModel):
    class_id: int | None = None
    name: str | None = None
    student_count: int | None = None


class SectionOut(BaseModel):
    id: int
    class_id: int
    class_name: str | None = None
    department_name: str | None = None
    name: str
    student_count: int

    model_config = {"from_attributes": True}


class SubjectFacultyInfo(BaseModel):
    subject_id: int
    subject_name: str
    subject_code: str
    required_lab_type: str | None = None
    sessions_required: int
    duration_minutes: int
    faculty_id: int | None = None
    faculty_name: str | None = None
    faculty_id_code: str | None = None

    model_config = {"from_attributes": True}


class SectionDetailOut(BaseModel):
    id: int
    class_id: int
    class_name: str | None = None
    department_name: str | None = None
    name: str
    student_count: int
    subjects: list[SubjectFacultyInfo] = []

    model_config = {"from_attributes": True}
