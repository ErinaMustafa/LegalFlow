from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.database import SessionLocal
from app.models.case import Case
from app.schemas.case_schema import CaseCreate, CaseResponse

router = APIRouter(prefix="/cases", tags=["Cases"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=CaseResponse)
def create_case(case: CaseCreate, db: Session = Depends(get_db)):
    new_case = Case(
        title=case.title,
        description=case.description,
        status=case.status,
        client_id=case.client_id,
        practice_area_id=case.practice_area_id
    )

    if case.status == "Closed":
        new_case.closed_at = datetime.utcnow()

    db.add(new_case)
    db.commit()
    db.refresh(new_case)

    return new_case

@router.get("/", response_model=list[CaseResponse])
def get_cases(db: Session = Depends(get_db)):
    return db.query(Case).all()

@router.get("/{case_id}", response_model=CaseResponse)
def get_case(case_id: int, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()

    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    return case

@router.put("/{case_id}", response_model=CaseResponse)
def update_case(case_id: int, updated_case: CaseCreate, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()

    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    case.title = updated_case.title
    case.description = updated_case.description
    case.status = updated_case.status
    case.client_id = updated_case.client_id
    case.practice_area_id = updated_case.practice_area_id

    if updated_case.status == "Closed":
        case.closed_at = datetime.utcnow()
    else:
        case.closed_at = None

    db.commit()
    db.refresh(case)

    return case

@router.delete("/{case_id}")
def delete_case(case_id: int, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()

    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    db.delete(case)
    db.commit()

    return {"message": "Case deleted successfully"}