from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, clients, cases, tasks, documents
from app.api import roles
from app.api import admin
from app.api import contracts

app = FastAPI(
    title="LegalFlow API",
    description="Contract & Case Tracking System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "LegalFlow API is running"}

app.include_router(auth.router)
app.include_router(clients.router)
app.include_router(cases.router)
app.include_router(tasks.router)
app.include_router(documents.router)
app.include_router(roles.router)
app.include_router(admin.router)
app.include_router(contracts.router)