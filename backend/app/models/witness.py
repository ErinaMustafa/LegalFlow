from sqlalchemy import Column, Integer, String, ForeignKey
from app.db.database import Base

class Witness(Base):
    __tablename__ = "witnesses"

    id = Column(Integer, primary_key=True, index=True)

    full_name = Column(String, nullable=False)

    statement = Column(String, nullable=True)

    phone = Column(String, nullable=True)

    email = Column(String, nullable=True)

    case_id = Column(Integer, ForeignKey("cases.id"))

    hearing_id = Column(Integer, ForeignKey("hearings.id"), nullable=True)
