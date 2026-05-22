from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class HearingCreate(BaseModel):
    title: str

    court_name: Optional[str] = None

    hearing_date: datetime

    status: str

    case_id: int


class HearingResponse(BaseModel):
    id: int

    title: str

    court_name: Optional[str] = None

    hearing_date: datetime

    status: str

    case_id: int

    class Config:
        from_attributes = True