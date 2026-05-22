from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from app.db.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)

    action = Column(String, nullable=False)

    entity_type = Column(String, nullable=False)

    entity_id = Column(Integer, nullable=True)

    description = Column(String, nullable=True)

    created_at = Column(DateTime, nullable=True)

    user_id = Column(Integer, ForeignKey("users.id"))
