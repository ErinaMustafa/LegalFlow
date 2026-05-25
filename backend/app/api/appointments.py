from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import case
from datetime import datetime, timedelta
from typing import Optional


from app.db.database import SessionLocal
from app.models.appointment import Appointment
from app.schemas.appointment_schema import AppointmentCreate, AppointmentResponse


from app.services.cache_service import get_cache, set_cache, delete_cache_by_pattern


router = APIRouter(prefix="/appointments", tags=["Appointments"])




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


        return query.filter(
            column.ilike(f"%{value}%")
        ).order_by(
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
                end = datetime(start.year + 1, 1, 1) if start.month == 12 else datetime(start.year, start.month + 1, 1)
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




@router.get("/", response_model=list[AppointmentResponse])
def get_appointments(
    title: Optional[str] = Query(None, description="Smart search appointment titles"),
    description: Optional[str] = Query(None, description="Smart search appointment descriptions"),
    location: Optional[str] = Query(None, description="Smart search appointment locations"),
    status: Optional[str] = Query(None, description="Smart search appointment status"),
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    client_id: Optional[int] = Query(None, description="Filter by client ID"),
    case_id: Optional[int] = Query(None, description="Filter by case ID"),
    appointment_date: Optional[str] = Query(None, description="Filter by appointment date"),
    created_at: Optional[str] = Query(None, description="Filter by created date"),
    db: Session = Depends(get_db)
):
    cache_key = f"appointments:title={title}:description={description}:location={location}:status={status}:user_id={user_id}:client_id={client_id}:case_id={case_id}:appointment_date={appointment_date}:created_at={created_at}"


    cached_data = get_cache(cache_key)


    if cached_data:
        print("CACHE HIT - Appointments returned from Redis")
        return cached_data


    print("CACHE MISS - Appointments returned from Supabase")


    query = db.query(Appointment)


    query = smart_search(query, Appointment.title, title)
    query = smart_search(query, Appointment.description, description)
    query = smart_search(query, Appointment.location, location)
    query = smart_search(query, Appointment.status, status)


    if user_id is not None:
        query = query.filter(Appointment.user_id == user_id)


    if client_id is not None:
        query = query.filter(Appointment.client_id == client_id)


    if case_id is not None:
        query = query.filter(Appointment.case_id == case_id)


    query = date_search(query, Appointment.appointment_date, appointment_date)
    query = date_search(query, Appointment.created_at, created_at)


    appointments = query.all()


    response = []


    for appointment in appointments:
        response.append({
            "id": appointment.id,
            "title": appointment.title,
            "description": appointment.description,
            "appointment_date": appointment.appointment_date.isoformat() if appointment.appointment_date else None,
            "location": appointment.location,
            "status": appointment.status,
            "user_id": appointment.user_id,
            "client_id": appointment.client_id,
            "case_id": appointment.case_id
        })


    set_cache(cache_key, response, expire=3600)


    return response




@router.post("/", response_model=AppointmentResponse)
def create_appointment(appointment: AppointmentCreate, db: Session = Depends(get_db)):
    now = datetime.utcnow().replace(tzinfo=appointment.appointment_date.tzinfo)
    status = "Completed" if appointment.appointment_date < now else "Scheduled"


    new_appointment = Appointment(
        title=appointment.title,
        description=appointment.description,
        appointment_date=appointment.appointment_date,
        location=appointment.location,
        status=status,
        user_id=appointment.user_id,
        client_id=appointment.client_id,
        case_id=appointment.case_id
    )


    db.add(new_appointment)
    db.commit()
    db.refresh(new_appointment)


    delete_cache_by_pattern("appointments:*")


    return new_appointment




@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_appointment(appointment_id: int, db: Session = Depends(get_db)):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()


    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")


    return appointment




@router.put("/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(appointment_id: int, updated_appointment: AppointmentCreate, db: Session = Depends(get_db)):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()


    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")


    now = datetime.utcnow().replace(tzinfo=updated_appointment.appointment_date.tzinfo)


    appointment.title = updated_appointment.title
    appointment.description = updated_appointment.description
    appointment.appointment_date = updated_appointment.appointment_date
    appointment.location = updated_appointment.location
    appointment.status = "Completed" if updated_appointment.appointment_date < now else "Scheduled"
    appointment.user_id = updated_appointment.user_id
    appointment.client_id = updated_appointment.client_id
    appointment.case_id = updated_appointment.case_id


    db.commit()
    db.refresh(appointment)


    delete_cache_by_pattern("appointments:*")


    return appointment




@router.delete("/{appointment_id}")
def delete_appointment(appointment_id: int, db: Session = Depends(get_db)):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()


    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")


    db.delete(appointment)
    db.commit()


    delete_cache_by_pattern("appointments:*")


    return {"message": "Appointment deleted successfully"}

