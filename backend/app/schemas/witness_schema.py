from pydantic import BaseModel
from typing import Optional

class WitnessCreate(BaseModel):
    full_name: str

    statement: Optional[str] = None

    phone: Optional[str] = None

    email: Optional[str] = None

    case_id: int

    hearing_id: Optional[int] = None


class WitnessResponse(BaseModel):
    id: int

    full_name: str

    statement: Optional[str] = None

    phone: Optional[str] = None

    email: Optional[str] = None

    case_id: int

    hearing_id: Optional[int] = None

    class Config:
        from_attributes = True
