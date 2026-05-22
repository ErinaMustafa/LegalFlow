from sqlalchemy import Column, Integer, String
from app.db.database import Base

class DocumentCategory(Base):
    __tablename__ = "document_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)
