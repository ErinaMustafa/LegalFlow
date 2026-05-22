from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal

from app.models.calendar_event import CalendarEvent

from app.schemas.calendar_event_schema import (
    CalendarEventCreate,
    CalendarEventResponse
)

router = APIRouter(
    prefix="/calendar-events",
    tags=["Calendar Events"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


@router.post("/", response_model=CalendarEventResponse)
def create_calendar_event(
    event: CalendarEventCreate,
    db: Session = Depends(get_db)
):
    new_event = CalendarEvent(
        title=event.title,
        description=event.description,
        start_date=event.start_date,
        end_date=event.end_date,
        status=event.status,
        user_id=event.user_id,
        case_id=event.case_id
    )

    db.add(new_event)

    db.commit()

    db.refresh(new_event)

    return new_event


@router.get("/", response_model=list[CalendarEventResponse])
def get_calendar_events(db: Session = Depends(get_db)):
    return db.query(CalendarEvent).all()


@router.get("/{event_id}", response_model=CalendarEventResponse)
def get_calendar_event(
    event_id: int,
    db: Session = Depends(get_db)
):
    event = db.query(CalendarEvent).filter(
        CalendarEvent.id == event_id
    ).first()

    if not event:
        raise HTTPException(
            status_code=404,
            detail="Calendar event not found"
        )

    return event


@router.put("/{event_id}", response_model=CalendarEventResponse)
def update_calendar_event(
    event_id: int,
    updated_event: CalendarEventCreate,
    db: Session = Depends(get_db)
):
    event = db.query(CalendarEvent).filter(
        CalendarEvent.id == event_id
    ).first()

    if not event:
        raise HTTPException(
            status_code=404,
            detail="Calendar event not found"
        )

    event.title = updated_event.title
    event.description = updated_event.description
    event.start_date = updated_event.start_date
    event.end_date = updated_event.end_date
    event.status = updated_event.status
    event.user_id = updated_event.user_id
    event.case_id = updated_event.case_id

    db.commit()

    db.refresh(event)

    return event


@router.delete("/{event_id}")
def delete_calendar_event(
    event_id: int,
    db: Session = Depends(get_db)
):
    event = db.query(CalendarEvent).filter(
        CalendarEvent.id == event_id
    ).first()

    if not event:
        raise HTTPException(
            status_code=404,
            detail="Calendar event not found"
        )

    db.delete(event)

    db.commit()

    return {
        "message": "Calendar event deleted successfully"
    }


