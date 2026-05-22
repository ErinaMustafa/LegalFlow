from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.case_note import CaseNote
from app.schemas.case_note_schema import CaseNoteCreate, CaseNoteResponse

router = APIRouter(prefix="/case-notes", tags=["Case Notes"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=CaseNoteResponse)
def create_case_note(case_note: CaseNoteCreate, db: Session = Depends(get_db)):
    new_case_note = CaseNote(
        note=case_note.note,
        created_at=case_note.created_at,
        case_id=case_note.case_id
    )

    db.add(new_case_note)
    db.commit()
    db.refresh(new_case_note)

    return new_case_note


@router.get("/", response_model=list[CaseNoteResponse])
def get_case_notes(db: Session = Depends(get_db)):
    return db.query(CaseNote).all()


@router.get("/{case_note_id}", response_model=CaseNoteResponse)
def get_case_note(case_note_id: int, db: Session = Depends(get_db)):
    case_note = db.query(CaseNote).filter(CaseNote.id == case_note_id).first()

    if not case_note:
        raise HTTPException(status_code=404, detail="Case note not found")

    return case_note


@router.put("/{case_note_id}", response_model=CaseNoteResponse)
def update_case_note(case_note_id: int, updated_case_note: CaseNoteCreate, db: Session = Depends(get_db)):
    case_note = db.query(CaseNote).filter(CaseNote.id == case_note_id).first()

    if not case_note:
        raise HTTPException(status_code=404, detail="Case note not found")

    case_note.note = updated_case_note.note
    case_note.created_at = updated_case_note.created_at
    case_note.case_id = updated_case_note.case_id

    db.commit()
    db.refresh(case_note)

    return case_note


@router.delete("/{case_note_id}")
def delete_case_note(case_note_id: int, db: Session = Depends(get_db)):
    case_note = db.query(CaseNote).filter(CaseNote.id == case_note_id).first()

    if not case_note:
        raise HTTPException(status_code=404, detail="Case note not found")

    db.delete(case_note)
    db.commit()

    return {"message": "Case note deleted successfully"}
