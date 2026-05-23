from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.database import SessionLocal
from app.models.appointment import Appointment
from app.schemas.appointment_schema import AppointmentCreate, AppointmentResponse

router = APIRouter(prefix="/appointments", tags=["Appointments"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=AppointmentResponse)
def create_appointment(appointment: AppointmentCreate, db: Session = Depends(get_db)):
    status = "Completed" if appointment.appointment_date < datetime.utcnow() else "Scheduled"

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

    return new_appointment

@router.get("/", response_model=list[AppointmentResponse])
def get_appointments(db: Session = Depends(get_db)):
    return db.query(Appointment).all()

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

    appointment.title = updated_appointment.title
    appointment.description = updated_appointment.description
    appointment.appointment_date = updated_appointment.appointment_date
    appointment.location = updated_appointment.location
    appointment.status = "Completed" if updated_appointment.appointment_date < datetime.utcnow() else "Scheduled"
    appointment.user_id = updated_appointment.user_id
    appointment.client_id = updated_appointment.client_id
    appointment.case_id = updated_appointment.case_id

    db.commit()
    db.refresh(appointment)

    return appointment

@router.delete("/{appointment_id}")
def delete_appointment(appointment_id: int, db: Session = Depends(get_db)):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()

    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    db.delete(appointment)
    db.commit()

    return {"message": "Appointment deleted successfully"}