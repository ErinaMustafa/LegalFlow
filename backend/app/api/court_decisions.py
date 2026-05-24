from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import case
from datetime import datetime, timedelta
from typing import Optional

from app.db.database import SessionLocal
from app.models.court_decision import CourtDecision
from app.schemas.court_decision_schema import (
    CourtDecisionCreate,
    CourtDecisionResponse
)

router = APIRouter(
    prefix="/court-decisions",
    tags=["Court Decisions"]
)


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


@router.get("/", response_model=list[CourtDecisionResponse])
def get_court_decisions(
    title: Optional[str] = Query(None, description="Smart search decision titles"),
    decision_text: Optional[str] = Query(None, description="Smart search decision text"),
    status: Optional[str] = Query(None, description="Smart search decision status"),
    decision_date: Optional[str] = Query(None, description="Filter by decision date: YYYY, YYYY-MM, YYYY-MM-DD, YYYY-MM-DDTHH, YYYY-MM-DDTHH:MM"),
    case_id: Optional[int] = Query(None, description="Filter by case ID"),
    hearing_id: Optional[int] = Query(None, description="Filter by hearing ID"),
    document_id: Optional[int] = Query(None, description="Filter by document ID"),
    db: Session = Depends(get_db)
):
    query = db.query(CourtDecision)

    query = smart_search(query, CourtDecision.title, title)
    query = smart_search(query, CourtDecision.decision_text, decision_text)
    query = smart_search(query, CourtDecision.status, status)

    query = date_search(query, CourtDecision.decision_date, decision_date)

    if case_id is not None:
        query = query.filter(CourtDecision.case_id == case_id)

    if hearing_id is not None:
        query = query.filter(CourtDecision.hearing_id == hearing_id)

    if document_id is not None:
        query = query.filter(CourtDecision.document_id == document_id)

    return query.all()


@router.post("/", response_model=CourtDecisionResponse)
def create_court_decision(
    decision: CourtDecisionCreate,
    db: Session = Depends(get_db)
):
    new_decision = CourtDecision(
        title=decision.title,
        decision_text=decision.decision_text,
        decision_date=decision.decision_date,
        status=decision.status,
        case_id=decision.case_id,
        hearing_id=decision.hearing_id,
        document_id=decision.document_id
    )

    db.add(new_decision)
    db.commit()
    db.refresh(new_decision)

    return new_decision


@router.get("/{decision_id}", response_model=CourtDecisionResponse)
def get_court_decision(
    decision_id: int,
    db: Session = Depends(get_db)
):
    decision = db.query(CourtDecision).filter(
        CourtDecision.id == decision_id
    ).first()

    if not decision:
        raise HTTPException(
            status_code=404,
            detail="Court decision not found"
        )

    return decision


@router.put("/{decision_id}", response_model=CourtDecisionResponse)
def update_court_decision(
    decision_id: int,
    updated_decision: CourtDecisionCreate,
    db: Session = Depends(get_db)
):
    decision = db.query(CourtDecision).filter(
        CourtDecision.id == decision_id
    ).first()

    if not decision:
        raise HTTPException(
            status_code=404,
            detail="Court decision not found"
        )

    decision.title = updated_decision.title
    decision.decision_text = updated_decision.decision_text
    decision.decision_date = updated_decision.decision_date
    decision.status = updated_decision.status
    decision.case_id = updated_decision.case_id
    decision.hearing_id = updated_decision.hearing_id
    decision.document_id = updated_decision.document_id

    db.commit()
    db.refresh(decision)

    return decision


@router.delete("/{decision_id}")
def delete_court_decision(
    decision_id: int,
    db: Session = Depends(get_db)
):
    decision = db.query(CourtDecision).filter(
        CourtDecision.id == decision_id
    ).first()

    if not decision:
        raise HTTPException(
            status_code=404,
            detail="Court decision not found"
        )

    db.delete(decision)
    db.commit()

    return {
        "message": "Court decision deleted successfully"
    }
