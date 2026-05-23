from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PaymentCreate(BaseModel):
    amount: float
    payment_method: Optional[str] = None
    status: str = "Completed"
    invoice_id: int

class PaymentResponse(BaseModel):
    id: int
    amount: float
    payment_method: Optional[str] = None
    payment_date: Optional[datetime] = None
    status: str
    invoice_id: int

    class Config:
        from_attributes = True