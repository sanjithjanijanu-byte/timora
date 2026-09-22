from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class ExamSchedule(Base):
    __tablename__ = "exam_schedules"

    id = Column(Integer, primary_key=True, index=True)
    exam_date = Column(String(10), nullable=False)  # "2026-09-15"
    time_slot_id = Column(Integer, ForeignKey("time_slots.id"), nullable=False)
    section_id = Column(Integer, ForeignKey("sections.id"), nullable=False)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    lab_id = Column(Integer, ForeignKey("laboratories.id"), nullable=False)
    incharge_id = Column(Integer, ForeignKey("faculty.id"), nullable=False)
    co_incharge_id = Column(Integer, ForeignKey("faculty.id"), nullable=False)
    status = Column(String(20), default="scheduled")  # scheduled, completed, cancelled

    # Relationships
    time_slot = relationship("TimeSlot", back_populates="exam_schedules")
    section = relationship("Section", back_populates="exam_schedules")
    batch = relationship("Batch", back_populates="exam_schedules")
    subject = relationship("Subject", back_populates="exam_schedules")
    laboratory = relationship("Laboratory", back_populates="exam_schedules")
    incharge = relationship("Faculty", foreign_keys=[incharge_id], back_populates="incharge_schedules")
    co_incharge = relationship("Faculty", foreign_keys=[co_incharge_id], back_populates="co_incharge_schedules")
