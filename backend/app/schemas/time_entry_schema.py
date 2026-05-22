from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TimeEntryCreate(BaseModel):
    hours: float
    description: Optional[str] = None
    entry_date: Optional[datetime] = None
    user_id: int
    case_id: int
    task_id: Optional[int] = None

class TimeEntryResponse(BaseModel):
    id: int
    hours: float
    description: Optional[str] = None
    entry_date: Optional[datetime] = None
    user_id: int
    case_id: int
    task_id: Optional[int] = None

    class Config:
        from_attributes = True
