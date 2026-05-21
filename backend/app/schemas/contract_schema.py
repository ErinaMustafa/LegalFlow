from pydantic import BaseModel
from typing import Optional

class ContractCreate(BaseModel):
    title: str
    contract_type: Optional[str] = None
    status: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    case_id: int

class ContractResponse(BaseModel):
    id: int
    title: str
    contract_type: Optional[str] = None
    status: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    case_id: int

    class Config:
        from_attributes = True