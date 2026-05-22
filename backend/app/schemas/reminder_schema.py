from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ReminderCreate(BaseModel):
    title: str

    message: str

    reminder_date: datetime

    status: str

    user_id: int

    task_id: Optional[int] = None

    hearing_id: Optional[int] = None

    calendar_event_id: Optional[int] = None


class ReminderResponse(BaseModel):
    id: int

    title: str

    message: str

    reminder_date: datetime

    status: str

    user_id: int

    task_id: Optional[int] = None

    hearing_id: Optional[int] = None

    calendar_event_id: Optional[int] = None

    class Config:
        from_attributes = True
