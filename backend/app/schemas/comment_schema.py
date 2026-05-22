from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CommentCreate(BaseModel):
    content: str

    created_at: Optional[datetime] = None

    user_id: int

    case_id: Optional[int] = None

    task_id: Optional[int] = None


class CommentResponse(BaseModel):
    id: int

    content: str

    created_at: Optional[datetime] = None

    user_id: int

    case_id: Optional[int] = None

    task_id: Optional[int] = None

    class Config:
        from_attributes = True
