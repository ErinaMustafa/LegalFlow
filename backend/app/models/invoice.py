from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from datetime import datetime
from app.db.database import Base

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, unique=True, nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String, default="Unpaid")
    issued_date = Column(DateTime, default=datetime.utcnow)
    due_date = Column(DateTime, nullable=True)

    client_id = Column(Integer, ForeignKey("clients.id"))