from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from app.db.database import Base

class TimeEntry(Base):
    __tablename__ = "time_entries"

    id = Column(Integer, primary_key=True, index=True)
    hours = Column(Float, nullable=False)
    description = Column(String, nullable=True)
    entry_date = Column(DateTime, nullable=True)

    user_id = Column(Integer, ForeignKey("users.id"))
    case_id = Column(Integer, ForeignKey("cases.id"))
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)

