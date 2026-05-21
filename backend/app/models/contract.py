from sqlalchemy import Column, Integer, String, ForeignKey
from app.db.database import Base

class Contract(Base):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    contract_type = Column(String, nullable=True)
    status = Column(String, default="Draft")
    start_date = Column(String, nullable=True)
    end_date = Column(String, nullable=True)
    case_id = Column(Integer, ForeignKey("cases.id"))