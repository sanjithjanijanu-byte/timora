from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Class(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    year_semester = Column(String(50), nullable=True)
    total_students = Column(Integer, default=0)

    # Relationships
    department = relationship("Department", back_populates="classes")
    sections = relationship("Section", back_populates="parent_class", cascade="all, delete-orphan")


class Section(Base):
    __tablename__ = "sections"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    name = Column(String(10), nullable=False)
    student_count = Column(Integer, default=0)

    # Relationships
    parent_class = relationship("Class", back_populates="sections")
    batches = relationship("Batch", back_populates="section", cascade="all, delete-orphan")
    exam_schedules = relationship("ExamSchedule", back_populates="section")
