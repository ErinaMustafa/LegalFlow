from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import case
from datetime import datetime, timedelta
from typing import Optional

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


@router.get("/", response_model=list[AuditLogResponse])
def get_audit_logs(
    action: Optional[str] = Query(
        None,
        description="Smart search by action"
    ),

    entity_type: Optional[str] = Query(
        None,
        description="Smart search by entity type"
    ),

    description: Optional[str] = Query(
        None,
        description="Smart search audit log description"
    ),

    entity_id: Optional[int] = Query(
        None,
        description="Filter by entity ID"
    ),

    user_id: Optional[int] = Query(
        None,
        description="Filter by user ID"
    ),

    created_at: Optional[str] = Query(
        None,
        description="Filter by created date: YYYY, YYYY-MM, YYYY-MM-DD, YYYY-MM-DDTHH, YYYY-MM-DDTHH:MM"
    ),

    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)

    query = smart_search(query, AuditLog.action, action)
    query = smart_search(query, AuditLog.entity_type, entity_type)
    query = smart_search(query, AuditLog.description, description)

    if entity_id is not None:
        query = query.filter(
            AuditLog.entity_id == entity_id
        )

    if user_id is not None:
        query = query.filter(
            AuditLog.user_id == user_id
        )

    query = date_search(query, AuditLog.created_at, created_at)

    return query.all()


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
