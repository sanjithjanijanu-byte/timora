from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Faculty(Base):
    __tablename__ = "faculty"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    faculty_id_code = Column(String(50), nullable=False, unique=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    expertise = Column(String(500), nullable=True)
    max_load = Column(Integer, default=5)
    current_load = Column(Integer, default=0)
    is_available = Column(Boolean, default=True)

    # Relationships
    department = relationship("Department", back_populates="faculty")
    subjects = relationship("Subject", back_populates="assigned_faculty")
    incharge_schedules = relationship(

        "ExamSchedule",
        foreign_keys="ExamSchedule.incharge_id",
        back_populates="incharge",
    )
    co_incharge_schedules = relationship(
        "ExamSchedule",
        foreign_keys="ExamSchedule.co_incharge_id",
        back_populates="co_incharge",
    )
