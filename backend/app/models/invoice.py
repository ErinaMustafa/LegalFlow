from sqlalchemy import Column, Integer, String, Float, ForeignKey
from app.db.database import Base

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, unique=True, nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String, default="Unpaid")
    issued_date = Column(String, nullable=True)
    due_date = Column(String, nullable=True)
    client_id = Column(Integer, ForeignKey("clients.id"))