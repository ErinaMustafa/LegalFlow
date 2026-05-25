from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session
from sqlalchemy import case
from typing import Optional
from datetime import datetime, timedelta
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI
from jose import jwt, JWTError
import os


from app.db.database import SessionLocal
from app.models.ai_analysis import AIAnalysis
from app.schemas.ai_analysis_schema import (
    AIAnalysisCreate,
    AIAnalyzeTextRequest,
    AIAnalysisResponse
)


from app.core.security import SECRET_KEY, ALGORITHM


from app.services.cache_service import (
    get_cache,
    set_cache,
    delete_cache_by_pattern
)


router = APIRouter(
    prefix="/ai-analyses",
    tags=["AI Analyses"]
)


env_path = Path(__file__).resolve().parents[2] / ".env"


load_dotenv(dotenv_path=env_path)




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




@router.get("/", response_model=list[AIAnalysisResponse])
def get_ai_analyses(
    prompt: Optional[str] = Query(None, description="Smart search prompts"),
    result: Optional[str] = Query(None, description="Smart search results"),
    analysis_type: Optional[str] = Query(None, description="Smart search analysis types"),


    created_at: Optional[str] = Query(
        None,
        description="Filter by created date: YYYY, YYYY-MM, YYYY-MM-DD, YYYY-MM-DDTHH, YYYY-MM-DDTHH:MM"
    ),


    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    case_id: Optional[int] = Query(None, description="Filter by case ID"),
    document_id: Optional[int] = Query(None, description="Filter by document ID"),


    db: Session = Depends(get_db)
):
    cache_key = (
        f"ai_analyses:"
        f"prompt={prompt}:"
        f"result={result}:"
        f"analysis_type={analysis_type}:"
        f"created_at={created_at}:"
        f"user_id={user_id}:"
        f"case_id={case_id}:"
        f"document_id={document_id}"
    )


    cached_data = get_cache(cache_key)


    if cached_data:
        print("CACHE HIT - AI Analyses returned from Redis")
        return cached_data


    print("CACHE MISS - AI Analyses returned from Supabase")


    query = db.query(AIAnalysis)


    query = smart_search(query, AIAnalysis.prompt, prompt)
    query = smart_search(query, AIAnalysis.result, result)
    query = smart_search(query, AIAnalysis.analysis_type, analysis_type)


    query = date_search(query, AIAnalysis.created_at, created_at)


    if user_id is not None:
        query = query.filter(AIAnalysis.user_id == user_id)


    if case_id is not None:
        query = query.filter(AIAnalysis.case_id == case_id)


    if document_id is not None:
        query = query.filter(AIAnalysis.document_id == document_id)


    analyses = query.all()


    response = []


    for analysis in analyses:
        response.append({
            "id": analysis.id,
            "prompt": analysis.prompt,
            "result": analysis.result,
            "analysis_type": analysis.analysis_type,
            "created_at": analysis.created_at.isoformat() if analysis.created_at else None,
            "user_id": analysis.user_id,
            "case_id": analysis.case_id,
            "document_id": analysis.document_id
        })


    set_cache(cache_key, response, expire=3600)


    return response




@router.post("/analyze-text", response_model=AIAnalysisResponse)
def analyze_text(
    request: AIAnalyzeTextRequest,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    api_key = os.getenv("OPENROUTER_API_KEY")


    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="OPENROUTER_API_KEY is not configured"
        )


    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization token missing"
        )


    try:
        token = authorization.replace("Bearer ", "")


        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )


        current_user_id = payload.get("user_id")


    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )


    try:
        client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key
        )


        response = client.chat.completions.create(
            model="openrouter/auto",
            messages=[
                {
                    "role": "system",
                    "content": "You are a professional legal assistant for a Contract & Case Tracking System."
                },
                {
                    "role": "user",
                    "content": request.prompt
                }
            ]
        )


        ai_result = response.choices[0].message.content


    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI service error: {str(e)}"
        )


    new_analysis = AIAnalysis(
        prompt=request.prompt,
        result=ai_result,
        analysis_type=request.analysis_type,
        created_at=datetime.utcnow(),
        user_id=current_user_id,
        case_id=request.case_id,
        document_id=request.document_id
    )


    db.add(new_analysis)
    db.commit()
    db.refresh(new_analysis)


    delete_cache_by_pattern("ai_analyses:*")


    return new_analysis




@router.post("/", response_model=AIAnalysisResponse)
def create_ai_analysis(
    analysis: AIAnalysisCreate,
    db: Session = Depends(get_db)
):
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


    delete_cache_by_pattern("ai_analyses:*")


    return new_analysis




@router.get("/{analysis_id}", response_model=AIAnalysisResponse)
def get_ai_analysis(
    analysis_id: int,
    db: Session = Depends(get_db)
):
    cache_key = f"ai_analyses:id={analysis_id}"


    cached_data = get_cache(cache_key)


    if cached_data:
        print("CACHE HIT - AI Analysis returned from Redis")
        return cached_data


    print("CACHE MISS - AI Analysis returned from Supabase")


    analysis = db.query(AIAnalysis).filter(
        AIAnalysis.id == analysis_id
    ).first()


    if not analysis:
        raise HTTPException(
            status_code=404,
            detail="AI analysis not found"
        )


    response = {
        "id": analysis.id,
        "prompt": analysis.prompt,
        "result": analysis.result,
        "analysis_type": analysis.analysis_type,
        "created_at": analysis.created_at.isoformat() if analysis.created_at else None,
        "user_id": analysis.user_id,
        "case_id": analysis.case_id,
        "document_id": analysis.document_id
    }


    set_cache(cache_key, response, expire=3600)


    return response




@router.put("/{analysis_id}", response_model=AIAnalysisResponse)
def update_ai_analysis(
    analysis_id: int,
    updated_analysis: AIAnalysisCreate,
    db: Session = Depends(get_db)
):
    analysis = db.query(AIAnalysis).filter(
        AIAnalysis.id == analysis_id
    ).first()


    if not analysis:
        raise HTTPException(
            status_code=404,
            detail="AI analysis not found"
        )


    analysis.prompt = updated_analysis.prompt
    analysis.result = updated_analysis.result
    analysis.analysis_type = updated_analysis.analysis_type
    analysis.created_at = updated_analysis.created_at
    analysis.user_id = updated_analysis.user_id
    analysis.case_id = updated_analysis.case_id
    analysis.document_id = updated_analysis.document_id


    db.commit()
    db.refresh(analysis)


    delete_cache_by_pattern("ai_analyses:*")


    return analysis




@router.delete("/{analysis_id}")
def delete_ai_analysis(
    analysis_id: int,
    db: Session = Depends(get_db)
):
    analysis = db.query(AIAnalysis).filter(
        AIAnalysis.id == analysis_id
    ).first()


    if not analysis:
        raise HTTPException(
            status_code=404,
            detail="AI analysis not found"
        )


    db.delete(analysis)
    db.commit()


    delete_cache_by_pattern("ai_analyses:*")


    return {
        "message": "AI analysis deleted successfully"
    }

