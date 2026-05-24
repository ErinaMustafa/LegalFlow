from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import case
from datetime import datetime, timedelta
from typing import Optional

from app.db.database import SessionLocal
from app.models.notification import Notification
from app.schemas.notification_schema import NotificationCreate, NotificationResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])


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

        return query.filter(column.ilike(f"%{value}%")).order_by(
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
                detail="Invalid date format. Use YYYY, YYYY-MM, YYYY-MM-DD, YYYY-MM-DDTHH, or YYYY-MM-DDTHH:MM"
            )

    return query


@router.get("/", response_model=list[NotificationResponse])
def get_notifications(
    title: Optional[str] = Query(None, description="Smart search notification titles"),
    message: Optional[str] = Query(None, description="Smart search notification messages"),
    status: Optional[str] = Query(None, description="Smart search notification status"),
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    case_id: Optional[int] = Query(None, description="Filter by case ID"),
    task_id: Optional[int] = Query(None, description="Filter by task ID"),
    hearing_id: Optional[int] = Query(None, description="Filter by hearing ID"),
    created_at: Optional[str] = Query(None, description="Filter by created date: YYYY, YYYY-MM, YYYY-MM-DD, YYYY-MM-DDTHH, YYYY-MM-DDTHH:MM"),
    db: Session = Depends(get_db)
):
    query = db.query(Notification)

    query = smart_search(query, Notification.title, title)
    query = smart_search(query, Notification.message, message)
    query = smart_search(query, Notification.status, status)

    if user_id is not None:
        query = query.filter(Notification.user_id == user_id)

    if case_id is not None:
        query = query.filter(Notification.case_id == case_id)

    if task_id is not None:
        query = query.filter(Notification.task_id == task_id)

    if hearing_id is not None:
        query = query.filter(Notification.hearing_id == hearing_id)

    query = date_search(query, Notification.created_at, created_at)

    return query.all()


@router.post("/", response_model=NotificationResponse)
def create_notification(notification: NotificationCreate, db: Session = Depends(get_db)):
    new_notification = Notification(
        title=notification.title,
        message=notification.message,
        status=notification.status,
        created_at=notification.created_at,
        user_id=notification.user_id,
        case_id=notification.case_id,
        task_id=notification.task_id,
        hearing_id=notification.hearing_id
    )

    db.add(new_notification)
    db.commit()
    db.refresh(new_notification)

    return new_notification


@router.get("/{notification_id}", response_model=NotificationResponse)
def get_notification(notification_id: int, db: Session = Depends(get_db)):
    notification = db.query(Notification).filter(Notification.id == notification_id).first()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    return notification


@router.put("/{notification_id}", response_model=NotificationResponse)
def update_notification(notification_id: int, updated_notification: NotificationCreate, db: Session = Depends(get_db)):
    notification = db.query(Notification).filter(Notification.id == notification_id).first()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.title = updated_notification.title
    notification.message = updated_notification.message
    notification.status = updated_notification.status
    notification.created_at = updated_notification.created_at
    notification.user_id = updated_notification.user_id
    notification.case_id = updated_notification.case_id
    notification.task_id = updated_notification.task_id
    notification.hearing_id = updated_notification.hearing_id

    db.commit()
    db.refresh(notification)

    return notification


@router.delete("/{notification_id}")
def delete_notification(notification_id: int, db: Session = Depends(get_db)):
    notification = db.query(Notification).filter(Notification.id == notification_id).first()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    db.delete(notification)
    db.commit()

    return {"message": "Notification deleted successfully"}
