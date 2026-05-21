from sqlalchemy import Column, Integer, String, Float, ForeignKey
from app.db.database import Base

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    payment_method = Column(String, nullable=True)
    payment_date = Column(String, nullable=True)
    status = Column(String, default="Completed")
    invoice_id = Column(Integer, ForeignKey("invoices.id"))