from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from jose import jwt, JWTError

from app.db.database import SessionLocal
from app.models.audit_log import AuditLog
from app.core.security import SECRET_KEY, ALGORITHM


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
from app.api import practice_areas
from app.api import document_categories
from app.api import expenses
from app.api import time_entries
from app.api import reminders
from app.api import appointments
from app.api import ai_analyses
from app.api import audit_logs
from app.api import witnesses
from app.api import court_decisions




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


@app.middleware("http")
async def audit_log_middleware(request: Request, call_next):
    response = await call_next(request)

    if request.method in ["POST", "PUT", "PATCH", "DELETE"]:
        if not request.url.path.startswith("/audit-logs"):
            user_id = 1

            auth_header = request.headers.get("Authorization")

            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.replace("Bearer ", "")

                try:
                    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                    user_id = payload.get("user_id", 1)
                except JWTError:
                    user_id = 1

            db = SessionLocal()
            try:
                log = AuditLog(
                    action=request.method,
                    entity_type=request.url.path,
                    entity_id=None,
                    description=f"{request.method} request to {request.url.path}",
                    created_at=datetime.utcnow(),
                    user_id=user_id
                )

                db.add(log)
                db.commit()

            finally:
                db.close()

    return response


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
app.include_router(expenses.router)
app.include_router(time_entries.router)
app.include_router(reminders.router)
app.include_router(appointments.router)
app.include_router(ai_analyses.router)
app.include_router(audit_logs.router)
app.include_router(witnesses.router)
app.include_router(court_decisions.router)