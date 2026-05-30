from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session




from app.db.database import SessionLocal




from app.models.user import User
from app.models.role import Role




from app.schemas.admin_schema import (
    CreateUserSchema,
    ResetPasswordSchema,
    UpdateUserSchema
)
from app.core.security import (
    hash_password,
    require_roles
)




from app.services.cache_service import (
    delete_cache_by_pattern
)




router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)








def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()








@router.post(
    "/create-user",
    operation_id="admin_create_system_user"
)
def admin_create_user(
    user: CreateUserSchema,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("Admin"))
):




    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()




    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )




    role = db.query(Role).filter(
        Role.id == user.role_id
    ).first()




    if not role:
        raise HTTPException(
            status_code=404,
            detail="Role not found"
        )




    if role.name == "Client":
        raise HTTPException(
            status_code=400,
            detail="Client role cannot be assigned to system users"
        )




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
        "message": f"{role.name} created successfully",
        "user_id": new_user.id,
        "role": role.name
    }


   




@router.put(
    "/reset-password",
    operation_id="admin_reset_user_password"
    )
def admin_reset_password(
        request: ResetPasswordSchema,
        db: Session = Depends(get_db),
        current_user: dict = Depends(require_roles("Admin"))
    ):
        if not request.user_id and not request.email:
            raise HTTPException(
                status_code=400,
                detail="Provide user_id or email"
            )




        if request.user_id:
            db_user = db.query(User).filter(
                User.id == request.user_id
            ).first()
        else:
            db_user = db.query(User).filter(
                User.email == request.email
            ).first()




        if not db_user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )




        db_user.password = hash_password(request.new_password)




        db.commit()
        db.refresh(db_user)




        delete_cache_by_pattern("users:*")
        delete_cache_by_pattern("roles:*")




        return {
            "message": "Password reset successfully",
            "user_id": db_user.id,
            "email": db_user.email
        }


@router.get("/users")
def get_users(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("Admin"))
):
    users = db.query(User).all()


    return [
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role_id": user.role_id,
            "department_id": user.department_id
        }
        for user in users
    ]


@router.put("/users/{user_id}")
def update_user(
    user_id: int,
    user: UpdateUserSchema,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("Admin"))
):
    db_user = db.query(User).filter(User.id == user_id).first()


    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")


    role = db.query(Role).filter(Role.id == user.role_id).first()


    if not role:
        raise HTTPException(status_code=404, detail="Role not found")


    if role.name == "Client":
        raise HTTPException(
            status_code=400,
            detail="Client role cannot be assigned to system users"
        )


    db_user.username = user.username
    db_user.email = user.email
    db_user.role_id = user.role_id
    db_user.department_id = user.department_id


    if user.password:
        db_user.password = hash_password(user.password)


    db.commit()
    db.refresh(db_user)


    delete_cache_by_pattern("users:*")
    delete_cache_by_pattern("roles:*")


    return {
        "message": "User updated successfully",
        "user_id": db_user.id
    }




@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("Admin"))
):
    db_user = db.query(User).filter(User.id == user_id).first()


    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")


    db.delete(db_user)
    db.commit()


    delete_cache_by_pattern("users:*")
    delete_cache_by_pattern("roles:*")


    return {
        "message": "User deleted successfully"
    }





