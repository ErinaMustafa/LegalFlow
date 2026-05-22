from pydantic import BaseModel
from typing import Optional

class CaseNoteCreate(BaseModel):
    note: str
    created_at: Optional[str] = None
    case_id: int

class CaseNoteResponse(BaseModel):
    id: int
    note: str
    created_at: Optional[str] = None
    case_id: int

    class Config:
        from_attributes = True
