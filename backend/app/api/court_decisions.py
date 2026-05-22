from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.court_decision import CourtDecision
from app.schemas.court_decision_schema import CourtDecisionCreate, CourtDecisionResponse

router = APIRouter(prefix="/court-decisions", tags=["Court Decisions"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=CourtDecisionResponse)
def create_court_decision(decision: CourtDecisionCreate, db: Session = Depends(get_db)):
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

@router.get("/", response_model=list[CourtDecisionResponse])
def get_court_decisions(db: Session = Depends(get_db)):
    return db.query(CourtDecision).all()

@router.get("/{decision_id}", response_model=CourtDecisionResponse)
def get_court_decision(decision_id: int, db: Session = Depends(get_db)):
    decision = db.query(CourtDecision).filter(CourtDecision.id == decision_id).first()

    if not decision:
        raise HTTPException(status_code=404, detail="Court decision not found")

    return decision

@router.put("/{decision_id}", response_model=CourtDecisionResponse)
def update_court_decision(decision_id: int, updated_decision: CourtDecisionCreate, db: Session = Depends(get_db)):
    decision = db.query(CourtDecision).filter(CourtDecision.id == decision_id).first()

    if not decision:
        raise HTTPException(status_code=404, detail="Court decision not found")

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
def delete_court_decision(decision_id: int, db: Session = Depends(get_db)):
    decision = db.query(CourtDecision).filter(CourtDecision.id == decision_id).first()

    if not decision:
        raise HTTPException(status_code=404, detail="Court decision not found")

    db.delete(decision)
    db.commit()

    return {"message": "Court decision deleted successfully"}
