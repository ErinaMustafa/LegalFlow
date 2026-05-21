from app.db.database import Base, engine
from app.models.role import Role
from app.models.user import User
from app.models.client import Client

Base.metadata.create_all(bind=engine)

print("Database tables created!")