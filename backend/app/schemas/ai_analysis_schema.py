from pydantic import BaseModel
from typing import Optional
from datetime import datetime




class AIAnalysisCreate(BaseModel):
    prompt: str
    result: str
    analysis_type: Optional[str] = None
    created_at: Optional[datetime] = None
    user_id: int
    case_id: Optional[int] = None
    document_id: Optional[int] = None




class AIAnalyzeTextRequest(BaseModel):
    prompt: str
    analysis_type: Optional[str] = "text_analysis"
    case_id: Optional[int] = None
    document_id: Optional[int] = None




class AIAnalysisResponse(BaseModel):
    id: int
    prompt: str
    result: str
    analysis_type: Optional[str] = None
    created_at: Optional[datetime] = None
    user_id: int
    case_id: Optional[int] = None
    document_id: Optional[int] = None


    class Config:
        from_attributes = True
