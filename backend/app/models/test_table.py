from sqlalchemy import Column, Integer, String
from app.db.database import Base

class TestTable(Base):
    __tablename__ = "test_table"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)