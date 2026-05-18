from fastapi import FastAPI
from app.routes import documents, contracts, ai

app = FastAPI(
    title="LegalFlow API",
    description="Contract and Case Tracking System",
    version="1.0.0"
)

app.include_router(documents.router)
app.include_router(contracts.router)
app.include_router(ai.router)

@app.get("/")
def root():
    return {"message": "LegalFlow API is running"}