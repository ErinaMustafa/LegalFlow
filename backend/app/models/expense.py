from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from app.db.database import Base

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    expense_date = Column(DateTime, nullable=True)
    description = Column(String, nullable=True)

    case_id = Column(Integer, ForeignKey("cases.id"))
    client_id = Column(Integer, ForeignKey("clients.id"))
