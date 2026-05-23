from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ContractCreate(BaseModel):
    title: str
    contract_type: Optional[str] = None
    status: str = "Draft"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    case_id: int

class ContractResponse(BaseModel):
    id: int
    title: str
    contract_type: Optional[str] = None
    status: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    case_id: int

    class Config:
        from_attributes = True