from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal

from app.models.comment import Comment

from app.schemas.comment_schema import (
    CommentCreate,
    CommentResponse
)

router = APIRouter(
    prefix="/comments",
    tags=["Comments"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


@router.post("/", response_model=CommentResponse)
def create_comment(
    comment: CommentCreate,
    db: Session = Depends(get_db)
):
    new_comment = Comment(
        content=comment.content,
        created_at=comment.created_at,
        user_id=comment.user_id,
        case_id=comment.case_id,
        task_id=comment.task_id
    )

    db.add(new_comment)

    db.commit()

    db.refresh(new_comment)

    return new_comment


@router.get("/", response_model=list[CommentResponse])
def get_comments(db: Session = Depends(get_db)):
    return db.query(Comment).all()


@router.get("/{comment_id}", response_model=CommentResponse)
def get_comment(
    comment_id: int,
    db: Session = Depends(get_db)
):
    comment = db.query(Comment).filter(
        Comment.id == comment_id
    ).first()

    if not comment:
        raise HTTPException(
            status_code=404,
            detail="Comment not found"
        )

    return comment


@router.put("/{comment_id}", response_model=CommentResponse)
def update_comment(
    comment_id: int,
    updated_comment: CommentCreate,
    db: Session = Depends(get_db)
):
    comment = db.query(Comment).filter(
        Comment.id == comment_id
    ).first()

    if not comment:
        raise HTTPException(
            status_code=404,
            detail="Comment not found"
        )

    comment.content = updated_comment.content
    comment.created_at = updated_comment.created_at
    comment.user_id = updated_comment.user_id
    comment.case_id = updated_comment.case_id
    comment.task_id = updated_comment.task_id

    db.commit()

    db.refresh(comment)

    return comment


@router.delete("/{comment_id}")
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db)
):
    comment = db.query(Comment).filter(
        Comment.id == comment_id
    ).first()

    if not comment:
        raise HTTPException(
            status_code=404,
            detail="Comment not found"
        )

    db.delete(comment)

    db.commit()

    return {
        "message": "Comment deleted successfully" }
