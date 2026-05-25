from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session


from app.db.database import SessionLocal
from app.models.user import User
from app.models.role import Role


from app.schemas.admin_schema import CreateUserSchema
from app.core.security import hash_password


from app.services.cache_service import (
    delete_cache_by_pattern
)


router = APIRouter(prefix="/admin", tags=["Admin"])




def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()




@router.post("/create-user")
def create_user(user: CreateUserSchema, db: Session = Depends(get_db)):


    existing_user = db.query(User).filter(User.email == user.email).first()


    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")


    role = db.query(Role).filter(Role.id == user.role_id).first()


    if not role:
        raise HTTPException(status_code=404, detail="Role not found")


    hashed_pw = hash_password(user.password)


    new_user = User(
        username=user.username,
        email=user.email,
        password=hashed_pw,
        role_id=user.role_id
    )


    db.add(new_user)
    db.commit()
    db.refresh(new_user)


    delete_cache_by_pattern("users:*")
    delete_cache_by_pattern("roles:*")


    return {
        "message": f"{role.name} created successfully"
    }

