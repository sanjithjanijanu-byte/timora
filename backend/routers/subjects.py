from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.subject import Subject, SubjectSectionCoordinator
from models.department import Department
from models.class_section import Class, Section
from models.faculty import Faculty
from schemas.subject import (
    SubjectCreate,
    SubjectUpdate,
    SubjectOut,
    SectionCoordinatorItem,
    SectionCoordinatorUpdate,
    TeachingSectionSummary,
)

router = APIRouter(prefix="/api/subjects", tags=["Subjects"])


def _build_coordinator_list(subj: Subject, db: Session) -> list[SectionCoordinatorItem]:
    """Helper to return all sections with their specific or default coordinator for a subject."""
    sections_query = db.query(Section).join(Class, Section.class_id == Class.id)
    if subj.department_id:
        dept_sections = sections_query.filter(Class.department_id == subj.department_id).all()
        sections = dept_sections if dept_sections else sections_query.all()
    else:
        sections = sections_query.all()

    coord_rows = db.query(SubjectSectionCoordinator).filter(
        SubjectSectionCoordinator.subject_id == subj.id
    ).all()
    coord_map = {c.section_id: c for c in coord_rows}

    items = []
    for sec in sections:
        cls = sec.parent_class
        dept = cls.department if cls else None
        coord = coord_map.get(sec.id)

        if coord and coord.faculty_id and coord.faculty:
            fac = coord.faculty
            items.append(SectionCoordinatorItem(
                section_id=sec.id,
                section_name=sec.name,
                class_id=sec.class_id,
                class_name=cls.name if cls else f"Class {sec.class_id}",
                year_semester=cls.year_semester if cls else None,
                department_id=dept.id if dept else None,
                department_name=dept.name if dept else None,
                student_count=sec.student_count or 0,
                faculty_id=fac.id,
                faculty_name=fac.name,
                faculty_id_code=fac.faculty_id_code,
                is_custom=True,
            ))
        else:
            default_fac = subj.assigned_faculty
            items.append(SectionCoordinatorItem(
                section_id=sec.id,
                section_name=sec.name,
                class_id=sec.class_id,
                class_name=cls.name if cls else f"Class {sec.class_id}",
                year_semester=cls.year_semester if cls else None,
                department_id=dept.id if dept else None,
                department_name=dept.name if dept else None,
                student_count=sec.student_count or 0,
                faculty_id=default_fac.id if default_fac else None,
                faculty_name=default_fac.name if default_fac else None,
                faculty_id_code=default_fac.faculty_id_code if default_fac else None,
                is_custom=False,
            ))
    return items


def _build_teaching_sections(subj: Subject, db: Session) -> list[TeachingSectionSummary]:
    coord_items = _build_coordinator_list(subj, db)
    return [
        TeachingSectionSummary(
            section_id=c.section_id,
            section_name=c.section_name,
            class_id=c.class_id,
            class_name=c.class_name,
            year_semester=c.year_semester,
            coordinator_id=c.faculty_id,
            coordinator_name=c.faculty_name,
            coordinator_code=c.faculty_id_code,
            is_custom=c.is_custom,
        )
        for c in coord_items
    ]


@router.get("", response_model=list[SubjectOut])
@router.get("/", response_model=list[SubjectOut])
def list_subjects(department_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(Subject)
    if department_id is not None:
        q = q.filter(Subject.department_id == department_id)
    rows = q.all()
    result = []
    for s in rows:
        out = SubjectOut.model_validate(s)
        out.department_name = s.department.name if s.department else None
        out.faculty_name = s.assigned_faculty.name if s.assigned_faculty else None
        out.coordinators_count = db.query(SubjectSectionCoordinator).filter(
            SubjectSectionCoordinator.subject_id == s.id,
            SubjectSectionCoordinator.faculty_id != None
        ).count()
        out.teaching_sections = _build_teaching_sections(s, db)
        result.append(out)
    return result


@router.get("/{subj_id}", response_model=SubjectOut)
def get_subject(subj_id: int, db: Session = Depends(get_db)):
    s = db.query(Subject).filter(Subject.id == subj_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Subject not found")
    out = SubjectOut.model_validate(s)
    out.department_name = s.department.name if s.department else None
    out.faculty_name = s.assigned_faculty.name if s.assigned_faculty else None
    out.coordinators_count = db.query(SubjectSectionCoordinator).filter(
        SubjectSectionCoordinator.subject_id == s.id,
        SubjectSectionCoordinator.faculty_id != None
    ).count()
    out.teaching_sections = _build_teaching_sections(s, db)
    return out


@router.post("", response_model=SubjectOut, status_code=201)
@router.post("/", response_model=SubjectOut, status_code=201)
def create_subject(data: SubjectCreate, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.id == data.department_id).first()
    if not dept:
        raise HTTPException(status_code=400, detail="Department not found")
    subj = Subject(**data.model_dump())
    db.add(subj)
    db.commit()
    db.refresh(subj)
    out = SubjectOut.model_validate(subj)
    out.department_name = dept.name
    out.faculty_name = subj.assigned_faculty.name if subj.assigned_faculty else None
    out.coordinators_count = 0
    out.teaching_sections = _build_teaching_sections(subj, db)
    return out


@router.put("/{subj_id}", response_model=SubjectOut)
def update_subject(subj_id: int, data: SubjectUpdate, db: Session = Depends(get_db)):
    subj = db.query(Subject).filter(Subject.id == subj_id).first()
    if not subj:
        raise HTTPException(status_code=404, detail="Subject not found")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(subj, key, val)
    db.commit()
    db.refresh(subj)
    out = SubjectOut.model_validate(subj)
    out.department_name = subj.department.name if subj.department else None
    out.faculty_name = subj.assigned_faculty.name if subj.assigned_faculty else None
    out.coordinators_count = db.query(SubjectSectionCoordinator).filter(
        SubjectSectionCoordinator.subject_id == subj.id,
        SubjectSectionCoordinator.faculty_id != None
    ).count()
    out.teaching_sections = _build_teaching_sections(subj, db)
    return out


@router.delete("/{subj_id}", status_code=204)
def delete_subject(subj_id: int, db: Session = Depends(get_db)):
    subj = db.query(Subject).filter(Subject.id == subj_id).first()
    if not subj:
        raise HTTPException(status_code=404, detail="Subject not found")
    db.delete(subj)
    db.commit()


# ── Section Coordinators for Subject ──────────────────────────────────────────


@router.get("/{subj_id}/coordinators", response_model=list[SectionCoordinatorItem])
@router.get("/{subj_id}/coordinators/", response_model=list[SectionCoordinatorItem])
def get_subject_section_coordinators(subj_id: int, db: Session = Depends(get_db)):
    subj = db.query(Subject).filter(Subject.id == subj_id).first()
    if not subj:
        raise HTTPException(status_code=404, detail="Subject not found")
    return _build_coordinator_list(subj, db)


@router.put("/{subj_id}/coordinators", response_model=list[SectionCoordinatorItem])
@router.put("/{subj_id}/coordinators/", response_model=list[SectionCoordinatorItem])
def update_subject_section_coordinators(
    subj_id: int,
    updates: list[SectionCoordinatorUpdate],
    db: Session = Depends(get_db),
):
    subj = db.query(Subject).filter(Subject.id == subj_id).first()
    if not subj:
        raise HTTPException(status_code=404, detail="Subject not found")

    for item in updates:
        existing = db.query(SubjectSectionCoordinator).filter(
            SubjectSectionCoordinator.subject_id == subj_id,
            SubjectSectionCoordinator.section_id == item.section_id,
        ).first()

        target_fac_id = item.faculty_id if item.faculty_id and item.faculty_id > 0 else None

        if target_fac_id is None:
            if existing:
                db.delete(existing)
        else:
            if existing:
                existing.faculty_id = target_fac_id
            else:
                db.add(SubjectSectionCoordinator(
                    subject_id=subj_id,
                    section_id=item.section_id,
                    faculty_id=target_fac_id,
                ))

    db.commit()
    return _build_coordinator_list(subj, db)


@router.put("/{subj_id}/coordinators/{section_id}", response_model=SectionCoordinatorItem)
def update_single_subject_section_coordinator(
    subj_id: int,
    section_id: int,
    data: SectionCoordinatorUpdate,
    db: Session = Depends(get_db),
):
    subj = db.query(Subject).filter(Subject.id == subj_id).first()
    if not subj:
        raise HTTPException(status_code=404, detail="Subject not found")

    target_fac_id = data.faculty_id if data.faculty_id and data.faculty_id > 0 else None
    existing = db.query(SubjectSectionCoordinator).filter(
        SubjectSectionCoordinator.subject_id == subj_id,
        SubjectSectionCoordinator.section_id == section_id,
    ).first()

    if target_fac_id is None:
        if existing:
            db.delete(existing)
    else:
        if existing:
            existing.faculty_id = target_fac_id
        else:
            db.add(SubjectSectionCoordinator(
                subject_id=subj_id,
                section_id=section_id,
                faculty_id=target_fac_id,
            ))

    db.commit()

    all_items = _build_coordinator_list(subj, db)
    matching = next((item for item in all_items if item.section_id == section_id), None)
    if not matching:
        raise HTTPException(status_code=404, detail="Section coordinator mapping not found")
    return matching
