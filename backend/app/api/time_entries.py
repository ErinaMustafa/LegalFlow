from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.time_entry import TimeEntry
from app.schemas.time_entry_schema import TimeEntryCreate, TimeEntryResponse

router = APIRouter(prefix="/time-entries", tags=["Time Entries"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=TimeEntryResponse)
def create_time_entry(time_entry: TimeEntryCreate, db: Session = Depends(get_db)):
    new_time_entry = TimeEntry(
        hours=time_entry.hours,
        description=time_entry.description,
        entry_date=time_entry.entry_date,
        user_id=time_entry.user_id,
        case_id=time_entry.case_id,
        task_id=time_entry.task_id
    )

    db.add(new_time_entry)
    db.commit()
    db.refresh(new_time_entry)
    return new_time_entry

@router.get("/", response_model=list[TimeEntryResponse])
def get_time_entries(db: Session = Depends(get_db)):
    return db.query(TimeEntry).all()

@router.get("/{time_entry_id}", response_model=TimeEntryResponse)
def get_time_entry(time_entry_id: int, db: Session = Depends(get_db)):
    time_entry = db.query(TimeEntry).filter(TimeEntry.id == time_entry_id).first()

    if not time_entry:
        raise HTTPException(status_code=404, detail="Time entry not found")

    return time_entry

@router.put("/{time_entry_id}", response_model=TimeEntryResponse)
def update_time_entry(time_entry_id: int, updated_time_entry: TimeEntryCreate, db: Session = Depends(get_db)):
    time_entry = db.query(TimeEntry).filter(TimeEntry.id == time_entry_id).first()

    if not time_entry:
        raise HTTPException(status_code=404, detail="Time entry not found")

    time_entry.hours = updated_time_entry.hours
    time_entry.description = updated_time_entry.description
    time_entry.entry_date = updated_time_entry.entry_date
    time_entry.user_id = updated_time_entry.user_id
    time_entry.case_id = updated_time_entry.case_id
    time_entry.task_id = updated_time_entry.task_id

    db.commit()
    db.refresh(time_entry)
    return time_entry

@router.delete("/{time_entry_id}")
def delete_time_entry(time_entry_id: int, db: Session = Depends(get_db)):
    time_entry = db.query(TimeEntry).filter(TimeEntry.id == time_entry_id).first()

    if not time_entry:
        raise HTTPException(status_code=404, detail="Time entry not found")

    db.delete(time_entry)
    db.commit()

    return {"message": "Time entry deleted successfully"}
