from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from services.conflict_detector import detect_conflicts, auto_resolve_conflicts

router = APIRouter(prefix="/api/conflicts", tags=["Conflicts"])


@router.get("")
@router.get("/")
def list_conflicts(db: Session = Depends(get_db)):
    """Detect and return all current conflicts in the exam schedule."""
    conflicts = detect_conflicts(db)
    return {
        "conflicts": conflicts,
        "total": len(conflicts),
        "errors": len([c for c in conflicts if c["severity"] == "error"]),
        "warnings": len([c for c in conflicts if c["severity"] == "warning"]),
    }


@router.post("/auto-resolve")
def resolve_all_conflicts(db: Session = Depends(get_db)):
    """Automatically resolve existing conflicts where possible."""
    return auto_resolve_conflicts(db)

