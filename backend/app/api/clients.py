from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import case
from typing import Optional

from app.core.security import require_roles
from app.db.database import SessionLocal
from app.models.client import Client
from app.schemas.client_schema import ClientCreate, ClientResponse

from app.services.cache_service import (
    delete_cache_by_pattern,
    get_cache,
    set_cache
)


router = APIRouter(prefix="/clients", tags=["Clients"])


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


@router.get("/", response_model=list[ClientResponse])
def get_clients(
    full_name: Optional[str] = Query(
        None,
        description="Smart search client full name"
    ),
    email: Optional[str] = Query(
        None,
        description="Smart search client email"
    ),
    phone: Optional[str] = Query(
        None,
        description="Search client phone number"
    ),
    address: Optional[str] = Query(
        None,
        description="Smart search client address"
    ),
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("Admin", "Lawyer", "Manager", "Assistant", "Finance")
    )
):
    cache_key = f"clients:full_name={full_name}:email={email}:phone={phone}:address={address}"

    cached_clients = get_cache(cache_key)

    if cached_clients:
        print("CACHE HIT - Clients returned from Redis")
        return cached_clients

    print("CACHE MISS - Clients returned from Supabase")

    query = db.query(Client)

    query = smart_search(query, Client.full_name, full_name)
    query = smart_search(query, Client.email, email)
    query = smart_search(query, Client.address, address)

    if phone:
        query = query.filter(
            Client.phone.ilike(f"%{phone}%")
        )

    clients = query.all()

    response = []

    for client in clients:
        response.append({
            "id": client.id,
            "full_name": client.full_name,
            "email": client.email,
            "phone": client.phone,
            "address": client.address
        })

    set_cache(cache_key, response, expire=3600)

    return response


@router.post("/", response_model=ClientResponse)
def create_client(
    client: ClientCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("Admin", "Lawyer", "Assistant")
    )
):
    new_client = Client(
        full_name=client.full_name,
        email=client.email,
        phone=client.phone,
        address=client.address
    )

    db.add(new_client)
    db.commit()
    db.refresh(new_client)

    delete_cache_by_pattern("clients:*")

    return new_client


@router.get("/{client_id}", response_model=ClientResponse)
def get_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("Admin", "Lawyer", "Manager", "Assistant", "Finance")
    )
):
    client = db.query(Client).filter(Client.id == client_id).first()

    if not client:
        raise HTTPException(
            status_code=404,
            detail="Client not found"
        )

    return client


@router.put("/{client_id}", response_model=ClientResponse)
def update_client(
    client_id: int,
    updated_client: ClientCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("Admin", "Lawyer", "Assistant")
    )
):
    client = db.query(Client).filter(Client.id == client_id).first()

    if not client:
        raise HTTPException(
            status_code=404,
            detail="Client not found"
        )

    client.full_name = updated_client.full_name
    client.email = updated_client.email
    client.phone = updated_client.phone
    client.address = updated_client.address

    db.commit()
    db.refresh(client)

    delete_cache_by_pattern("clients:*")

    return client


@router.delete("/{client_id}")
def delete_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("Admin", "Lawyer"))
):
    client = db.query(Client).filter(Client.id == client_id).first()

    if not client:
        raise HTTPException(
            status_code=404,
            detail="Client not found"
        )

    db.delete(client)
    db.commit()

    delete_cache_by_pattern("clients:*")

    return {
        "message": "Client deleted successfully"
    }