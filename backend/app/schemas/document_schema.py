from pydantic import BaseModel
from typing import Optional

class DocumentCreate(BaseModel):
    title: str
    file_url: Optional[str] = None
    document_type: Optional[str] = None
    case_id: int

class DocumentResponse(BaseModel):
    id: int
    title: str
    file_url: Optional[str] = None
    document_type: Optional[str] = None
    case_id: int

    class Config:
        from_attributes = True