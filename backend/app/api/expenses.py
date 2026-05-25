from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import case
from datetime import datetime, timedelta
from typing import Optional


from app.db.database import SessionLocal
from app.models.expense import Expense
from app.schemas.expense_schema import ExpenseCreate, ExpenseResponse


from app.services.cache_service import (
    get_cache,
    set_cache,
    delete_cache_by_pattern
)


router = APIRouter(prefix="/expenses", tags=["Expenses"])




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




@router.get("/", response_model=list[ExpenseResponse])
def get_expenses(
    title: Optional[str] = Query(None, description="Smart search expense titles"),
    description: Optional[str] = Query(None, description="Smart search expense descriptions"),


    amount: Optional[float] = Query(None, description="Filter by exact amount"),
    amount_min: Optional[float] = Query(None, description="Filter by minimum amount"),
    amount_max: Optional[float] = Query(None, description="Filter by maximum amount"),


    expense_date: Optional[str] = Query(
        None,
        description="Filter by expense date: YYYY, YYYY-MM, YYYY-MM-DD, YYYY-MM-DDTHH, YYYY-MM-DDTHH:MM"
    ),


    case_id: Optional[int] = Query(None, description="Filter by case ID"),
    client_id: Optional[int] = Query(None, description="Filter by client ID"),


    db: Session = Depends(get_db)
):
    cache_key = (
        f"expenses:"
        f"title={title}:"
        f"description={description}:"
        f"amount={amount}:"
        f"amount_min={amount_min}:"
        f"amount_max={amount_max}:"
        f"expense_date={expense_date}:"
        f"case_id={case_id}:"
        f"client_id={client_id}"
    )


    cached_data = get_cache(cache_key)


    if cached_data:
        print("CACHE HIT - Expenses returned from Redis")
        return cached_data


    print("CACHE MISS - Expenses returned from Supabase")


    query = db.query(Expense)


    query = smart_search(query, Expense.title, title)
    query = smart_search(query, Expense.description, description)


    if amount is not None:
        query = query.filter(Expense.amount == amount)


    if amount_min is not None:
        query = query.filter(Expense.amount >= amount_min)


    if amount_max is not None:
        query = query.filter(Expense.amount <= amount_max)


    query = date_search(query, Expense.expense_date, expense_date)


    if case_id is not None:
        query = query.filter(Expense.case_id == case_id)


    if client_id is not None:
        query = query.filter(Expense.client_id == client_id)


    expenses = query.all()


    response = []


    for expense in expenses:
        response.append({
            "id": expense.id,
            "title": expense.title,
            "amount": expense.amount,
            "expense_date": expense.expense_date.isoformat() if expense.expense_date else None,
            "description": expense.description,
            "case_id": expense.case_id,
            "client_id": expense.client_id
        })


    set_cache(cache_key, response, expire=3600)


    return response




@router.post("/", response_model=ExpenseResponse)
def create_expense(expense: ExpenseCreate, db: Session = Depends(get_db)):
    new_expense = Expense(
        title=expense.title,
        amount=expense.amount,
        expense_date=expense.expense_date,
        description=expense.description,
        case_id=expense.case_id,
        client_id=expense.client_id
    )


    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)


    delete_cache_by_pattern("expenses:*")


    return new_expense




@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(expense_id: int, db: Session = Depends(get_db)):
    cache_key = f"expenses:id={expense_id}"


    cached_data = get_cache(cache_key)


    if cached_data:
        print("CACHE HIT - Expense returned from Redis")
        return cached_data


    print("CACHE MISS - Expense returned from Supabase")


    expense = db.query(Expense).filter(Expense.id == expense_id).first()


    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")


    response = {
        "id": expense.id,
        "title": expense.title,
        "amount": expense.amount,
        "expense_date": expense.expense_date.isoformat() if expense.expense_date else None,
        "description": expense.description,
        "case_id": expense.case_id,
        "client_id": expense.client_id
    }


    set_cache(cache_key, response, expire=3600)


    return response




@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(expense_id: int, updated_expense: ExpenseCreate, db: Session = Depends(get_db)):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()


    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")


    expense.title = updated_expense.title
    expense.amount = updated_expense.amount
    expense.expense_date = updated_expense.expense_date
    expense.description = updated_expense.description
    expense.case_id = updated_expense.case_id
    expense.client_id = updated_expense.client_id


    db.commit()
    db.refresh(expense)


    delete_cache_by_pattern("expenses:*")


    return expense




@router.delete("/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()


    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")


    db.delete(expense)
    db.commit()


    delete_cache_by_pattern("expenses:*")


    return {"message": "Expense deleted successfully"}

