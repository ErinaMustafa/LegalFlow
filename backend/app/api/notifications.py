from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

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

@router.get("/", response_model=list[NotificationResponse])
def get_notifications(db: Session = Depends(get_db)):
    return db.query(Notification).all()

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

