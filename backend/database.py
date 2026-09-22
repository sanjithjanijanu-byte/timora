import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./timora.db")

# Auto-create directory for SQLite file if path includes folders (e.g. /app/data/timora.db)
if DATABASE_URL.startswith("sqlite:////"):
    db_file = DATABASE_URL.replace("sqlite:////", "/")
    os.makedirs(os.path.dirname(db_file), exist_ok=True)
elif DATABASE_URL.startswith("sqlite:///"):
    db_file = DATABASE_URL.replace("sqlite:///", "")
    dir_name = os.path.dirname(db_file)
    if dir_name:
        os.makedirs(dir_name, exist_ok=True)

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency that yields a database session and closes it after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
