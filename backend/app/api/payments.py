from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.payment import Payment
from app.models.invoice import Invoice
from app.schemas.payment_schema import PaymentCreate, PaymentResponse

router = APIRouter(prefix="/payments", tags=["Payments"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=PaymentResponse)
def create_payment(payment: PaymentCreate, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == payment.invoice_id).first()

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    new_payment = Payment(
        amount=payment.amount,
        payment_method=payment.payment_method,
        payment_date=payment.payment_date,
        status=payment.status,
        invoice_id=payment.invoice_id
    )

    db.add(new_payment)

    if payment.status == "Completed":
        invoice.status = "Paid"

    db.commit()
    db.refresh(new_payment)

    return new_payment


@router.get("/", response_model=list[PaymentResponse])
def get_payments(db: Session = Depends(get_db)):
    return db.query(Payment).all()


@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(payment_id: int, db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()

    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    return payment


@router.put("/{payment_id}", response_model=PaymentResponse)
def update_payment(payment_id: int, updated_payment: PaymentCreate, db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()

    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    invoice = db.query(Invoice).filter(Invoice.id == updated_payment.invoice_id).first()

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    payment.amount = updated_payment.amount
    payment.payment_method = updated_payment.payment_method
    payment.payment_date = updated_payment.payment_date
    payment.status = updated_payment.status
    payment.invoice_id = updated_payment.invoice_id

    if updated_payment.status == "Completed":
        invoice.status = "Paid"

    db.commit()
    db.refresh(payment)

    return payment


@router.delete("/{payment_id}")
def delete_payment(payment_id: int, db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()

    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    db.delete(payment)
    db.commit()

    return {"message": "Payment deleted successfully"}