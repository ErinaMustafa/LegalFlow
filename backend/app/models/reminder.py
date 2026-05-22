from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from app.db.database import Base

class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String, nullable=False)

    message = Column(String, nullable=False)

    reminder_date = Column(DateTime, nullable=False)

    status = Column(String, default="Pending")

    user_id = Column(Integer, ForeignKey("users.id"))

    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)

    hearing_id = Column(Integer, ForeignKey("hearings.id"), nullable=True)

    calendar_event_id = Column(
        Integer,
        ForeignKey("calendar_events.id"),
        nullable=True
    )
