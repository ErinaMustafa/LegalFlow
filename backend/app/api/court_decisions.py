from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import case
from datetime import datetime, timedelta
from typing import Optional

from app.core.security import require_roles
from app.db.database import SessionLocal
from app.models.court_decision import CourtDecision
from app.models.case import Case
from app.models.client import Client

from app.schemas.court_decision_schema import (
    CourtDecisionCreate,
    CourtDecisionResponse
)


from app.services.cache_service import (
    get_cache,
    set_cache,
    delete_cache_by_pattern
)

from app.background.tasks import (
    send_court_decision_email_background
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
    db: Session = Depends(get_db),
    current_user: dict = Depends(
    require_roles("Admin", "Lawyer", "Manager", "Assistant")
    )
):
    cache_key = (
        f"court_decisions:"
        f"title={title}:"
        f"decision_text={decision_text}:"
        f"status={status}:"
        f"decision_date={decision_date}:"
        f"case_id={case_id}:"
        f"hearing_id={hearing_id}:"
        f"document_id={document_id}"
    )


    cached_data = get_cache(cache_key)


    if cached_data:
        print("CACHE HIT - Court Decisions returned from Redis")
        return cached_data


    print("CACHE MISS - Court Decisions returned from Supabase")


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


    decisions = query.all()


    response = []


    for decision in decisions:
        response.append({
            "id": decision.id,
            "title": decision.title,
            "decision_text": decision.decision_text,
            "decision_date": decision.decision_date.isoformat() if decision.decision_date else None,
            "status": decision.status,
            "case_id": decision.case_id,
            "hearing_id": decision.hearing_id,
            "document_id": decision.document_id
        })


    set_cache(cache_key, response, expire=3600)


    return response




@router.post("/", response_model=CourtDecisionResponse)
def create_court_decision(
    court_decision: CourtDecisionCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("Admin", "Lawyer"))
):
    new_decision = CourtDecision(
        title=court_decision.title,
        decision_text=court_decision.decision_text,
        decision_date=court_decision.decision_date,
        status=court_decision.status,
        case_id=court_decision.case_id,
        hearing_id=court_decision.hearing_id,
        document_id=court_decision.document_id
    )

    db.add(new_decision)
    db.commit()
    db.refresh(new_decision)

    delete_cache_by_pattern("court_decisions:*")

    case = db.query(Case).filter(Case.id == new_decision.case_id).first()

    if case:
        client = db.query(Client).filter(Client.id == case.client_id).first()

        if client and client.email:
            background_tasks.add_task(
                send_court_decision_email_background,
                client.email,
                client.full_name,
                new_decision.title
            )

    return new_decision


@router.get("/{decision_id}", response_model=CourtDecisionResponse)
def get_court_decision(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("Admin", "Lawyer", "Manager", "Assistant")
    )
):
    cache_key = f"court_decisions:id={decision_id}"


    cached_data = get_cache(cache_key)


    if cached_data:
        print("CACHE HIT - Court Decision returned from Redis")
        return cached_data


    print("CACHE MISS - Court Decision returned from Supabase")


    decision = db.query(CourtDecision).filter(
        CourtDecision.id == decision_id
    ).first()


    if not decision:
        raise HTTPException(
            status_code=404,
            detail="Court decision not found"
        )


    response = {
        "id": decision.id,
        "title": decision.title,
        "decision_text": decision.decision_text,
        "decision_date": decision.decision_date.isoformat() if decision.decision_date else None,
        "status": decision.status,
        "case_id": decision.case_id,
        "hearing_id": decision.hearing_id,
        "document_id": decision.document_id
    }


    set_cache(cache_key, response, expire=3600)


    return response




@router.put("/{decision_id}", response_model=CourtDecisionResponse)
def update_court_decision(
    decision_id: int,
    updated_decision: CourtDecisionCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("Admin", "Lawyer"))
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


    delete_cache_by_pattern("court_decisions:*")


    return decision




@router.delete("/{decision_id}")
def delete_court_decision(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("Admin", "Lawyer"))
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


    delete_cache_by_pattern("court_decisions:*")


    return {
        "message": "Court decision deleted successfully"
    }



