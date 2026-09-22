"""
Conflict Detection Service.

Scans existing exam schedules for violations of the 14 allocation rules.
Returns a list of ConflictItem dicts ready for the API response.
"""

from __future__ import annotations
from sqlalchemy.orm import Session
from models.exam_schedule import ExamSchedule
from models.laboratory import Laboratory
from models.faculty import Faculty
from models.batch import Batch


def detect_conflicts(db: Session) -> list[dict]:
    """Scan all exam schedules and return a list of conflict dicts."""
    schedules = db.query(ExamSchedule).all()
    conflicts: list[dict] = []

    # Index by (date, slot)
    slot_map: dict[tuple[str, int], list[ExamSchedule]] = {}
    for s in schedules:
        key = (s.exam_date, s.time_slot_id)
        slot_map.setdefault(key, []).append(s)

    for key, exams in slot_map.items():
        date_str, slot_id = key

        # ── R1: Batch clash ──────────────────────────────────────────────
        batch_seen: dict[int, ExamSchedule] = {}
        for ex in exams:
            if ex.batch_id in batch_seen:
                other = batch_seen[ex.batch_id]
                batch = db.query(Batch).filter(Batch.id == ex.batch_id).first()
                batch_name = batch.name if batch else f"Batch {ex.batch_id}"
                conflicts.append({
                    "conflict_type": "batch_clash",
                    "severity": "error",
                    "message": f"{batch_name} is assigned to two exams on {date_str} in the same slot.",
                    "schedule_id": ex.id,
                    "related_ids": [other.id, ex.id],
                })
            batch_seen[ex.batch_id] = ex

        # ── R2: Lab clash ────────────────────────────────────────────────
        lab_seen: dict[int, ExamSchedule] = {}
        for ex in exams:
            if ex.lab_id in lab_seen:
                other = lab_seen[ex.lab_id]
                lab = db.query(Laboratory).filter(Laboratory.id == ex.lab_id).first()
                lab_name = lab.name if lab else f"Lab {ex.lab_id}"
                conflicts.append({
                    "conflict_type": "lab_clash",
                    "severity": "error",
                    "message": f"{lab_name} is double-booked on {date_str} in the same slot.",
                    "schedule_id": ex.id,
                    "related_ids": [other.id, ex.id],
                })
            lab_seen[ex.lab_id] = ex

        # ── R3: Faculty clash ────────────────────────────────────────────
        faculty_seen: dict[int, ExamSchedule] = {}
        for ex in exams:
            for fac_id in [ex.incharge_id, ex.co_incharge_id]:
                if fac_id in faculty_seen:
                    other = faculty_seen[fac_id]
                    if other.id != ex.id:
                        fac = db.query(Faculty).filter(Faculty.id == fac_id).first()
                        fac_name = fac.name if fac else f"Faculty {fac_id}"
                        conflicts.append({
                            "conflict_type": "faculty_clash",
                            "severity": "error",
                            "message": f"{fac_name} is assigned to two exams on {date_str} in the same slot.",
                            "schedule_id": ex.id,
                            "related_ids": [other.id, ex.id],
                        })
                faculty_seen[fac_id] = ex

    # ── R4: Capacity violation ───────────────────────────────────────────
    for ex in schedules:
        batch = db.query(Batch).filter(Batch.id == ex.batch_id).first()
        lab = db.query(Laboratory).filter(Laboratory.id == ex.lab_id).first()
        if batch and lab and lab.capacity < batch.size:
            conflicts.append({
                "conflict_type": "capacity_violation",
                "severity": "error",
                "message": f"Batch {batch.name} has {batch.size} students but {lab.name} capacity is only {lab.capacity}.",
                "schedule_id": ex.id,
                "related_ids": [ex.id],
            })

    # ── R7: Faculty workload violation ───────────────────────────────────
    faculty_all = db.query(Faculty).all()
    for f in faculty_all:
        if f.current_load > f.max_load:
            conflicts.append({
                "conflict_type": "workload_violation",
                "severity": "warning",
                "message": f"{f.name} has {f.current_load} assignments, exceeding maximum load of {f.max_load}.",
                "schedule_id": None,
                "related_ids": [],
            })

    # ── R10: In-Charge == Co-In-Charge ───────────────────────────────────
    for ex in schedules:
        if ex.incharge_id == ex.co_incharge_id:
            fac = db.query(Faculty).filter(Faculty.id == ex.incharge_id).first()
            fac_name = fac.name if fac else f"Faculty {ex.incharge_id}"
            conflicts.append({
                "conflict_type": "same_faculty",
                "severity": "error",
                "message": f"In-Charge and Co-In-Charge are the same person ({fac_name}) for schedule #{ex.id}.",
                "schedule_id": ex.id,
                "related_ids": [ex.id],
            })

    # ── Missing references ───────────────────────────────────────────────
    for ex in schedules:
        if not ex.time_slot:
            conflicts.append({
                "conflict_type": "missing_time_slot",
                "severity": "error",
                "message": f"Schedule #{ex.id} references a non-existent time slot.",
                "schedule_id": ex.id,
                "related_ids": [ex.id],
            })
        if not ex.laboratory:
            conflicts.append({
                "conflict_type": "missing_venue",
                "severity": "error",
                "message": f"Schedule #{ex.id} references a non-existent laboratory.",
                "schedule_id": ex.id,
                "related_ids": [ex.id],
            })

    return conflicts


def sync_faculty_workloads(db: Session) -> dict[int, int]:
    """Recalculate and update current_load for all faculty based on actual schedules."""
    schedules = db.query(ExamSchedule).all()
    actual_loads: dict[int, int] = {}
    for s in schedules:
        if s.incharge_id:
            actual_loads[s.incharge_id] = actual_loads.get(s.incharge_id, 0) + 1
        if s.co_incharge_id:
            actual_loads[s.co_incharge_id] = actual_loads.get(s.co_incharge_id, 0) + 1

    all_fac = db.query(Faculty).all()
    for f in all_fac:
        f.current_load = actual_loads.get(f.id, 0)

    db.commit()
    return actual_loads


def auto_resolve_conflicts(db: Session) -> dict:
    """
    Automatically resolve detected conflicts in existing schedules by reallocating
    suitable labs, eligible non-clashing faculty, or alternative slots.
    """
    sync_faculty_workloads(db)
    initial_conflicts = detect_conflicts(db)
    if not initial_conflicts:
        return {
            "resolved_count": 0,
            "remaining_conflicts": 0,
            "conflicts": [],
            "message": "No conflicts detected. Schedule is already fully valid.",
        }

    schedules = db.query(ExamSchedule).all()
    labs = db.query(Laboratory).filter(Laboratory.is_available == True).all()
    faculty_pool = db.query(Faculty).filter(Faculty.is_available == True).all()

    # Track slot allocations: (date, slot_id) -> set(resource_ids)
    lab_occupied: dict[tuple[str, int], set[int]] = {}
    fac_occupied: dict[tuple[str, int], set[int]] = {}
    batch_occupied: dict[tuple[str, int], set[int]] = {}
    faculty_load: dict[int, int] = {f.id: f.current_load for f in faculty_pool}
    faculty_max: dict[int, int] = {f.id: f.max_load for f in faculty_pool}

    # Populate occupancy from non-conflicting base or rebuild
    for s in schedules:
        key = (s.exam_date, s.time_slot_id)
        lab_occupied.setdefault(key, set())
        fac_occupied.setdefault(key, set())
        batch_occupied.setdefault(key, set())

    # Collect schedule IDs that have errors
    conflicted_sched_ids = set()
    for c in initial_conflicts:
        if c.get("schedule_id"):
            conflicted_sched_ids.add(c["schedule_id"])
        for rid in c.get("related_ids", []):
            conflicted_sched_ids.add(rid)

    # First register unconflicted schedules in occupied tracking
    for s in schedules:
        if s.id not in conflicted_sched_ids:
            key = (s.exam_date, s.time_slot_id)
            if s.lab_id:
                lab_occupied[key].add(s.lab_id)
            if s.batch_id:
                batch_occupied[key].add(s.batch_id)
            if s.incharge_id:
                fac_occupied[key].add(s.incharge_id)
            if s.co_incharge_id:
                fac_occupied[key].add(s.co_incharge_id)

    resolved_count = 0

    # Process each conflicted schedule entry
    for sched_id in conflicted_sched_ids:
        s = db.query(ExamSchedule).filter(ExamSchedule.id == sched_id).first()
        if not s:
            continue

        key = (s.exam_date, s.time_slot_id)
        batch = db.query(Batch).filter(Batch.id == s.batch_id).first()
        batch_size = batch.size if batch else 35

        # 1. Fix Lab: ensure lab is available, not double-booked in this slot, and capacity >= batch_size
        current_lab = db.query(Laboratory).filter(Laboratory.id == s.lab_id).first()
        lab_valid = (
            current_lab
            and current_lab.is_available
            and current_lab.capacity >= batch_size
            and (current_lab.id not in lab_occupied.get(key, set()))
        )

        if not lab_valid:
            # Find an alternative lab sorted by smallest suitable capacity
            suitable_labs = sorted(
                [l for l in labs if l.capacity >= batch_size and l.id not in lab_occupied.get(key, set())],
                key=lambda l: l.capacity,
            )
            if suitable_labs:
                s.lab_id = suitable_labs[0].id
                lab_occupied.setdefault(key, set()).add(s.lab_id)
                resolved_count += 1
            else:
                # Keep existing if no alternative
                if s.lab_id:
                    lab_occupied.setdefault(key, set()).add(s.lab_id)
        else:
            lab_occupied.setdefault(key, set()).add(s.lab_id)

        # 2. Fix In-Charge Faculty
        incharge_valid = (
            s.incharge_id
            and s.incharge_id not in fac_occupied.get(key, set())
            and faculty_load.get(s.incharge_id, 0) <= faculty_max.get(s.incharge_id, 5)
        )
        if not incharge_valid:
            # Pick eligible faculty with lowest load
            eligible_incharges = sorted(
                [
                    f for f in faculty_pool
                    if f.id not in fac_occupied.get(key, set())
                    and faculty_load.get(f.id, 0) < faculty_max.get(f.id, 5)
                ],
                key=lambda f: faculty_load.get(f.id, 0),
            )
            if eligible_incharges:
                old_id = s.incharge_id
                s.incharge_id = eligible_incharges[0].id
                faculty_load[s.incharge_id] = faculty_load.get(s.incharge_id, 0) + 1
                if old_id and old_id in faculty_load:
                    faculty_load[old_id] = max(0, faculty_load[old_id] - 1)
                fac_occupied.setdefault(key, set()).add(s.incharge_id)
                resolved_count += 1
            else:
                if s.incharge_id:
                    fac_occupied.setdefault(key, set()).add(s.incharge_id)
        else:
            fac_occupied.setdefault(key, set()).add(s.incharge_id)

        # 3. Fix Co-In-Charge Faculty (must differ from incharge)
        co_valid = (
            s.co_incharge_id
            and s.co_incharge_id != s.incharge_id
            and s.co_incharge_id not in fac_occupied.get(key, set())
            and faculty_load.get(s.co_incharge_id, 0) <= faculty_max.get(s.co_incharge_id, 5)
        )
        if not co_valid:
            eligible_cos = sorted(
                [
                    f for f in faculty_pool
                    if f.id != s.incharge_id
                    and f.id not in fac_occupied.get(key, set())
                    and faculty_load.get(f.id, 0) < faculty_max.get(f.id, 5)
                ],
                key=lambda f: faculty_load.get(f.id, 0),
            )
            if eligible_cos:
                old_co = s.co_incharge_id
                s.co_incharge_id = eligible_cos[0].id
                faculty_load[s.co_incharge_id] = faculty_load.get(s.co_incharge_id, 0) + 1
                if old_co and old_co in faculty_load:
                    faculty_load[old_co] = max(0, faculty_load[old_co] - 1)
                fac_occupied.setdefault(key, set()).add(s.co_incharge_id)
                resolved_count += 1
            else:
                if s.co_incharge_id:
                    fac_occupied.setdefault(key, set()).add(s.co_incharge_id)
        else:
            fac_occupied.setdefault(key, set()).add(s.co_incharge_id)

    db.commit()
    sync_faculty_workloads(db)
    remaining = detect_conflicts(db)

    return {
        "resolved_count": resolved_count,
        "remaining_conflicts": len(remaining),
        "conflicts": remaining,
        "message": f"Auto-resolution completed. {resolved_count} allocation adjustment(s) applied.",
    }

