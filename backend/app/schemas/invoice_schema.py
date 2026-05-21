from pydantic import BaseModel
from typing import Optional

class InvoiceCreate(BaseModel):
    invoice_number: str
    amount: float
    status: str
    issued_date: Optional[str] = None
    due_date: Optional[str] = None
    client_id: int

class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    amount: float
    status: str
    issued_date: Optional[str] = None
    due_date: Optional[str] = None
    client_id: int

    class Config:
        from_attributes = True