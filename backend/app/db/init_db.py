from app.db.database import Base, engine

from app.models.role import Role
from app.models.user import User
from app.models.client import Client
from app.models.case import Case
from app.models.task import Task
from app.models.document import Document

Base.metadata.create_all(bind=engine)

print("Database tables created!")