from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal

from app.models.audit_log import AuditLog

from app.schemas.audit_log_schema import (
    AuditLogCreate,
    AuditLogResponse
)

router = APIRouter(
    prefix="/audit-logs",
    tags=["Audit Logs"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


@router.post("/", response_model=AuditLogResponse)
def create_audit_log(
    audit_log: AuditLogCreate,
    db: Session = Depends(get_db)
):
    new_log = AuditLog(
        action=audit_log.action,
        entity_type=audit_log.entity_type,
        entity_id=audit_log.entity_id,
        description=audit_log.description,
        created_at=audit_log.created_at,
        user_id=audit_log.user_id
    )

    db.add(new_log)

    db.commit()

    db.refresh(new_log)

    return new_log


@router.get("/", response_model=list[AuditLogResponse])
def get_audit_logs(db: Session = Depends(get_db)):
    return db.query(AuditLog).all()


@router.get("/{log_id}", response_model=AuditLogResponse)
def get_audit_log(
    log_id: int,
    db: Session = Depends(get_db)
):
    log = db.query(AuditLog).filter(
        AuditLog.id == log_id
    ).first()

    if not log:
        raise HTTPException(
            status_code=404,
            detail="Audit log not found"
        )

    return log


@router.delete("/{log_id}")
def delete_audit_log(
    log_id: int,
    db: Session = Depends(get_db)
):
    log = db.query(AuditLog).filter(
        AuditLog.id == log_id
    ).first()

    if not log:
        raise HTTPException(
            status_code=404,
            detail="Audit log not found"
        )

    db.delete(log)

    db.commit()

    return {
        "message": "Audit log deleted successfully"
    }
