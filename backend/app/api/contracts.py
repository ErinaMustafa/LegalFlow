from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.contract import Contract
from app.schemas.contract_schema import ContractCreate, ContractResponse

router = APIRouter(prefix="/contracts", tags=["Contracts"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=ContractResponse)
def create_contract(contract: ContractCreate, db: Session = Depends(get_db)):
    new_contract = Contract(
        title=contract.title,
        contract_type=contract.contract_type,
        status=contract.status,
        start_date=contract.start_date,
        end_date=contract.end_date,
        case_id=contract.case_id
    )

    db.add(new_contract)
    db.commit()
    db.refresh(new_contract)
    return new_contract

@router.get("/", response_model=list[ContractResponse])
def get_contracts(db: Session = Depends(get_db)):
    return db.query(Contract).all()

@router.get("/{contract_id}", response_model=ContractResponse)
def get_contract(contract_id: int, db: Session = Depends(get_db)):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()

    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    return contract

@router.put("/{contract_id}", response_model=ContractResponse)
def update_contract(contract_id: int, updated_contract: ContractCreate, db: Session = Depends(get_db)):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()

    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    contract.title = updated_contract.title
    contract.contract_type = updated_contract.contract_type
    contract.status = updated_contract.status
    contract.start_date = updated_contract.start_date
    contract.end_date = updated_contract.end_date
    contract.case_id = updated_contract.case_id

    db.commit()
    db.refresh(contract)
    return contract

@router.delete("/{contract_id}")
def delete_contract(contract_id: int, db: Session = Depends(get_db)):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()

    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    db.delete(contract)
    db.commit()

    return {"message": "Contract deleted successfully"}