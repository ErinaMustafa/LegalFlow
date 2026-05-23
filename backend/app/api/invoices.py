from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.invoice import Invoice
from app.schemas.invoice_schema import InvoiceCreate, InvoiceResponse

router = APIRouter(prefix="/invoices", tags=["Invoices"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=InvoiceResponse)
def create_invoice(invoice: InvoiceCreate, db: Session = Depends(get_db)):
    new_invoice = Invoice(
        invoice_number=invoice.invoice_number,
        amount=invoice.amount,
        status=invoice.status,
        due_date=invoice.due_date,
        client_id=invoice.client_id
    )

    db.add(new_invoice)
    db.commit()
    db.refresh(new_invoice)
    return new_invoice

@router.get("/", response_model=list[InvoiceResponse])
def get_invoices(db: Session = Depends(get_db)):
    return db.query(Invoice).all()

@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(invoice_id: int, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    return invoice

@router.put("/{invoice_id}", response_model=InvoiceResponse)
def update_invoice(invoice_id: int, updated_invoice: InvoiceCreate, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    invoice.invoice_number = updated_invoice.invoice_number
    invoice.amount = updated_invoice.amount
    invoice.status = updated_invoice.status
    invoice.issued_date = updated_invoice.issued_date
    invoice.due_date = updated_invoice.due_date
    invoice.client_id = updated_invoice.client_id

    db.commit()
    db.refresh(invoice)
    return invoice

@router.delete("/{invoice_id}")
def delete_invoice(invoice_id: int, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    db.delete(invoice)
    db.commit()

    return {"message": "Invoice deleted successfully"}