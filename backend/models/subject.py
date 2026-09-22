from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    code = Column(String(50), nullable=False, unique=True)
    sessions_required = Column(Integer, default=1)
    duration_minutes = Column(Integer, default=180)
    required_lab_type = Column(String(100), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    faculty_id = Column(Integer, ForeignKey("faculty.id"), nullable=True)

    # Relationships
    department = relationship("Department", back_populates="subjects")
    assigned_faculty = relationship("Faculty", back_populates="subjects")
    exam_schedules = relationship("ExamSchedule", back_populates="subject")
    section_coordinators = relationship("SubjectSectionCoordinator", back_populates="subject", cascade="all, delete-orphan")


class SubjectSectionCoordinator(Base):
    __tablename__ = "subject_section_coordinators"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    section_id = Column(Integer, ForeignKey("sections.id", ondelete="CASCADE"), nullable=False)
    faculty_id = Column(Integer, ForeignKey("faculty.id", ondelete="SET NULL"), nullable=True)
    batch_id = Column(Integer, ForeignKey("batches.id", ondelete="CASCADE"), nullable=True)

    # Relationships
    subject = relationship("Subject", back_populates="section_coordinators")
    section = relationship("Section")
    faculty = relationship("Faculty")
    batch = relationship("Batch")

