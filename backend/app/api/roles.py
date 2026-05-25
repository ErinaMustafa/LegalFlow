from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import case
from typing import Optional


from app.db.database import SessionLocal
from app.models.role import Role
from app.schemas.role_schema import RoleCreate, RoleResponse


from app.services.cache_service import (
    get_cache,
    set_cache,
    delete_cache_by_pattern
)


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




def smart_search(query, column, value):
    if value:
        if len(value) == 1:
            return query.filter(column.ilike(f"{value}%"))


        return query.filter(
            column.ilike(f"%{value}%")
        ).order_by(
            case(
                (column.ilike(value), 0),
                (column.ilike(f"{value}%"), 1),
                (column.ilike(f"% {value}%"), 2),
                else_=3
            )
        )


    return query




@router.post("/", response_model=RoleResponse)
def create_role(role: RoleCreate, db: Session = Depends(get_db)):


    new_role = Role(
        name=role.name
    )


    db.add(new_role)
    db.commit()
    db.refresh(new_role)


    delete_cache_by_pattern("roles:*")


    return new_role




@router.get("/", response_model=list[RoleResponse])
def get_roles(
    name: Optional[str] = Query(
        None,
        description="Smart search role names"
    ),


    db: Session = Depends(get_db)
):
    cache_key = f"roles:name={name}"


    cached_data = get_cache(cache_key)


    if cached_data:
        print("CACHE HIT - Roles returned from Redis")
        return cached_data


    print("CACHE MISS - Roles returned from Supabase")


    query = db.query(Role)


    query = smart_search(query, Role.name, name)


    roles = query.all()


    response = []


    for role in roles:
        response.append({
            "id": role.id,
            "name": role.name
        })


    set_cache(cache_key, response, expire=3600)


    return response




@router.get("/{role_id}", response_model=RoleResponse)
def get_role(role_id: int, db: Session = Depends(get_db)):


    cache_key = f"roles:id={role_id}"


    cached_data = get_cache(cache_key)


    if cached_data:
        print("CACHE HIT - Role returned from Redis")
        return cached_data


    print("CACHE MISS - Role returned from Supabase")


    role = db.query(Role).filter(Role.id == role_id).first()


    if not role:
        raise HTTPException(status_code=404, detail="Role not found")


    response = {
        "id": role.id,
        "name": role.name
    }


    set_cache(cache_key, response, expire=3600)


    return response




@router.put("/{role_id}", response_model=RoleResponse)
def update_role(role_id: int, updated_role: RoleCreate, db: Session = Depends(get_db)):


    role = db.query(Role).filter(Role.id == role_id).first()


    if not role:
        raise HTTPException(status_code=404, detail="Role not found")


    role.name = updated_role.name


    db.commit()
    db.refresh(role)


    delete_cache_by_pattern("roles:*")


    return role




@router.delete("/{role_id}")
def delete_role(role_id: int, db: Session = Depends(get_db)):


    role = db.query(Role).filter(Role.id == role_id).first()


    if not role:
        raise HTTPException(status_code=404, detail="Role not found")


    db.delete(role)
    db.commit()


    delete_cache_by_pattern("roles:*")


    return {"message": "Role deleted successfully"}

