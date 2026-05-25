from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import case
from typing import Optional

from app.db.database import SessionLocal
from app.models.department import Department
from app.schemas.department_schema import DepartmentCreate, DepartmentResponse

from app.core.security import require_roles

from app.services.cache_service import (
    get_cache,
    set_cache,
    delete_cache_by_pattern
)

router = APIRouter(prefix="/departments", tags=["Departments"])


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


@router.post("/", response_model=DepartmentResponse)
def create_department(
    department: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("Admin"))
):
    new_department = Department(
        name=department.name,
        description=department.description
    )

    db.add(new_department)
    db.commit()
    db.refresh(new_department)

    delete_cache_by_pattern("departments:*")

    return new_department


@router.get("/", response_model=list[DepartmentResponse])
def get_departments(
    name: Optional[str] = Query(None, description="Smart search department names"),
    description: Optional[str] = Query(None, description="Smart search department descriptions"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("Admin"))
):
    cache_key = (
        f"departments:"
        f"name={name}:"
        f"description={description}"
    )

    cached_data = get_cache(cache_key)

    if cached_data:
        print("CACHE HIT - Departments returned from Redis")
        return cached_data

    print("CACHE MISS - Departments returned from Supabase")

    query = db.query(Department)

    query = smart_search(query, Department.name, name)
    query = smart_search(query, Department.description, description)

    departments = query.all()

    response = []

    for department in departments:
        response.append({
            "id": department.id,
            "name": department.name,
            "description": department.description
        })

    set_cache(cache_key, response, expire=3600)

    return response


@router.get("/{department_id}", response_model=DepartmentResponse)
def get_department(
    department_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("Admin"))
):
    cache_key = f"departments:id={department_id}"

    cached_data = get_cache(cache_key)

    if cached_data:
        print("CACHE HIT - Department returned from Redis")
        return cached_data

    print("CACHE MISS - Department returned from Supabase")

    department = db.query(Department).filter(Department.id == department_id).first()

    if not department:
        raise HTTPException(status_code=404, detail="Department not found")

    response = {
        "id": department.id,
        "name": department.name,
        "description": department.description
    }

    set_cache(cache_key, response, expire=3600)

    return response


@router.put("/{department_id}", response_model=DepartmentResponse)
def update_department(
    department_id: int,
    updated_department: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("Admin"))
):
    department = db.query(Department).filter(Department.id == department_id).first()

    if not department:
        raise HTTPException(status_code=404, detail="Department not found")

    department.name = updated_department.name
    department.description = updated_department.description

    db.commit()
    db.refresh(department)

    delete_cache_by_pattern("departments:*")

    return department


@router.delete("/{department_id}")
def delete_department(
    department_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("Admin"))
):
    department = db.query(Department).filter(Department.id == department_id).first()

    if not department:
        raise HTTPException(status_code=404, detail="Department not found")

    db.delete(department)
    db.commit()

    delete_cache_by_pattern("departments:*")

    return {
        "message": "Department deleted successfully"
    }