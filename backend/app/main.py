from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import calendar_events
from app.api import practice_areas
from app.api import auth, clients, cases, tasks, documents
from app.api import roles
from app.api import admin
from app.api import contracts
from app.api import invoices
from app.api import payments
from app.api import hearings
from app.api import case_notes
from app.api import notifications
from app.api import comments
from app.api import departments
from app.api import document_categories


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
app.include_router(invoices.router)
app.include_router(payments.router)
app.include_router(hearings.router)
app.include_router(case_notes.router)
app.include_router(notifications.router)
app.include_router(comments.router)
app.include_router(calendar_events.router)
app.include_router(departments.router)
app.include_router(practice_areas.router)
app.include_router(document_categories.router)

