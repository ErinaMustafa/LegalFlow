from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CalendarEventCreate(BaseModel):
    title: str

    description: Optional[str] = None

    start_date: datetime

    end_date: Optional[datetime] = None

    status: str

    user_id: int

    case_id: Optional[int] = None


class CalendarEventResponse(BaseModel):
    id: int

    title: str

    description: Optional[str] = None

    start_date: datetime

    end_date: Optional[datetime] = None

    status: str

    user_id: int

    case_id: Optional[int] = None

    class Config:
        from_attributes = True
