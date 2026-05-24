from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import case
from typing import Optional

from app.db.database import SessionLocal
from app.models.witness import Witness
from app.schemas.witness_schema import (
    WitnessCreate,
    WitnessResponse
)

router = APIRouter(
    prefix="/witnesses",
    tags=["Witnesses"]
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


@router.get("/", response_model=list[WitnessResponse])
def get_witnesses(
    full_name: Optional[str] = Query(None, description="Smart search witness names"),
    statement: Optional[str] = Query(None, description="Smart search witness statements"),
    email: Optional[str] = Query(None, description="Smart search witness emails"),
    phone: Optional[str] = Query(None, description="Search witness phone number"),
    case_id: Optional[int] = Query(None, description="Filter by case ID"),
    hearing_id: Optional[int] = Query(None, description="Filter by hearing ID"),
    db: Session = Depends(get_db)
):
    query = db.query(Witness)

    query = smart_search(query, Witness.full_name, full_name)
    query = smart_search(query, Witness.statement, statement)
    query = smart_search(query, Witness.email, email)

    if phone:
        query = query.filter(
            Witness.phone.ilike(f"%{phone}%")
        )

    if case_id is not None:
        query = query.filter(Witness.case_id == case_id)

    if hearing_id is not None:
        query = query.filter(Witness.hearing_id == hearing_id)

    return query.all()


@router.post("/", response_model=WitnessResponse)
def create_witness(
    witness: WitnessCreate,
    db: Session = Depends(get_db)
):
    new_witness = Witness(
        full_name=witness.full_name,
        statement=witness.statement,
        phone=witness.phone,
        email=witness.email,
        case_id=witness.case_id,
        hearing_id=witness.hearing_id
    )

    db.add(new_witness)
    db.commit()
    db.refresh(new_witness)

    return new_witness


@router.get("/{witness_id}", response_model=WitnessResponse)
def get_witness(
    witness_id: int,
    db: Session = Depends(get_db)
):
    witness = db.query(Witness).filter(
        Witness.id == witness_id
    ).first()

    if not witness:
        raise HTTPException(
            status_code=404,
            detail="Witness not found"
        )

    return witness


@router.put("/{witness_id}", response_model=WitnessResponse)
def update_witness(
    witness_id: int,
    updated_witness: WitnessCreate,
    db: Session = Depends(get_db)
):
    witness = db.query(Witness).filter(
        Witness.id == witness_id
    ).first()

    if not witness:
        raise HTTPException(
            status_code=404,
            detail="Witness not found"
        )

    witness.full_name = updated_witness.full_name
    witness.statement = updated_witness.statement
    witness.phone = updated_witness.phone
    witness.email = updated_witness.email
    witness.case_id = updated_witness.case_id
    witness.hearing_id = updated_witness.hearing_id

    db.commit()
    db.refresh(witness)

    return witness


@router.delete("/{witness_id}")
def delete_witness(
    witness_id: int,
    db: Session = Depends(get_db)
):
    witness = db.query(Witness).filter(
        Witness.id == witness_id
    ).first()

    if not witness:
        raise HTTPException(
            status_code=404,
            detail="Witness not found"
        )

    db.delete(witness)
    db.commit()

    return {
        "message": "Witness deleted successfully"
    }
