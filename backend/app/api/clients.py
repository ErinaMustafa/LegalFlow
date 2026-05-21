from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.client import Client
from app.schemas.client_schema import ClientCreate, ClientResponse

router = APIRouter(
    prefix="/clients",
    tags=["Clients"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=ClientResponse)
def create_client(client: ClientCreate, db: Session = Depends(get_db)):
    
    new_client = Client(
        full_name=client.full_name,
        email=client.email,
        phone=client.phone,
        address=client.address
    )

    db.add(new_client)
    db.commit()
    db.refresh(new_client)

    return new_client


@router.get("/", response_model=list[ClientResponse])
def get_clients(db: Session = Depends(get_db)):
    return db.query(Client).all()