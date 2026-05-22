from pydantic import BaseModel
from typing import Optional

class PracticeAreaCreate(BaseModel):
    name: str
    description: Optional[str] = None

class PracticeAreaResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True
