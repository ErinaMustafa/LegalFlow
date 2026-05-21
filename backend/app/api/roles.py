from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.role import Role
from app.schemas.role_schema import RoleCreate, RoleResponse

router = APIRouter(
    prefix="/roles",
    tags=["Roles"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=RoleResponse)
def create_role(role: RoleCreate, db: Session = Depends(get_db)):

    new_role = Role(
        name=role.name
    )

    db.add(new_role)
    db.commit()
    db.refresh(new_role)

    return new_role


@router.get("/", response_model=list[RoleResponse])
def get_roles(db: Session = Depends(get_db)):

    roles = db.query(Role).all()

    return roles


@router.get("/{role_id}", response_model=RoleResponse)
def get_role(role_id: int, db: Session = Depends(get_db)):

    role = db.query(Role).filter(Role.id == role_id).first()

    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    return role


@router.put("/{role_id}", response_model=RoleResponse)
def update_role(role_id: int, updated_role: RoleCreate, db: Session = Depends(get_db)):

    role = db.query(Role).filter(Role.id == role_id).first()

    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    role.name = updated_role.name

    db.commit()
    db.refresh(role)

    return role


@router.delete("/{role_id}")
def delete_role(role_id: int, db: Session = Depends(get_db)):

    role = db.query(Role).filter(Role.id == role_id).first()

    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    db.delete(role)
    db.commit()

    return {"message": "Role deleted successfully"}