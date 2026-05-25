from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session


from app.db.database import SessionLocal
from app.models.user import User
from app.models.role import Role
from app.schemas.auth_schema import RegisterSchema, LoginSchema
from app.core.security import hash_password, verify_password, create_access_token


from app.services.cache_service import delete_cache_by_pattern


router = APIRouter(prefix="/auth", tags=["Auth"])




def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()




@router.get("/")
def auth_test():
    return {"message": "Auth route works"}




@router.post("/register")
def register(user: RegisterSchema, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()


    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")


    client_role = db.query(Role).filter(Role.name == "Client").first()


    if not client_role:
        raise HTTPException(
            status_code=400,
            detail="Client role does not exist. Create role 'Client' first."
        )


    hashed_pw = hash_password(user.password)


    new_user = User(
        username=user.username,
        email=user.email,
        password=hashed_pw,
        role_id=client_role.id
    )


    db.add(new_user)
    db.commit()
    db.refresh(new_user)


    delete_cache_by_pattern("users:*")
    delete_cache_by_pattern("roles:*")


    return {
        "message": "User created successfully",
        "user_id": new_user.id,
        "role": client_role.name,
        "department_id": new_user.department_id
    }




@router.post("/login")
def login(user: LoginSchema, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()


    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")


    if not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid password")


    role = db.query(Role).filter(Role.id == db_user.role_id).first()


    token = create_access_token({
        "sub": db_user.email,
        "user_id": db_user.id,
        "role": role.name if role else None,
        "department_id": db_user.department_id
    })


    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": db_user.id,
        "username": db_user.username,
        "email": db_user.email,
        "role": role.name if role else None,
        "department_id": db_user.department_id
    }

