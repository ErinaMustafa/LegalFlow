from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import case
from datetime import datetime, timedelta
from typing import Optional

from app.db.database import SessionLocal
from app.models.calendar_event import CalendarEvent
from app.schemas.calendar_event_schema import CalendarEventCreate, CalendarEventResponse

router = APIRouter(prefix="/calendar-events", tags=["Calendar Events"])


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


@router.get("/", response_model=list[CalendarEventResponse])
def get_calendar_events(
    title: Optional[str] = Query(None, description="Smart search event titles"),
    description: Optional[str] = Query(None, description="Smart search event descriptions"),
    status: Optional[str] = Query(None, description="Smart search event status"),
    start_date: Optional[str] = Query(None, description="Filter by start date: YYYY, YYYY-MM, YYYY-MM-DD, YYYY-MM-DDTHH, YYYY-MM-DDTHH:MM"),
    end_date: Optional[str] = Query(None, description="Filter by end date: YYYY, YYYY-MM, YYYY-MM-DD, YYYY-MM-DDTHH, YYYY-MM-DDTHH:MM"),
    created_at: Optional[str] = Query(None, description="Filter by created date: YYYY, YYYY-MM, YYYY-MM-DD, YYYY-MM-DDTHH, YYYY-MM-DDTHH:MM"),
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    case_id: Optional[int] = Query(None, description="Filter by case ID"),
    db: Session = Depends(get_db)
):
    query = db.query(CalendarEvent)

    query = smart_search(query, CalendarEvent.title, title)
    query = smart_search(query, CalendarEvent.description, description)
    query = smart_search(query, CalendarEvent.status, status)

    query = date_search(query, CalendarEvent.start_date, start_date)
    query = date_search(query, CalendarEvent.end_date, end_date)
    query = date_search(query, CalendarEvent.created_at, created_at)

    if user_id is not None:
        query = query.filter(CalendarEvent.user_id == user_id)

    if case_id is not None:
        query = query.filter(CalendarEvent.case_id == case_id)

    return query.all()


@router.post("/", response_model=CalendarEventResponse)
def create_calendar_event(event: CalendarEventCreate, db: Session = Depends(get_db)):
    if event.end_date:
        now = datetime.utcnow().replace(tzinfo=event.end_date.tzinfo)
        status = "Completed" if event.end_date < now else "Scheduled"
    else:
        status = "Scheduled"

    new_event = CalendarEvent(
        title=event.title,
        description=event.description,
        start_date=event.start_date,
        end_date=event.end_date,
        status=status,
        user_id=event.user_id,
        case_id=event.case_id
    )

    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    return new_event


@router.get("/{event_id}", response_model=CalendarEventResponse)
def get_calendar_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Calendar event not found")

    return event


@router.put("/{event_id}", response_model=CalendarEventResponse)
def update_calendar_event(event_id: int, updated_event: CalendarEventCreate, db: Session = Depends(get_db)):
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Calendar event not found")

    if updated_event.end_date:
        now = datetime.utcnow().replace(tzinfo=updated_event.end_date.tzinfo)
        event.status = "Completed" if updated_event.end_date < now else "Scheduled"
    else:
        event.status = "Scheduled"

    event.title = updated_event.title
    event.description = updated_event.description
    event.start_date = updated_event.start_date
    event.end_date = updated_event.end_date
    event.user_id = updated_event.user_id
    event.case_id = updated_event.case_id

    db.commit()
    db.refresh(event)

    return event


@router.delete("/{event_id}")
def delete_calendar_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Calendar event not found")

    db.delete(event)
    db.commit()

    return {"message": "Calendar event deleted successfully"}
