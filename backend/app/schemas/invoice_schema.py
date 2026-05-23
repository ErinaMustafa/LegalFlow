from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class InvoiceCreate(BaseModel):
    invoice_number: str
    amount: float
    status: str = "Unpaid"
    due_date: Optional[datetime] = None
    client_id: int

class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    amount: float
    status: str
    issued_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    client_id: int

    class Config:
        from_attributes = True