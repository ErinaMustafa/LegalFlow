from sqlalchemy import Column, Integer, String, ForeignKey
from app.db.database import Base

class CaseNote(Base):
    __tablename__ = "case_notes"

    id = Column(Integer, primary_key=True, index=True)
    note = Column(String, nullable=False)
    created_at = Column(String, nullable=True)
    case_id = Column(Integer, ForeignKey("cases.id"))
