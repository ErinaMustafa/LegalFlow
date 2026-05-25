from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import case
from datetime import datetime, timedelta
from typing import Optional


from app.db.database import SessionLocal
from app.models.calendar_event import CalendarEvent
from app.schemas.calendar_event_schema import CalendarEventCreate, CalendarEventResponse


from app.services.cache_service import get_cache, set_cache, delete_cache_by_pattern


router = APIRouter(prefix="/calendar-events", tags=["Calendar Events"])




def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()




def get_current_datetime_for_compare(value):
    if value and value.tzinfo is not None and value.utcoffset() is not None:
        return datetime.now(value.tzinfo)


    return datetime.utcnow()




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
            raise HTTPException(status_code=400, detail="Invalid date format")


    return query




@router.get("/", response_model=list[CalendarEventResponse])
def get_calendar_events(
    title: Optional[str] = Query(None, description="Smart search event titles"),
    description: Optional[str] = Query(None, description="Smart search event descriptions"),
    status: Optional[str] = Query(None, description="Smart search event status"),
    start_date: Optional[str] = Query(None, description="Filter by start date"),
    end_date: Optional[str] = Query(None, description="Filter by end date"),
    created_at: Optional[str] = Query(None, description="Filter by created date"),
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    case_id: Optional[int] = Query(None, description="Filter by case ID"),
    db: Session = Depends(get_db)
):
    cache_key = (
        f"calendar_events:"
        f"title={title}:description={description}:status={status}:"
        f"start_date={start_date}:end_date={end_date}:created_at={created_at}:"
        f"user_id={user_id}:case_id={case_id}"
    )


    cached_data = get_cache(cache_key)


    if cached_data:
        print("CACHE HIT - Calendar Events returned from Redis")
        return cached_data


    print("CACHE MISS - Calendar Events returned from Supabase")


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


    events = query.all()


    response = []


    for event in events:
        response.append({
            "id": event.id,
            "title": event.title,
            "description": event.description,
            "start_date": event.start_date.isoformat() if event.start_date else None,
            "end_date": event.end_date.isoformat() if event.end_date else None,
            "status": event.status,
            "created_at": event.created_at.isoformat() if event.created_at else None,
            "user_id": event.user_id,
            "case_id": event.case_id
        })


    set_cache(cache_key, response, expire=3600)


    return response




@router.post("/", response_model=CalendarEventResponse)
def create_calendar_event(event: CalendarEventCreate, db: Session = Depends(get_db)):
    if event.end_date:
        status = "Completed" if event.end_date < get_current_datetime_for_compare(event.end_date) else "Scheduled"
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


    delete_cache_by_pattern("calendar_events:*")


    return new_event




@router.get("/{event_id}", response_model=CalendarEventResponse)
def get_calendar_event(event_id: int, db: Session = Depends(get_db)):
    cache_key = f"calendar_events:id={event_id}"


    cached_data = get_cache(cache_key)


    if cached_data:
        print("CACHE HIT - Calendar Event returned from Redis")
        return cached_data


    print("CACHE MISS - Calendar Event returned from Supabase")


    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()


    if not event:
        raise HTTPException(status_code=404, detail="Calendar event not found")


    response = {
        "id": event.id,
        "title": event.title,
        "description": event.description,
        "start_date": event.start_date.isoformat() if event.start_date else None,
        "end_date": event.end_date.isoformat() if event.end_date else None,
        "status": event.status,
        "created_at": event.created_at.isoformat() if event.created_at else None,
        "user_id": event.user_id,
        "case_id": event.case_id
    }


    set_cache(cache_key, response, expire=3600)


    return response




@router.put("/{event_id}", response_model=CalendarEventResponse)
def update_calendar_event(event_id: int, updated_event: CalendarEventCreate, db: Session = Depends(get_db)):
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()


    if not event:
        raise HTTPException(status_code=404, detail="Calendar event not found")


    if updated_event.end_date:
        event.status = "Completed" if updated_event.end_date < get_current_datetime_for_compare(updated_event.end_date) else "Scheduled"
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


    delete_cache_by_pattern("calendar_events:*")


    return event




@router.delete("/{event_id}")
def delete_calendar_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()


    if not event:
        raise HTTPException(status_code=404, detail="Calendar event not found")


    db.delete(event)
    db.commit()


    delete_cache_by_pattern("calendar_events:*")


    return {"message": "Calendar event deleted successfully"}

