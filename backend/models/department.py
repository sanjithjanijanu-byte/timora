from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from database import Base


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, unique=True)

    # Relationships
    classes = relationship("Class", back_populates="department", cascade="all, delete-orphan")
    subjects = relationship("Subject", back_populates="department", cascade="all, delete-orphan")
    faculty = relationship("Faculty", back_populates="department", cascade="all, delete-orphan")
