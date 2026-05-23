from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from datetime import datetime
from app.db.database import Base

class Hearing(Base):
    __tablename__ = "hearings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    court_name = Column(String, nullable=True)
    hearing_date = Column(DateTime, nullable=False)
    status = Column(String, default="Scheduled")
    created_at = Column(DateTime, default=datetime.utcnow)

    case_id = Column(Integer, ForeignKey("cases.id"))