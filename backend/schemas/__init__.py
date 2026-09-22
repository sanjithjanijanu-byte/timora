from .department import DepartmentCreate, DepartmentUpdate, DepartmentOut
from .class_section import (
    ClassCreate, ClassUpdate, ClassOut,
    SectionCreate, SectionUpdate, SectionOut,
)
from .batch import BatchCreate, BatchUpdate, BatchOut, AutoBatchRequest
from .subject import SubjectCreate, SubjectUpdate, SubjectOut
from .laboratory import LaboratoryCreate, LaboratoryUpdate, LaboratoryOut
from .faculty import FacultyCreate, FacultyUpdate, FacultyOut
from .time_slot import TimeSlotCreate, TimeSlotUpdate, TimeSlotOut
from .exam_schedule import (
    ExamScheduleCreate, ExamScheduleUpdate, ExamScheduleOut,
    ScheduleRequest, ScheduleResult, ConflictItem,
)
