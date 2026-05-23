from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from datetime import datetime
from app.db.database import Base

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    appointment_date = Column(DateTime, nullable=False)
    location = Column(String, nullable=True)
    status = Column(String, default="Scheduled")
    created_at = Column(DateTime, default=datetime.utcnow)

    user_id = Column(Integer, ForeignKey("users.id"))
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=True)