from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from app.db.database import Base

class AIAnalysis(Base):
    __tablename__ = "ai_analyses"

    id = Column(Integer, primary_key=True, index=True)
    prompt = Column(String, nullable=False)
    result = Column(String, nullable=False)
    analysis_type = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=True)

    user_id = Column(Integer, ForeignKey("users.id"))
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
