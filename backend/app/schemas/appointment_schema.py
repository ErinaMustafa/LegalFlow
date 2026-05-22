from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AppointmentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    appointment_date: datetime
    location: Optional[str] = None
    status: str
    user_id: int
    client_id: Optional[int] = None
    case_id: Optional[int] = None

class AppointmentResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    appointment_date: datetime
    location: Optional[str] = None
    status: str
    user_id: int
    client_id: Optional[int] = None
    case_id: Optional[int] = None

    class Config:
        from_attributes = True
