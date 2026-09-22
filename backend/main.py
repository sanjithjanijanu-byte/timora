"""
Timora — Automation Lab Practical Exam Scheduling & Allocation System
FastAPI Backend Entry Point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from routers import (
    departments,
    classes,
    batches,
    subjects,
    laboratories,
    faculty,
    time_slots,
    scheduler,
    conflicts,
    export,
)

# Create all tables on startup
Base.metadata.create_all(bind=engine)

# Ensure faculty_id column exists in subjects table for existing DBs
with engine.connect() as conn:
    from sqlalchemy import text
    result = conn.execute(text("PRAGMA table_info(subjects);")).fetchall()
    columns = [row[1] for row in result]
    if "faculty_id" not in columns:
        conn.execute(text("ALTER TABLE subjects ADD COLUMN faculty_id INTEGER REFERENCES faculty(id);"))
        conn.commit()


def seed_initial_data():
    from database import SessionLocal
    from models.department import Department
    from models.class_section import Class, Section
    from models.batch import Batch
    from models.subject import Subject
    from models.laboratory import Laboratory
    from models.faculty import Faculty
    from models.time_slot import TimeSlot

    db = SessionLocal()
    try:
        # 1. Departments
        if db.query(Department).count() == 0:
            bca_dept = Department(name="BCA")
            cs_dept = Department(name="Computer Science")
            ai_dept = Department(name="AI & Data Science")
            it_dept = Department(name="Information Technology")
            db.add_all([bca_dept, cs_dept, ai_dept, it_dept])
            db.commit()
        
        bca_dept = db.query(Department).filter(Department.name == "BCA").first()
        cs_dept = db.query(Department).filter(Department.name == "Computer Science").first()

        # 2. Classes & Sections A to F
        if db.query(Class).count() == 0 and bca_dept:
            bca_class = Class(name="BCA Gen AI", department_id=bca_dept.id, year_semester="Year 1 / Sem 1", total_students=210)
            cs_class = Class(name="B.Sc CS", department_id=cs_dept.id if cs_dept else bca_dept.id, year_semester="Year 2 / Sem 3", total_students=70)
            db.add_all([bca_class, cs_class])
            db.commit()
            db.refresh(bca_class)
            db.refresh(cs_class)

            sections_to_add = [
                Section(class_id=bca_class.id, name="A", student_count=35),
                Section(class_id=bca_class.id, name="B", student_count=35),
                Section(class_id=bca_class.id, name="C", student_count=35),
                Section(class_id=bca_class.id, name="D", student_count=35),
                Section(class_id=bca_class.id, name="E", student_count=35),
                Section(class_id=bca_class.id, name="F", student_count=35),
                Section(class_id=cs_class.id, name="A", student_count=35),
                Section(class_id=cs_class.id, name="B", student_count=35),
            ]
            db.add_all(sections_to_add)
            db.commit()

            # Create initial batches for BCA A-F and CS A-B
            for sec in db.query(Section).all():
                for b_idx in range(1, 6):
                    db.add(Batch(section_id=sec.id, name=f"B{b_idx}", size=7))
            db.commit()

        # 3. Laboratories
        if db.query(Laboratory).count() == 0:
            labs_data = [
                Laboratory(name="Lab 1", lab_number="L101", building="Science Block", floor="1st Floor", capacity=40, equipment="35 PCs, Switch", lab_type="Computer Lab", is_available=True),
                Laboratory(name="Lab 2", lab_number="L102", building="Science Block", floor="1st Floor", capacity=35, equipment="35 PCs, Router", lab_type="Computer Lab", is_available=True),
                Laboratory(name="Lab 3", lab_number="L103", building="Science Block", floor="2nd Floor", capacity=35, equipment="35 PCs", lab_type="Computer Lab", is_available=True),
                Laboratory(name="Lab 4 (AI Lab)", lab_number="L201", building="Tech Park", floor="2nd Floor", capacity=40, equipment="GPU Workstations", lab_type="Computer Lab", is_available=True),
            ]
            db.add_all(labs_data)
            db.commit()

        # 4. Faculty
        if db.query(Faculty).count() == 0 and bca_dept:
            faculty_data = [
                Faculty(name="Dr. Faculty A", faculty_id_code="FAC001", department_id=bca_dept.id, expertise="Networking", max_load=5, current_load=0, is_available=True),
                Faculty(name="Prof. Faculty B", faculty_id_code="FAC002", department_id=bca_dept.id, expertise="Data Structures", max_load=5, current_load=0, is_available=True),
                Faculty(name="Dr. Faculty C", faculty_id_code="FAC003", department_id=bca_dept.id, expertise="AI & ML", max_load=5, current_load=0, is_available=True),
                Faculty(name="Prof. Faculty D", faculty_id_code="FAC004", department_id=bca_dept.id, expertise="Web Dev", max_load=5, current_load=0, is_available=True),
                Faculty(name="Dr. Faculty E", faculty_id_code="FAC005", department_id=cs_dept.id if cs_dept else bca_dept.id, expertise="Algorithms", max_load=5, current_load=0, is_available=True),
                Faculty(name="Prof. Faculty F", faculty_id_code="FAC006", department_id=cs_dept.id if cs_dept else bca_dept.id, expertise="OS", max_load=5, current_load=0, is_available=True),
            ]
            db.add_all(faculty_data)
            db.commit()

        # 5. Subjects
        fac_a = db.query(Faculty).filter(Faculty.faculty_id_code == "FAC001").first()
        fac_b = db.query(Faculty).filter(Faculty.faculty_id_code == "FAC002").first()
        fac_c = db.query(Faculty).filter(Faculty.faculty_id_code == "FAC003").first()
        fac_d = db.query(Faculty).filter(Faculty.faculty_id_code == "FAC004").first()

        if db.query(Subject).count() == 0 and bca_dept:
            subjects_data = [
                Subject(name="Computer Networks Lab", code="CN Lab", sessions_required=1, duration_minutes=180, required_lab_type="Computer Lab", department_id=bca_dept.id, faculty_id=fac_a.id if fac_a else None),
                Subject(name="Data Structures Lab", code="DS Lab", sessions_required=1, duration_minutes=180, required_lab_type="Computer Lab", department_id=bca_dept.id, faculty_id=fac_b.id if fac_b else None),
                Subject(name="AI & Machine Learning Lab", code="AI Lab", sessions_required=1, duration_minutes=180, required_lab_type="Computer Lab", department_id=bca_dept.id, faculty_id=fac_c.id if fac_c else None),
                Subject(name="Web Development Lab", code="Web Lab", sessions_required=1, duration_minutes=180, required_lab_type="Computer Lab", department_id=bca_dept.id, faculty_id=fac_d.id if fac_d else None),
            ]
            db.add_all(subjects_data)
            db.commit()
        elif fac_a:
            # Seed faculty_id for existing subjects if unset
            cn = db.query(Subject).filter(Subject.code == "CN Lab", Subject.faculty_id == None).first()
            if cn and fac_a: cn.faculty_id = fac_a.id
            ds = db.query(Subject).filter(Subject.code == "DS Lab", Subject.faculty_id == None).first()
            if ds and fac_b: ds.faculty_id = fac_b.id
            ai = db.query(Subject).filter(Subject.code == "AI Lab", Subject.faculty_id == None).first()
            if ai and fac_c: ai.faculty_id = fac_c.id
            web = db.query(Subject).filter(Subject.code == "Web Lab", Subject.faculty_id == None).first()
            if web and fac_d: web.faculty_id = fac_d.id
            db.commit()

        # 6. Time Slots
        if db.query(TimeSlot).count() == 0:
            default_slots = [
                TimeSlot(label="Slot 1", start_time="08:30", end_time="11:30", duration_minutes=180),
                TimeSlot(label="Slot 2", start_time="11:30", end_time="14:30", duration_minutes=180),
                TimeSlot(label="Slot 3", start_time="14:30", end_time="17:30", duration_minutes=180),
            ]
            db.add_all(default_slots)
            db.commit()
    finally:
        db.close()


seed_initial_data()

app = FastAPI(
    title="Timora — Exam Scheduler API",
    description="Automation Lab Practical Exam Scheduling & Allocation System",
    version="1.0.0",
)

# CORS — allow Vite dev server, local origins, and production cloud domains
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Register routers
app.include_router(departments.router)
app.include_router(classes.router)
app.include_router(batches.router)
app.include_router(subjects.router)
app.include_router(laboratories.router)
app.include_router(faculty.router)
app.include_router(time_slots.router)
app.include_router(scheduler.router)
app.include_router(conflicts.router)
app.include_router(export.router)

@app.get("/api/dashboard/stats")
def dashboard_stats():
    """Aggregate statistics for the admin dashboard."""
    from database import SessionLocal
    from models.class_section import Class, Section
    from models.batch import Batch
    from models.subject import Subject
    from models.faculty import Faculty as FacultyModel
    from models.laboratory import Laboratory
    from models.exam_schedule import ExamSchedule
    from sqlalchemy import func

    db = SessionLocal()
    try:
        total_classes = db.query(Class).count()
        total_sections = db.query(Section).count()
        total_batches = db.query(Batch).count()
        total_subjects = db.query(Subject).count()
        total_faculty = db.query(FacultyModel).count()
        total_laboratories = db.query(Laboratory).count()
        scheduled = db.query(ExamSchedule).filter(ExamSchedule.status == "scheduled").count()
        total_exams = db.query(ExamSchedule).count()

        # Calculate total available laboratory capacity
        total_lab_capacity = db.query(func.sum(Laboratory.capacity)).filter(Laboratory.is_available == True).scalar() or 0

        # Calculate faculty workload sum
        assigned_load = db.query(func.sum(FacultyModel.current_load)).scalar() or 0
        max_load = db.query(func.sum(FacultyModel.max_load)).scalar() or 0

        # Estimate required exam sessions: sum(batches_in_section * subjects_in_dept * sessions_required)
        total_required_sessions = 0
        subjects_list = db.query(Subject).all()
        for sec in db.query(Section).all():
            batch_count = db.query(Batch).filter(Batch.section_id == sec.id).count()
            for subj in subjects_list:
                total_required_sessions += batch_count * (subj.sessions_required or 1)

        pending_exams = max(0, total_required_sessions - scheduled)

        return {
            "total_classes": total_classes,
            "total_sections": total_sections,
            "total_batches": total_batches,
            "total_subjects": total_subjects,
            "total_faculty": total_faculty,
            "total_laboratories": total_laboratories,
            "scheduled_exams": scheduled,
            "total_exams": total_exams,
            "available_lab_capacity": total_lab_capacity,
            "pending_exams": pending_exams,
            "faculty_workload": f"{assigned_load} / {max_load}",
        }
    finally:
        db.close()


# ── Frontend SPA & Static File Serving (Must be registered LAST) ─────────────
BASE_DIR = Path(__file__).resolve().parent
DIST_CANDIDATES = [
    BASE_DIR / "static",
    BASE_DIR.parent / "frontend" / "dist",
    BASE_DIR / "frontend" / "dist",
]
frontend_dist = next((p for p in DIST_CANDIDATES if p.is_dir() and (p / "index.html").is_file()), None)

if frontend_dist:
    assets_dir = frontend_dist / "assets"
    if assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/")
    def serve_spa_root():
        return FileResponse(frontend_dist / "index.html")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Any API or docs request that reaches here is an unhandled endpoint -> return 404, NEVER HTML!
        if full_path == "api" or full_path.startswith("api/") or full_path in ("docs", "openapi.json", "redoc"):
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="API endpoint not found")

        file_path = frontend_dist / full_path
        if full_path and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dist / "index.html")
else:
    @app.get("/")
    def root():
        return {"message": "Timora API is running", "docs": "/docs"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)


