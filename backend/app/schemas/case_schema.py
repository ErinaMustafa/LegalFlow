from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CaseCreate(BaseModel):
    title: str
    description: str
    status: str = "Open"
    client_id: int
    practice_area_id: Optional[int] = None
    closed_at: Optional[datetime] = None

class CaseResponse(BaseModel):
    id: int
    title: str
    description: str
    status: str
    created_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    client_id: int
    practice_area_id: Optional[int] = None

    class Config:
        from_attributes = True