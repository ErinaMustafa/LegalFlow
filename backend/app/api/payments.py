from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import case
from datetime import datetime, timedelta
from typing import Optional

from app.core.security import require_roles
from app.db.database import SessionLocal
from app.models.payment import Payment
from app.models.invoice import Invoice
from app.schemas.payment_schema import PaymentCreate, PaymentResponse


from app.services.cache_service import (
    get_cache,
    set_cache,
    delete_cache_by_pattern
)


router = APIRouter(prefix="/payments", tags=["Payments"])




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




@router.get("/", response_model=list[PaymentResponse])
def get_payments(
    payment_method: Optional[str] = Query(None, description="Smart search payment method"),
    status: Optional[str] = Query(None, description="Smart search payment status"),
    amount: Optional[float] = Query(None, description="Filter by exact amount"),
    amount_min: Optional[float] = Query(None, description="Filter by minimum amount"),
    amount_max: Optional[float] = Query(None, description="Filter by maximum amount"),
    payment_date: Optional[str] = Query(None, description="Filter by payment date: YYYY, YYYY-MM, YYYY-MM-DD, YYYY-MM-DDTHH, YYYY-MM-DDTHH:MM"),
    invoice_id: Optional[int] = Query(None, description="Filter by invoice ID"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("Admin", "Finance"))
):
    cache_key = (
        f"payments:"
        f"payment_method={payment_method}:"
        f"status={status}:"
        f"amount={amount}:"
        f"amount_min={amount_min}:"
        f"amount_max={amount_max}:"
        f"payment_date={payment_date}:"
        f"invoice_id={invoice_id}"
    )


    cached_data = get_cache(cache_key)


    if cached_data:
        print("CACHE HIT - Payments returned from Redis")
        return cached_data


    print("CACHE MISS - Payments returned from Supabase")


    query = db.query(Payment)


    query = smart_search(query, Payment.payment_method, payment_method)
    query = smart_search(query, Payment.status, status)


    if amount is not None:
        query = query.filter(Payment.amount == amount)


    if amount_min is not None:
        query = query.filter(Payment.amount >= amount_min)


    if amount_max is not None:
        query = query.filter(Payment.amount <= amount_max)


    query = date_search(query, Payment.payment_date, payment_date)


    if invoice_id is not None:
        query = query.filter(Payment.invoice_id == invoice_id)


    payments = query.all()


    response = []


    for payment in payments:
        response.append({
            "id": payment.id,
            "amount": payment.amount,
            "payment_method": payment.payment_method,
            "status": payment.status,
            "payment_date": payment.payment_date.isoformat() if payment.payment_date else None,
            "invoice_id": payment.invoice_id
        })


    set_cache(cache_key, response, expire=3600)


    return response




@router.post("/", response_model=PaymentResponse)
def create_payment(
    payment: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("Admin", "Finance"))
):
    invoice = db.query(Invoice).filter(Invoice.id == payment.invoice_id).first()


    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")


    new_payment = Payment(
        amount=payment.amount,
        payment_method=payment.payment_method,
        status=payment.status,
        invoice_id=payment.invoice_id
    )


    db.add(new_payment)


    if payment.status == "Completed":
        invoice.status = "Paid"
    else:
        invoice.status = "Pending"


    db.commit()
    db.refresh(new_payment)


    delete_cache_by_pattern("payments:*")
    delete_cache_by_pattern("invoices:*")


    return new_payment




@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("Admin", "Finance"))
):
    cache_key = f"payments:id={payment_id}"


    cached_data = get_cache(cache_key)


    if cached_data:
        print("CACHE HIT - Payment returned from Redis")
        return cached_data


    print("CACHE MISS - Payment returned from Supabase")


    payment = db.query(Payment).filter(Payment.id == payment_id).first()


    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")


    response = {
        "id": payment.id,
        "amount": payment.amount,
        "payment_method": payment.payment_method,
        "status": payment.status,
        "payment_date": payment.payment_date.isoformat() if payment.payment_date else None,
        "invoice_id": payment.invoice_id
    }


    set_cache(cache_key, response, expire=3600)


    return response




@router.put("/{payment_id}", response_model=PaymentResponse)
def update_payment(
    payment_id: int,
    updated_payment: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("Admin", "Finance"))
):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()


    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")


    invoice = db.query(Invoice).filter(Invoice.id == updated_payment.invoice_id).first()


    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")


    payment.amount = updated_payment.amount
    payment.payment_method = updated_payment.payment_method
    payment.status = updated_payment.status
    payment.invoice_id = updated_payment.invoice_id


    if updated_payment.status == "Completed":
        invoice.status = "Paid"
    else:
        invoice.status = "Pending"


    db.commit()
    db.refresh(payment)


    delete_cache_by_pattern("payments:*")
    delete_cache_by_pattern("invoices:*")


    return payment




@router.delete("/{payment_id}")
def delete_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("Admin", "Finance"))
):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()


    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")


    db.delete(payment)
    db.commit()


    delete_cache_by_pattern("payments:*")
    delete_cache_by_pattern("invoices:*")


    return {"message": "Payment deleted successfully"}

