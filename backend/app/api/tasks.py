from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import case
from datetime import datetime, timedelta
from typing import Optional


from app.db.database import SessionLocal
from app.models.task import Task
from app.schemas.task_schema import TaskCreate, TaskResponse


from app.services.cache_service import (
    get_cache,
    set_cache,
    delete_cache_by_pattern
)


router = APIRouter(prefix="/tasks", tags=["Tasks"])




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
                detail="Invalid date format. Use YYYY, YYYY-MM, YYYY-MM-DD, YYYY-MM-DDTHH, or YYYY-MM-DDTHH:MM"
            )


    return query




@router.get("/", response_model=list[TaskResponse])
def get_tasks(
    title: Optional[str] = Query(None, description="Smart search task titles"),
    description: Optional[str] = Query(None, description="Smart search task descriptions"),
    status: Optional[str] = Query(None, description="Smart search task status"),
    priority: Optional[str] = Query(None, description="Smart search task priority"),
    case_id: Optional[int] = Query(None, description="Filter by case ID"),
    created_at: Optional[str] = Query(None, description="Filter by created date: YYYY, YYYY-MM, YYYY-MM-DD, YYYY-MM-DDTHH, YYYY-MM-DDTHH:MM"),
    db: Session = Depends(get_db)
):
    cache_key = (
        f"tasks:"
        f"title={title}:"
        f"description={description}:"
        f"status={status}:"
        f"priority={priority}:"
        f"case_id={case_id}:"
        f"created_at={created_at}"
    )


    cached_data = get_cache(cache_key)


    if cached_data:
        print("CACHE HIT - Tasks returned from Redis")
        return cached_data


    print("CACHE MISS - Tasks returned from Supabase")


    query = db.query(Task)


    query = smart_search(query, Task.title, title)
    query = smart_search(query, Task.description, description)
    query = smart_search(query, Task.status, status)
    query = smart_search(query, Task.priority, priority)


    if case_id is not None:
        query = query.filter(Task.case_id == case_id)


    query = date_search(query, Task.created_at, created_at)


    tasks = query.all()


    response = []


    for task in tasks:
        response.append({
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "status": task.status,
            "priority": task.priority,
            "created_at": task.created_at.isoformat() if task.created_at else None,
            "case_id": task.case_id
        })


    set_cache(cache_key, response, expire=3600)


    return response




@router.post("/", response_model=TaskResponse)
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    new_task = Task(
        title=task.title,
        description=task.description,
        status=task.status,
        priority=task.priority,
        case_id=task.case_id
    )


    db.add(new_task)
    db.commit()
    db.refresh(new_task)


    delete_cache_by_pattern("tasks:*")


    return new_task




@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    cache_key = f"tasks:id={task_id}"


    cached_data = get_cache(cache_key)


    if cached_data:
        print("CACHE HIT - Task returned from Redis")
        return cached_data


    print("CACHE MISS - Task returned from Supabase")


    task = db.query(Task).filter(Task.id == task_id).first()


    if not task:
        raise HTTPException(status_code=404, detail="Task not found")


    response = {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "priority": task.priority,
        "created_at": task.created_at.isoformat() if task.created_at else None,
        "case_id": task.case_id
    }


    set_cache(cache_key, response, expire=3600)


    return response




@router.put("/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, updated_task: TaskCreate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()


    if not task:
        raise HTTPException(status_code=404, detail="Task not found")


    task.title = updated_task.title
    task.description = updated_task.description
    task.status = updated_task.status
    task.priority = updated_task.priority
    task.case_id = updated_task.case_id


    db.commit()
    db.refresh(task)


    delete_cache_by_pattern("tasks:*")


    return task




@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()


    if not task:
        raise HTTPException(status_code=404, detail="Task not found")


    db.delete(task)
    db.commit()


    delete_cache_by_pattern("tasks:*")


    return {"message": "Task deleted successfully"}

