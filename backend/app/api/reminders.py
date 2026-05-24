from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import case
from datetime import datetime, timedelta
from typing import Optional

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
                detail="Invalid date format"
            )

    return query


@router.get("/", response_model=list[ReminderResponse])
def get_reminders(
    title: Optional[str] = Query(None, description="Smart search reminder titles"),
    message: Optional[str] = Query(None, description="Smart search reminder messages"),
    status: Optional[str] = Query(None, description="Smart search reminder status"),
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    task_id: Optional[int] = Query(None, description="Filter by task ID"),
    hearing_id: Optional[int] = Query(None, description="Filter by hearing ID"),
    calendar_event_id: Optional[int] = Query(None, description="Filter by calendar event ID"),
    reminder_date: Optional[str] = Query(None, description="Filter by reminder date: YYYY, YYYY-MM, YYYY-MM-DD, YYYY-MM-DDTHH, YYYY-MM-DDTHH:MM"),
    db: Session = Depends(get_db)
):
    query = db.query(Reminder)

    query = smart_search(query, Reminder.title, title)
    query = smart_search(query, Reminder.message, message)
    query = smart_search(query, Reminder.status, status)

    if user_id is not None:
        query = query.filter(Reminder.user_id == user_id)

    if task_id is not None:
        query = query.filter(Reminder.task_id == task_id)

    if hearing_id is not None:
        query = query.filter(Reminder.hearing_id == hearing_id)

    if calendar_event_id is not None:
        query = query.filter(Reminder.calendar_event_id == calendar_event_id)

    query = date_search(query, Reminder.reminder_date, reminder_date)

    return query.all()


@router.post("/", response_model=ReminderResponse)
def create_reminder(reminder: ReminderCreate, db: Session = Depends(get_db)):
    now = datetime.utcnow().replace(tzinfo=reminder.reminder_date.tzinfo)
    status = "Expired" if reminder.reminder_date < now else "Pending"

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

    now = datetime.utcnow().replace(tzinfo=updated_reminder.reminder_date.tzinfo)

    reminder.title = updated_reminder.title
    reminder.message = updated_reminder.message
    reminder.reminder_date = updated_reminder.reminder_date
    reminder.status = "Expired" if updated_reminder.reminder_date < now else "Pending"
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
