from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import case
from datetime import datetime, timedelta
from typing import Optional

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


def smart_search(query, column, value):
    if value:
        if len(value) == 1:
            return query.filter(column.ilike(f"{value}%"))

        return query.filter(column.ilike(f"%{value}%")).order_by(
            case(
                (column.ilike(value), 0),
                (column.ilike(f"{value}%"), 1),
                (column.ilike(f"% {value}%"), 2),
                else_=3
            )
        )

    return query


def date_search(query, column, value):
    if value:
        try:
            if len(value) == 4:
                start = datetime.strptime(value, "%Y")
                end = datetime(start.year + 1, 1, 1)

            elif len(value) == 7:
                start = datetime.strptime(value, "%Y-%m")

                if start.month == 12:
                    end = datetime(start.year + 1, 1, 1)
                else:
                    end = datetime(start.year, start.month + 1, 1)

            elif len(value) == 10:
                start = datetime.strptime(value, "%Y-%m-%d")
                end = start + timedelta(days=1)

            elif len(value) == 13:
                start = datetime.strptime(value, "%Y-%m-%dT%H")
                end = start + timedelta(hours=1)

            elif len(value) == 16:
                start = datetime.strptime(value, "%Y-%m-%dT%H:%M")
                end = start + timedelta(minutes=1)

            else:
                start = datetime.fromisoformat(value)
                end = start + timedelta(seconds=1)

            return query.filter(column >= start, column < end)

        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid date format. Use YYYY, YYYY-MM, YYYY-MM-DD, YYYY-MM-DDTHH, or YYYY-MM-DDTHH:MM"
            )

    return query


@router.get("/", response_model=list[CaseNoteResponse])
def get_case_notes(
    note: Optional[str] = Query(None, description="Smart search case notes"),
    case_id: Optional[int] = Query(None, description="Filter by case ID"),
    created_at: Optional[str] = Query(None, description="Filter by created date: YYYY, YYYY-MM, YYYY-MM-DD, YYYY-MM-DDTHH, YYYY-MM-DDTHH:MM"),
    db: Session = Depends(get_db)
):
    query = db.query(CaseNote)

    query = smart_search(query, CaseNote.note, note)

    if case_id is not None:
        query = query.filter(CaseNote.case_id == case_id)

    query = date_search(query, CaseNote.created_at, created_at)

    return query.all()


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
