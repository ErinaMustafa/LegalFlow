from pydantic import BaseModel
from typing import Optional

class DocumentCategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

class DocumentCategoryResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True
