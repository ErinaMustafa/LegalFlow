from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal

from app.models.hearing import Hearing

from app.schemas.hearing_schema import (
    HearingCreate,
    HearingResponse
)

router = APIRouter(
    prefix="/hearings",
    tags=["Hearings"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


@router.post("/", response_model=HearingResponse)
def create_hearing(
    hearing: HearingCreate,
    db: Session = Depends(get_db)
):
    new_hearing = Hearing(
        title=hearing.title,
        court_name=hearing.court_name,
        hearing_date=hearing.hearing_date,
        status=hearing.status,
        case_id=hearing.case_id
    )

    db.add(new_hearing)

    db.commit()

    db.refresh(new_hearing)

    return new_hearing


@router.get("/", response_model=list[HearingResponse])
def get_hearings(db: Session = Depends(get_db)):
    return db.query(Hearing).all()


@router.get("/{hearing_id}", response_model=HearingResponse)
def get_hearing(
    hearing_id: int,
    db: Session = Depends(get_db)
):
    hearing = db.query(Hearing).filter(
        Hearing.id == hearing_id
    ).first()

    if not hearing:
        raise HTTPException(
            status_code=404,
            detail="Hearing not found"
        )

    return hearing


@router.put("/{hearing_id}", response_model=HearingResponse)
def update_hearing(
    hearing_id: int,
    updated_hearing: HearingCreate,
    db: Session = Depends(get_db)
):
    hearing = db.query(Hearing).filter(
        Hearing.id == hearing_id
    ).first()

    if not hearing:
        raise HTTPException(
            status_code=404,
            detail="Hearing not found"
        )

    hearing.title = updated_hearing.title

    hearing.court_name = updated_hearing.court_name

    hearing.hearing_date = updated_hearing.hearing_date

    hearing.status = updated_hearing.status

    hearing.case_id = updated_hearing.case_id

    db.commit()

    db.refresh(hearing)

    return hearing


@router.delete("/{hearing_id}")
def delete_hearing(
    hearing_id: int,
    db: Session = Depends(get_db)
):
    hearing = db.query(Hearing).filter(
        Hearing.id == hearing_id
    ).first()

    if not hearing:
        raise HTTPException(
            status_code=404,
            detail="Hearing not found"
        )

    db.delete(hearing)

    db.commit()

    return {
        "message": "Hearing deleted successfully"
    }