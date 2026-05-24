from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import case
from datetime import datetime, timedelta
from typing import Optional

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


@router.get("/", response_model=list[InvoiceResponse])
def get_invoices(
    invoice_number: Optional[str] = Query(None, description="Smart search invoice number"),
    status: Optional[str] = Query(None, description="Smart search invoice status"),
    amount: Optional[float] = Query(None, description="Filter by exact amount"),
    amount_min: Optional[float] = Query(None, description="Filter by minimum amount"),
    amount_max: Optional[float] = Query(None, description="Filter by maximum amount"),
    issued_date: Optional[str] = Query(None, description="Filter by issued date: YYYY, YYYY-MM, YYYY-MM-DD, YYYY-MM-DDTHH, YYYY-MM-DDTHH:MM"),
    due_date: Optional[str] = Query(None, description="Filter by due date: YYYY, YYYY-MM, YYYY-MM-DD, YYYY-MM-DDTHH, YYYY-MM-DDTHH:MM"),
    client_id: Optional[int] = Query(None, description="Filter by client ID"),
    db: Session = Depends(get_db)
):
    query = db.query(Invoice)

    query = smart_search(query, Invoice.invoice_number, invoice_number)
    query = smart_search(query, Invoice.status, status)

    if amount is not None:
        query = query.filter(Invoice.amount == amount)

    if amount_min is not None:
        query = query.filter(Invoice.amount >= amount_min)

    if amount_max is not None:
        query = query.filter(Invoice.amount <= amount_max)

    query = date_search(query, Invoice.issued_date, issued_date)
    query = date_search(query, Invoice.due_date, due_date)

    if client_id is not None:
        query = query.filter(Invoice.client_id == client_id)

    return query.all()


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
