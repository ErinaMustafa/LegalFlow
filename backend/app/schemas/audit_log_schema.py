
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AuditLogCreate(BaseModel):
    action: str

    entity_type: str

    entity_id: Optional[int] = None

    description: Optional[str] = None

    created_at: Optional[datetime] = None

    user_id: int


class AuditLogResponse(BaseModel):
    id: int

    action: str

    entity_type: str

    entity_id: Optional[int] = None

    description: Optional[str] = None

    created_at: Optional[datetime] = None

    user_id: int

    class Config:
        from_attributes = True
