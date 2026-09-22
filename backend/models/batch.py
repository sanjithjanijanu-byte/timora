from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Batch(Base):
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True, index=True)
    section_id = Column(Integer, ForeignKey("sections.id"), nullable=False)
    name = Column(String(50), nullable=False)
    size = Column(Integer, nullable=False)

    # Relationships
    section = relationship("Section", back_populates="batches")
    exam_schedules = relationship("ExamSchedule", back_populates="batch")
