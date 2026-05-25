from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import case
from datetime import datetime, timedelta
from typing import Optional


from app.db.database import SessionLocal
from app.models.hearing import Hearing
from app.schemas.hearing_schema import HearingCreate, HearingResponse


from app.services.cache_service import (
    get_cache,
    set_cache,
    delete_cache_by_pattern
)


router = APIRouter(prefix="/hearings", tags=["Hearings"])




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




@router.post("/", response_model=HearingResponse)
def create_hearing(hearing: HearingCreate, db: Session = Depends(get_db)):
    status = "Completed" if hearing.hearing_date < datetime.utcnow() else "Scheduled"


    new_hearing = Hearing(
        title=hearing.title,
        court_name=hearing.court_name,
        hearing_date=hearing.hearing_date,
        status=status,
        case_id=hearing.case_id
    )


    db.add(new_hearing)
    db.commit()
    db.refresh(new_hearing)


    delete_cache_by_pattern("hearings:*")


    return new_hearing




@router.get("/", response_model=list[HearingResponse])
def get_hearings(
    title: Optional[str] = Query(None, description="Smart search hearing titles"),
    court_name: Optional[str] = Query(None, description="Smart search court names"),
    status: Optional[str] = Query(None, description="Smart search hearing status"),
    case_id: Optional[int] = Query(None, description="Filter by case ID"),
    hearing_date: Optional[str] = Query(None, description="Filter by hearing date: YYYY, YYYY-MM, YYYY-MM-DD, YYYY-MM-DDTHH, YYYY-MM-DDTHH:MM"),
    db: Session = Depends(get_db)
):
    cache_key = (
        f"hearings:"
        f"title={title}:"
        f"court_name={court_name}:"
        f"status={status}:"
        f"case_id={case_id}:"
        f"hearing_date={hearing_date}"
    )


    cached_data = get_cache(cache_key)


    if cached_data:
        print("CACHE HIT - Hearings returned from Redis")
        return cached_data


    print("CACHE MISS - Hearings returned from Supabase")


    query = db.query(Hearing)


    query = smart_search(query, Hearing.title, title)
    query = smart_search(query, Hearing.court_name, court_name)
    query = smart_search(query, Hearing.status, status)


    if case_id is not None:
        query = query.filter(Hearing.case_id == case_id)


    query = date_search(query, Hearing.hearing_date, hearing_date)


    hearings = query.all()


    response = []


    for hearing in hearings:
        response.append({
            "id": hearing.id,
            "title": hearing.title,
            "court_name": hearing.court_name,
            "hearing_date": hearing.hearing_date.isoformat() if hearing.hearing_date else None,
            "status": hearing.status,
            "case_id": hearing.case_id
        })


    set_cache(cache_key, response, expire=3600)


    return response




@router.get("/{hearing_id}", response_model=HearingResponse)
def get_hearing(hearing_id: int, db: Session = Depends(get_db)):
    cache_key = f"hearings:id={hearing_id}"


    cached_data = get_cache(cache_key)


    if cached_data:
        print("CACHE HIT - Hearing returned from Redis")
        return cached_data


    print("CACHE MISS - Hearing returned from Supabase")


    hearing = db.query(Hearing).filter(Hearing.id == hearing_id).first()


    if not hearing:
        raise HTTPException(status_code=404, detail="Hearing not found")


    response = {
        "id": hearing.id,
        "title": hearing.title,
        "court_name": hearing.court_name,
        "hearing_date": hearing.hearing_date.isoformat() if hearing.hearing_date else None,
        "status": hearing.status,
        "case_id": hearing.case_id
    }


    set_cache(cache_key, response, expire=3600)


    return response




@router.put("/{hearing_id}", response_model=HearingResponse)
def update_hearing(hearing_id: int, updated_hearing: HearingCreate, db: Session = Depends(get_db)):
    hearing = db.query(Hearing).filter(Hearing.id == hearing_id).first()


    if not hearing:
        raise HTTPException(status_code=404, detail="Hearing not found")


    hearing.title = updated_hearing.title
    hearing.court_name = updated_hearing.court_name
    hearing.hearing_date = updated_hearing.hearing_date
    hearing.status = "Completed" if updated_hearing.hearing_date < datetime.utcnow() else "Scheduled"
    hearing.case_id = updated_hearing.case_id


    db.commit()
    db.refresh(hearing)


    delete_cache_by_pattern("hearings:*")


    return hearing




@router.delete("/{hearing_id}")
def delete_hearing(hearing_id: int, db: Session = Depends(get_db)):
    hearing = db.query(Hearing).filter(Hearing.id == hearing_id).first()


    if not hearing:
        raise HTTPException(status_code=404, detail="Hearing not found")


    db.delete(hearing)
    db.commit()


    delete_cache_by_pattern("hearings:*")


    return {"message": "Hearing deleted successfully"}

