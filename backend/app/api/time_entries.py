from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import case
from datetime import datetime, timedelta
from typing import Optional

from app.core.security import require_roles
from app.db.database import SessionLocal
from app.models.time_entry import TimeEntry
from app.schemas.time_entry_schema import TimeEntryCreate, TimeEntryResponse


from app.services.cache_service import (
    get_cache,
    set_cache,
    delete_cache_by_pattern
)


router = APIRouter(prefix="/time-entries", tags=["Time Entries"])




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




@router.get("/", response_model=list[TimeEntryResponse])
def get_time_entries(
    description: Optional[str] = Query(None, description="Smart search time entry descriptions"),


    hours: Optional[float] = Query(None, description="Filter by exact hours"),
    hours_min: Optional[float] = Query(None, description="Filter by minimum hours"),
    hours_max: Optional[float] = Query(None, description="Filter by maximum hours"),


    entry_date: Optional[str] = Query(
        None,
        description="Filter by entry date: YYYY, YYYY-MM, YYYY-MM-DD, YYYY-MM-DDTHH, YYYY-MM-DDTHH:MM"
    ),


    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    case_id: Optional[int] = Query(None, description="Filter by case ID"),
    task_id: Optional[int] = Query(None, description="Filter by task ID"),


   db: Session = Depends(get_db),
    current_user: dict = Depends(
    require_roles("Admin", "Lawyer", "Manager", "Finance")
)
):
    cache_key = (
        f"time_entries:"
        f"description={description}:"
        f"hours={hours}:"
        f"hours_min={hours_min}:"
        f"hours_max={hours_max}:"
        f"entry_date={entry_date}:"
        f"user_id={user_id}:"
        f"case_id={case_id}:"
        f"task_id={task_id}"
    )


    cached_data = get_cache(cache_key)


    if cached_data:
        print("CACHE HIT - Time Entries returned from Redis")
        return cached_data


    print("CACHE MISS - Time Entries returned from Supabase")


    query = db.query(TimeEntry)


    query = smart_search(query, TimeEntry.description, description)


    if hours is not None:
        query = query.filter(TimeEntry.hours == hours)


    if hours_min is not None:
        query = query.filter(TimeEntry.hours >= hours_min)


    if hours_max is not None:
        query = query.filter(TimeEntry.hours <= hours_max)


    query = date_search(query, TimeEntry.entry_date, entry_date)


    if user_id is not None:
        query = query.filter(TimeEntry.user_id == user_id)


    if case_id is not None:
        query = query.filter(TimeEntry.case_id == case_id)


    if task_id is not None:
        query = query.filter(TimeEntry.task_id == task_id)


    time_entries = query.all()


    response = []


    for time_entry in time_entries:
        response.append({
            "id": time_entry.id,
            "hours": time_entry.hours,
            "description": time_entry.description,
            "entry_date": time_entry.entry_date.isoformat() if time_entry.entry_date else None,
            "user_id": time_entry.user_id,
            "case_id": time_entry.case_id,
            "task_id": time_entry.task_id
        })


    set_cache(cache_key, response, expire=3600)


    return response




@router.post("/", response_model=TimeEntryResponse)
def create_time_entry(
    time_entry: TimeEntryCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("Admin", "Lawyer"))
):
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


    delete_cache_by_pattern("time_entries:*")


    return new_time_entry




@router.get("/{time_entry_id}", response_model=TimeEntryResponse)
def get_time_entry(
    time_entry_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("Admin", "Lawyer", "Manager", "Finance")
    )
):
    cache_key = f"time_entries:id={time_entry_id}"


    cached_data = get_cache(cache_key)


    if cached_data:
        print("CACHE HIT - Time Entry returned from Redis")
        return cached_data


    print("CACHE MISS - Time Entry returned from Supabase")


    time_entry = db.query(TimeEntry).filter(TimeEntry.id == time_entry_id).first()


    if not time_entry:
        raise HTTPException(status_code=404, detail="Time entry not found")


    response = {
        "id": time_entry.id,
        "hours": time_entry.hours,
        "description": time_entry.description,
        "entry_date": time_entry.entry_date.isoformat() if time_entry.entry_date else None,
        "user_id": time_entry.user_id,
        "case_id": time_entry.case_id,
        "task_id": time_entry.task_id
    }


    set_cache(cache_key, response, expire=3600)


    return response




@router.put("/{time_entry_id}", response_model=TimeEntryResponse)
def update_time_entry(
    time_entry_id: int,
    updated_time_entry: TimeEntryCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("Admin", "Lawyer"))
):
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


    delete_cache_by_pattern("time_entries:*")


    return time_entry




@router.delete("/{time_entry_id}")
def delete_time_entry(
    time_entry_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("Admin"))
):
    time_entry = db.query(TimeEntry).filter(TimeEntry.id == time_entry_id).first()


    if not time_entry:
        raise HTTPException(status_code=404, detail="Time entry not found")


    db.delete(time_entry)
    db.commit()


    delete_cache_by_pattern("time_entries:*")


    return {"message": "Time entry deleted successfully"}

