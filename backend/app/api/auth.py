from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.user import User
from app.models.role import Role

from app.schemas.auth_schema import LoginSchema

from app.core.security import (
    verify_password,
    create_access_token
)

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/")
def auth_test():
    return {
        "message": "Auth route works"
    }


@router.post("/register")
def register():
    raise HTTPException(
        status_code=403,
        detail="Public registration is disabled. Users must be created by Admin."
    )


@router.post("/login")
def login(
    user: LoginSchema,
    db: Session = Depends(get_db)
):
    db_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if not verify_password(
        user.password,
        db_user.password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid password"
        )

    role = db.query(Role).filter(
        Role.id == db_user.role_id
    ).first()

    if not role:
        raise HTTPException(
            status_code=403,
            detail="User does not have a role assigned"
        )

    if role.name == "Client":
        raise HTTPException(
            status_code=403,
            detail="Clients are not allowed to access the internal system"
        )

    token = create_access_token({
        "sub": db_user.email,
        "user_id": db_user.id,
        "role": role.name,
        "department_id": db_user.department_id
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": db_user.id,
        "username": db_user.username,
        "email": db_user.email,
        "role": role.name,
        "department_id": db_user.department_id
    }