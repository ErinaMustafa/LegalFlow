from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NotificationCreate(BaseModel):
    title: str
    message: str
    status: str = "Unread"
    created_at: Optional[datetime] = None
    user_id: int
    case_id: Optional[int] = None
    task_id: Optional[int] = None
    hearing_id: Optional[int] = None

class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    status: str
    created_at: Optional[datetime] = None
    user_id: int
    case_id: Optional[int] = None
    task_id: Optional[int] = None
    hearing_id: Optional[int] = None

    class Config:
        from_attributes = True
