from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ExpenseCreate(BaseModel):
    title: str
    amount: float
    expense_date: Optional[datetime] = None
    description: Optional[str] = None
    case_id: int
    client_id: int

class ExpenseResponse(BaseModel):
    id: int
    title: str
    amount: float
    expense_date: Optional[datetime] = None
    description: Optional[str] = None
    case_id: int
    client_id: int

    class Config:
        from_attributes = True
