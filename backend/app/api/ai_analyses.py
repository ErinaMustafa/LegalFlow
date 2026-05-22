from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.ai_analysis import AIAnalysis
from app.schemas.ai_analysis_schema import AIAnalysisCreate, AIAnalysisResponse

router = APIRouter(prefix="/ai-analyses", tags=["AI Analyses"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=AIAnalysisResponse)
def create_ai_analysis(analysis: AIAnalysisCreate, db: Session = Depends(get_db)):
    new_analysis = AIAnalysis(
        prompt=analysis.prompt,
        result=analysis.result,
        analysis_type=analysis.analysis_type,
        created_at=analysis.created_at,
        user_id=analysis.user_id,
        case_id=analysis.case_id,
        document_id=analysis.document_id
    )

    db.add(new_analysis)
    db.commit()
    db.refresh(new_analysis)
    return new_analysis

@router.get("/", response_model=list[AIAnalysisResponse])
def get_ai_analyses(db: Session = Depends(get_db)):
    return db.query(AIAnalysis).all()

@router.get("/{analysis_id}", response_model=AIAnalysisResponse)
def get_ai_analysis(analysis_id: int, db: Session = Depends(get_db)):
    analysis = db.query(AIAnalysis).filter(AIAnalysis.id == analysis_id).first()

    if not analysis:
        raise HTTPException(status_code=404, detail="AI analysis not found")

    return analysis

@router.put("/{analysis_id}", response_model=AIAnalysisResponse)
def update_ai_analysis(analysis_id: int, updated_analysis: AIAnalysisCreate, db: Session = Depends(get_db)):
    analysis = db.query(AIAnalysis).filter(AIAnalysis.id == analysis_id).first()

    if not analysis:
        raise HTTPException(status_code=404, detail="AI analysis not found")

    analysis.prompt = updated_analysis.prompt
    analysis.result = updated_analysis.result
    analysis.analysis_type = updated_analysis.analysis_type
    analysis.created_at = updated_analysis.created_at
    analysis.user_id = updated_analysis.user_id
    analysis.case_id = updated_analysis.case_id
    analysis.document_id = updated_analysis.document_id

    db.commit()
    db.refresh(analysis)
    return analysis

@router.delete("/{analysis_id}")
def delete_ai_analysis(analysis_id: int, db: Session = Depends(get_db)):
    analysis = db.query(AIAnalysis).filter(AIAnalysis.id == analysis_id).first()

    if not analysis:
        raise HTTPException(status_code=404, detail="AI analysis not found")

    db.delete(analysis)
    db.commit()

    return {"message": "AI analysis deleted successfully"}
