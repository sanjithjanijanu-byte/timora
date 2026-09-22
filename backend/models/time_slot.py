from sqlalchemy import Column, Integer, String, Time
from sqlalchemy.orm import relationship
from database import Base


class TimeSlot(Base):
    __tablename__ = "time_slots"

    id = Column(Integer, primary_key=True, index=True)
    label = Column(String(100), nullable=False)
    start_time = Column(String(10), nullable=False)  # "08:30"
    end_time = Column(String(10), nullable=False)     # "11:30"
    duration_minutes = Column(Integer, default=180)

    # Relationships
    exam_schedules = relationship("ExamSchedule", back_populates="time_slot")
