from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import case
from typing import Optional

from app.db.database import SessionLocal
from app.models.practice_area import PracticeArea
from app.schemas.practice_area_schema import (
    PracticeAreaCreate,
    PracticeAreaResponse
)

router = APIRouter(
    prefix="/practice-areas",
    tags=["Practice Areas"]
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


@router.post("/", response_model=PracticeAreaResponse)
def create_practice_area(
    practice_area: PracticeAreaCreate,
    db: Session = Depends(get_db)
):
    new_practice_area = PracticeArea(
        name=practice_area.name,
        description=practice_area.description
    )

    db.add(new_practice_area)
    db.commit()
    db.refresh(new_practice_area)

    return new_practice_area


@router.get("/", response_model=list[PracticeAreaResponse])
def get_practice_areas(
    name: Optional[str] = Query(
        None,
        description="Smart search practice area names"
    ),

    description: Optional[str] = Query(
        None,
        description="Smart search practice area descriptions"
    ),

    db: Session = Depends(get_db)
):
    query = db.query(PracticeArea)

    query = smart_search(query, PracticeArea.name, name)
    query = smart_search(query, PracticeArea.description, description)

    return query.all()


@router.get("/{practice_area_id}", response_model=PracticeAreaResponse)
def get_practice_area(practice_area_id: int, db: Session = Depends(get_db)):

    practice_area = db.query(PracticeArea).filter(
        PracticeArea.id == practice_area_id
    ).first()

    if not practice_area:
        raise HTTPException(
            status_code=404,
            detail="Practice area not found"
        )

    return practice_area


@router.put("/{practice_area_id}", response_model=PracticeAreaResponse)
def update_practice_area(
    practice_area_id: int,
    updated_practice_area: PracticeAreaCreate,
    db: Session = Depends(get_db)
):
    practice_area = db.query(PracticeArea).filter(
        PracticeArea.id == practice_area_id
    ).first()

    if not practice_area:
        raise HTTPException(
            status_code=404,
            detail="Practice area not found"
        )

    practice_area.name = updated_practice_area.name
    practice_area.description = updated_practice_area.description

    db.commit()
    db.refresh(practice_area)

    return practice_area


@router.delete("/{practice_area_id}")
def delete_practice_area(practice_area_id: int, db: Session = Depends(get_db)):

    practice_area = db.query(PracticeArea).filter(
        PracticeArea.id == practice_area_id
    ).first()

    if not practice_area:
        raise HTTPException(
            status_code=404,
            detail="Practice area not found"
        )

    db.delete(practice_area)
    db.commit()

    return {"message": "Practice area deleted successfully"}
