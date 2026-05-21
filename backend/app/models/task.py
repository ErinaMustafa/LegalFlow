from sqlalchemy import Column, Integer, String, ForeignKey
from app.db.database import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status = Column(String, default="To Do")
    priority = Column(String, default="Medium")
    case_id = Column(Integer, ForeignKey("cases.id"))