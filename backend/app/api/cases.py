from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import case
from datetime import datetime, timedelta
from typing import Optional

from app.db.database import SessionLocal
from app.models.case import Case
from app.schemas.case_schema import CaseCreate, CaseResponse

router = APIRouter(prefix="/cases", tags=["Cases"])


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
                detail="Invalid date format. Use YYYY, YYYY-MM, YYYY-MM-DD, YYYY-MM-DDTHH, or YYYY-MM-DDTHH:MM"
            )

    return query


@router.get("/", response_model=list[CaseResponse])
def get_cases(
    title: Optional[str] = Query(None, description="Smart search case titles"),
    description: Optional[str] = Query(None, description="Smart search case descriptions"),
    status: Optional[str] = Query(None, description="Smart search case status"),
    client_id: Optional[int] = Query(None, description="Filter by client ID"),
    practice_area_id: Optional[int] = Query(None, description="Filter by practice area ID"),
    created_at: Optional[str] = Query(None, description="Filter by created date: YYYY, YYYY-MM, YYYY-MM-DD, YYYY-MM-DDTHH, YYYY-MM-DDTHH:MM"),
    closed_at: Optional[str] = Query(None, description="Filter by closed date: YYYY, YYYY-MM, YYYY-MM-DD, YYYY-MM-DDTHH, YYYY-MM-DDTHH:MM"),
    db: Session = Depends(get_db)
):
    query = db.query(Case)

    query = smart_search(query, Case.title, title)
    query = smart_search(query, Case.description, description)
    query = smart_search(query, Case.status, status)

    if client_id is not None:
        query = query.filter(Case.client_id == client_id)

    if practice_area_id is not None:
        query = query.filter(Case.practice_area_id == practice_area_id)

    query = date_search(query, Case.created_at, created_at)
    query = date_search(query, Case.closed_at, closed_at)

    return query.all()


@router.post("/", response_model=CaseResponse)
def create_case(case: CaseCreate, db: Session = Depends(get_db)):
    new_case = Case(
        title=case.title,
        description=case.description,
        status=case.status,
        client_id=case.client_id,
        practice_area_id=case.practice_area_id
    )

    if case.status == "Closed":
        new_case.closed_at = datetime.utcnow()

    db.add(new_case)
    db.commit()
    db.refresh(new_case)

    return new_case


@router.get("/{case_id}", response_model=CaseResponse)
def get_case(case_id: int, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()

    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    return case


@router.put("/{case_id}", response_model=CaseResponse)
def update_case(case_id: int, updated_case: CaseCreate, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()

    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    case.title = updated_case.title
    case.description = updated_case.description
    case.status = updated_case.status
    case.client_id = updated_case.client_id
    case.practice_area_id = updated_case.practice_area_id

    if updated_case.status == "Closed":
        case.closed_at = datetime.utcnow()
    else:
        case.closed_at = None

    db.commit()
    db.refresh(case)

    return case


@router.delete("/{case_id}")
def delete_case(case_id: int, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()

    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    db.delete(case)
    db.commit()

    return {"message": "Case deleted successfully"}