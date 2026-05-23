from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from datetime import datetime
from app.db.database import Base

class CourtDecision(Base):
    __tablename__ = "court_decisions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    decision_text = Column(String, nullable=False)
    decision_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="Issued")

    case_id = Column(Integer, ForeignKey("cases.id"))
    hearing_id = Column(Integer, ForeignKey("hearings.id"), nullable=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)