from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import case
from datetime import datetime, timedelta
from typing import Optional
from app.core.security import require_roles

from app.db.database import SessionLocal
from app.models.comment import Comment
from app.schemas.comment_schema import CommentCreate, CommentResponse


from app.services.cache_service import (
    get_cache,
    set_cache,
    delete_cache_by_pattern
)


router = APIRouter(prefix="/comments", tags=["Comments"])




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




@router.get("/", response_model=list[CommentResponse])
def get_comments(
    content: Optional[str] = Query(None, description="Smart search comment content"),
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    case_id: Optional[int] = Query(None, description="Filter by case ID"),
    task_id: Optional[int] = Query(None, description="Filter by task ID"),
    created_at: Optional[str] = Query(None, description="Filter by created date: YYYY, YYYY-MM, YYYY-MM-DD, YYYY-MM-DDTHH, YYYY-MM-DDTHH:MM"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(
    require_roles("Admin", "Lawyer", "Manager", "Assistant")
)
):
    cache_key = (
        f"comments:"
        f"content={content}:"
        f"user_id={user_id}:"
        f"case_id={case_id}:"
        f"task_id={task_id}:"
        f"created_at={created_at}"
    )


    cached_data = get_cache(cache_key)


    if cached_data:
        print("CACHE HIT - Comments returned from Redis")
        return cached_data


    print("CACHE MISS - Comments returned from Supabase")


    query = db.query(Comment)


    query = smart_search(query, Comment.content, content)


    if user_id is not None:
        query = query.filter(Comment.user_id == user_id)


    if case_id is not None:
        query = query.filter(Comment.case_id == case_id)


    if task_id is not None:
        query = query.filter(Comment.task_id == task_id)


    query = date_search(query, Comment.created_at, created_at)


    comments = query.all()


    response = []


    for comment in comments:
        response.append({
            "id": comment.id,
            "content": comment.content,
            "created_at": comment.created_at.isoformat() if comment.created_at else None,
            "user_id": comment.user_id,
            "case_id": comment.case_id,
            "task_id": comment.task_id
        })


    set_cache(cache_key, response, expire=3600)


    return response




@router.post("/", response_model=CommentResponse)
def create_comment(
    comment: CommentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("Admin", "Lawyer", "Manager", "Assistant")
    )
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


    delete_cache_by_pattern("comments:*")


    return new_comment




@router.get("/{comment_id}", response_model=CommentResponse)
def get_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("Admin", "Lawyer", "Manager", "Assistant")
    )
):
    cache_key = f"comments:id={comment_id}"


    cached_data = get_cache(cache_key)


    if cached_data:
        print("CACHE HIT - Comment returned from Redis")
        return cached_data


    print("CACHE MISS - Comment returned from Supabase")


    comment = db.query(Comment).filter(Comment.id == comment_id).first()


    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")


    response = {
        "id": comment.id,
        "content": comment.content,
        "created_at": comment.created_at.isoformat() if comment.created_at else None,
        "user_id": comment.user_id,
        "case_id": comment.case_id,
        "task_id": comment.task_id
    }


    set_cache(cache_key, response, expire=3600)


    return response




@router.put("/{comment_id}", response_model=CommentResponse)
def update_comment(
    comment_id: int,
    updated_comment: CommentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("Admin", "Lawyer", "Manager", "Assistant")
    )
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()


    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")


    comment.content = updated_comment.content
    comment.created_at = updated_comment.created_at
    comment.user_id = updated_comment.user_id
    comment.case_id = updated_comment.case_id
    comment.task_id = updated_comment.task_id


    db.commit()
    db.refresh(comment)


    delete_cache_by_pattern("comments:*")


    return comment




@router.delete("/{comment_id}")
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("Admin", "Lawyer", "Manager", "Assistant")
    )
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()


    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")


    db.delete(comment)
    db.commit()


    delete_cache_by_pattern("comments:*")


    return {"message": "Comment deleted successfully"}

