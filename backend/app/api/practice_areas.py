from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.practice_area import PracticeArea
from app.schemas.practice_area_schema import PracticeAreaCreate, PracticeAreaResponse

router = APIRouter(prefix="/practice-areas", tags=["Practice Areas"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=PracticeAreaResponse)
def create_practice_area(practice_area: PracticeAreaCreate, db: Session = Depends(get_db)):
    new_practice_area = PracticeArea(
        name=practice_area.name,
        description=practice_area.description
    )

    db.add(new_practice_area)
    db.commit()
    db.refresh(new_practice_area)
    return new_practice_area

@router.get("/", response_model=list[PracticeAreaResponse])
def get_practice_areas(db: Session = Depends(get_db)):
    return db.query(PracticeArea).all()

@router.get("/{practice_area_id}", response_model=PracticeAreaResponse)
def get_practice_area(practice_area_id: int, db: Session = Depends(get_db)):
    practice_area = db.query(PracticeArea).filter(PracticeArea.id == practice_area_id).first()

    if not practice_area:
        raise HTTPException(status_code=404, detail="Practice area not found")

    return practice_area

@router.put("/{practice_area_id}", response_model=PracticeAreaResponse)
def update_practice_area(
    practice_area_id: int,
    updated_practice_area: PracticeAreaCreate,
    db: Session = Depends(get_db)
):
    practice_area = db.query(PracticeArea).filter(PracticeArea.id == practice_area_id).first()

    if not practice_area:
        raise HTTPException(status_code=404, detail="Practice area not found")

    practice_area.name = updated_practice_area.name
    practice_area.description = updated_practice_area.description

    db.commit()
    db.refresh(practice_area)
    return practice_area

@router.delete("/{practice_area_id}")
def delete_practice_area(practice_area_id: int, db: Session = Depends(get_db)):
    practice_area = db.query(PracticeArea).filter(PracticeArea.id == practice_area_id).first()

    if not practice_area:
        raise HTTPException(status_code=404, detail="Practice area not found")

    db.delete(practice_area)
    db.commit()

    return {"message": "Practice area deleted successfully"}
