from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import case
from datetime import datetime, timedelta
from typing import Optional

from app.core.security import require_roles

from app.db.database import SessionLocal
from app.models.contract import Contract
from app.models.case import Case
from app.models.client import Client
from app.schemas.contract_schema import ContractCreate, ContractResponse


from app.services.cache_service import (
    get_cache,
    set_cache,
    delete_cache_by_pattern
)

from app.background.tasks import (
    send_contract_expiration_email_background
)


router = APIRouter(prefix="/contracts", tags=["Contracts"])




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


        return query.filter(column.ilike(f"%{value}%")).order_by(
            case(
                (column.ilike(value), 0),
                (column.ilike(f"{value}%"), 1),
                (column.ilike(f"% {value}%"), 2),
                else_=3
            )
        )


    return query




def date_search(query, column, value):
    if value:
        try:
            if len(value) == 4:
                start = datetime.strptime(value, "%Y")
                end = datetime(start.year + 1, 1, 1)


            elif len(value) == 7:
                start = datetime.strptime(value, "%Y-%m")


                if start.month == 12:
                    end = datetime(start.year + 1, 1, 1)
                else:
                    end = datetime(start.year, start.month + 1, 1)


            elif len(value) == 10:
                start = datetime.strptime(value, "%Y-%m-%d")
                end = start + timedelta(days=1)


            elif len(value) == 13:
                start = datetime.strptime(value, "%Y-%m-%dT%H")
                end = start + timedelta(hours=1)


            elif len(value) == 16:
                start = datetime.strptime(value, "%Y-%m-%dT%H:%M")
                end = start + timedelta(minutes=1)


            else:
                start = datetime.fromisoformat(value)
                end = start + timedelta(seconds=1)


            return query.filter(column >= start, column < end)


        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid date format"
            )


    return query

def is_contract_near_expiration(end_date):
    if not end_date:
        return False

    now = datetime.utcnow()

    if end_date.tzinfo is not None and end_date.utcoffset() is not None:
        now = datetime.now(end_date.tzinfo)

    warning_date = now + timedelta(days=30)

    return now <= end_date <= warning_date




@router.get("/", response_model=list[ContractResponse])
def get_contracts(
    title: Optional[str] = Query(None, description="Smart search contract titles"),
    contract_type: Optional[str] = Query(None, description="Smart search contract types"),
    status: Optional[str] = Query(None, description="Smart search contract status"),
    start_date: Optional[str] = Query(None, description="Filter by start date: YYYY, YYYY-MM, YYYY-MM-DD, YYYY-MM-DDTHH, YYYY-MM-DDTHH:MM"),
    end_date: Optional[str] = Query(None, description="Filter by end date: YYYY, YYYY-MM, YYYY-MM-DD, YYYY-MM-DDTHH, YYYY-MM-DDTHH:MM"),
    case_id: Optional[int] = Query(None, description="Filter by case ID"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("Admin", "Lawyer", "Manager", "Assistant", "Finance")
    )
):
    cache_key = (
        f"contracts:"
        f"title={title}:"
        f"contract_type={contract_type}:"
        f"status={status}:"
        f"start_date={start_date}:"
        f"end_date={end_date}:"
        f"case_id={case_id}"
    )


    cached_data = get_cache(cache_key)


    if cached_data:
        print("CACHE HIT - Contracts returned from Redis")
        return cached_data


    print("CACHE MISS - Contracts returned from Supabase")


    query = db.query(Contract)


    query = smart_search(query, Contract.title, title)
    query = smart_search(query, Contract.contract_type, contract_type)
    query = smart_search(query, Contract.status, status)


    query = date_search(query, Contract.start_date, start_date)
    query = date_search(query, Contract.end_date, end_date)


    if case_id is not None:
        query = query.filter(Contract.case_id == case_id)


    contracts = query.all()


    response = []


    for contract in contracts:
        response.append({
            "id": contract.id,
            "title": contract.title,
            "contract_type": contract.contract_type,
            "status": contract.status,
            "start_date": contract.start_date.isoformat() if contract.start_date else None,
            "end_date": contract.end_date.isoformat() if contract.end_date else None,
            "case_id": contract.case_id
        })


    set_cache(cache_key, response, expire=3600)


    return response




@router.post("/", response_model=ContractResponse)
def create_contract(
    contract: ContractCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("Admin", "Lawyer"))
):
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

    delete_cache_by_pattern("contracts:*")

    if is_contract_near_expiration(new_contract.end_date):
        case = db.query(Case).filter(Case.id == new_contract.case_id).first()

        if case:
            client = db.query(Client).filter(Client.id == case.client_id).first()

            if client and client.email:
                background_tasks.add_task(
                    send_contract_expiration_email_background,
                    client.email,
                    client.full_name,
                    new_contract.title,
                    new_contract.end_date.isoformat()
                )

    return new_contract



@router.get("/{contract_id}", response_model=ContractResponse)
def get_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("Admin", "Lawyer", "Manager", "Assistant", "Finance")
    )
):
    cache_key = f"contracts:id={contract_id}"


    cached_data = get_cache(cache_key)


    if cached_data:
        print("CACHE HIT - Contract returned from Redis")
        return cached_data


    print("CACHE MISS - Contract returned from Supabase")


    contract = db.query(Contract).filter(Contract.id == contract_id).first()


    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")


    response = {
        "id": contract.id,
        "title": contract.title,
        "contract_type": contract.contract_type,
        "status": contract.status,
        "start_date": contract.start_date.isoformat() if contract.start_date else None,
        "end_date": contract.end_date.isoformat() if contract.end_date else None,
        "case_id": contract.case_id
    }


    set_cache(cache_key, response, expire=3600)


    return response




@router.put("/{contract_id}", response_model=ContractResponse)
def update_contract(
    contract_id: int,
    updated_contract: ContractCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("Admin", "Lawyer"))
):


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


    delete_cache_by_pattern("contracts:*")


    return contract




@router.delete("/{contract_id}")
def delete_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("Admin", "Lawyer"))
):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()


    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")


    db.delete(contract)
    db.commit()


    delete_cache_by_pattern("contracts:*")


    return {"message": "Contract deleted successfully"}

