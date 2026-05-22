from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

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


@router.get("/", response_model=list[WitnessResponse])
def get_witnesses(db: Session = Depends(get_db)):
    return db.query(Witness).all()


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

