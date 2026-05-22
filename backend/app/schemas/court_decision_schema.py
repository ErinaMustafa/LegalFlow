from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CourtDecisionCreate(BaseModel):
    title: str
    decision_text: str
    decision_date: Optional[datetime] = None
    status: str
    case_id: int
    hearing_id: Optional[int] = None
    document_id: Optional[int] = None

class CourtDecisionResponse(BaseModel):
    id: int
    title: str
    decision_text: str
    decision_date: Optional[datetime] = None
    status: str
    case_id: int
    hearing_id: Optional[int] = None
    document_id: Optional[int] = None

    class Config:
        from_attributes = True
