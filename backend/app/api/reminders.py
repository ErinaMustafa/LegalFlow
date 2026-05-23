from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.database import SessionLocal
from app.models.reminder import Reminder
from app.schemas.reminder_schema import ReminderCreate, ReminderResponse

router = APIRouter(prefix="/reminders", tags=["Reminders"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=ReminderResponse)
def create_reminder(reminder: ReminderCreate, db: Session = Depends(get_db)):
    status = "Expired" if reminder.reminder_date < datetime.utcnow() else "Pending"

    new_reminder = Reminder(
        title=reminder.title,
        message=reminder.message,
        reminder_date=reminder.reminder_date,
        status=status,
        user_id=reminder.user_id,
        task_id=reminder.task_id,
        hearing_id=reminder.hearing_id,
        calendar_event_id=reminder.calendar_event_id
    )

    db.add(new_reminder)
    db.commit()
    db.refresh(new_reminder)

    return new_reminder

@router.get("/", response_model=list[ReminderResponse])
def get_reminders(db: Session = Depends(get_db)):
    return db.query(Reminder).all()

@router.get("/{reminder_id}", response_model=ReminderResponse)
def get_reminder(reminder_id: int, db: Session = Depends(get_db)):
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()

    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    return reminder

@router.put("/{reminder_id}", response_model=ReminderResponse)
def update_reminder(reminder_id: int, updated_reminder: ReminderCreate, db: Session = Depends(get_db)):
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()

    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    reminder.title = updated_reminder.title
    reminder.message = updated_reminder.message
    reminder.reminder_date = updated_reminder.reminder_date
    reminder.status = "Expired" if updated_reminder.reminder_date < datetime.utcnow() else "Pending"
    reminder.user_id = updated_reminder.user_id
    reminder.task_id = updated_reminder.task_id
    reminder.hearing_id = updated_reminder.hearing_id
    reminder.calendar_event_id = updated_reminder.calendar_event_id

    db.commit()
    db.refresh(reminder)

    return reminder

@router.delete("/{reminder_id}")
def delete_reminder(reminder_id: int, db: Session = Depends(get_db)):
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()

    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    db.delete(reminder)
    db.commit()

    return {"message": "Reminder deleted successfully"}