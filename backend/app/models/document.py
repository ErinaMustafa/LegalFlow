from sqlalchemy import Column, Integer, String, ForeignKey
from app.db.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    file_url = Column(String, nullable=True)
    document_type = Column(String, nullable=True)
    case_id = Column(Integer, ForeignKey("cases.id"))