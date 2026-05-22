from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.department import Department
from app.schemas.department_schema import DepartmentCreate, DepartmentResponse

router = APIRouter(prefix="/departments", tags=["Departments"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=DepartmentResponse)
def create_department(department: DepartmentCreate, db: Session = Depends(get_db)):
    new_department = Department(
        name=department.name,
        description=department.description
    )

    db.add(new_department)
    db.commit()
    db.refresh(new_department)
    return new_department

@router.get("/", response_model=list[DepartmentResponse])
def get_departments(db: Session = Depends(get_db)):
    return db.query(Department).all()

@router.get("/{department_id}", response_model=DepartmentResponse)
def get_department(department_id: int, db: Session = Depends(get_db)):
    department = db.query(Department).filter(Department.id == department_id).first()

    if not department:
        raise HTTPException(status_code=404, detail="Department not found")

    return department

@router.put("/{department_id}", response_model=DepartmentResponse)
def update_department(department_id: int, updated_department: DepartmentCreate, db: Session = Depends(get_db)):
    department = db.query(Department).filter(Department.id == department_id).first()

    if not department:
        raise HTTPException(status_code=404, detail="Department not found")

    department.name = updated_department.name
    department.description = updated_department.description

    db.commit()
    db.refresh(department)
    return department

@router.delete("/{department_id}")
def delete_department(department_id: int, db: Session = Depends(get_db)):
    department = db.query(Department).filter(Department.id == department_id).first()

    if not department:
        raise HTTPException(status_code=404, detail="Department not found")

    db.delete(department)
    db.commit()

    return {"message": "Department deleted successfully"}
