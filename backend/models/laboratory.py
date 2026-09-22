from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from database import Base


class Laboratory(Base):
    __tablename__ = "laboratories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    lab_number = Column(String(50), nullable=True)
    building = Column(String(100), nullable=True)
    floor = Column(String(20), nullable=True)
    capacity = Column(Integer, nullable=False)
    equipment = Column(String(500), nullable=True)
    lab_type = Column(String(100), nullable=True)
    is_available = Column(Boolean, default=True)

    # Relationships
    exam_schedules = relationship("ExamSchedule", back_populates="laboratory")
