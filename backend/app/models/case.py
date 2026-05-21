from sqlalchemy import Column, Integer, String, ForeignKey
from app.db.database import Base

class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    status = Column(String, default="Open")
    client_id = Column(Integer, ForeignKey("clients.id"))