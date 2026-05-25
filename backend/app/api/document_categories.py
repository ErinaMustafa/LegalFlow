from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import case
from typing import Optional

from app.core.security import require_roles
from app.db.database import SessionLocal
from app.models.document_category import DocumentCategory
from app.schemas.document_category_schema import DocumentCategoryCreate, DocumentCategoryResponse


from app.services.cache_service import get_cache, set_cache, delete_cache_by_pattern


router = APIRouter(prefix="/document-categories", tags=["Document Categories"])




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




@router.post("/", response_model=DocumentCategoryResponse)
def create_document_category(
    category: DocumentCategoryCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("Admin", "Lawyer"))
):
    new_category = DocumentCategory(
        name=category.name,
        description=category.description
    )


    db.add(new_category)
    db.commit()
    db.refresh(new_category)


    delete_cache_by_pattern("document_categories:*")


    return new_category




@router.get("/", response_model=list[DocumentCategoryResponse])
def get_document_categories(
    name: Optional[str] = Query(None, description="Smart search category names"),
    description: Optional[str] = Query(None, description="Smart search category descriptions"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(
    require_roles("Admin", "Lawyer", "Manager", "Assistant")
)
):
    cache_key = f"document_categories:name={name}:description={description}"


    cached_data = get_cache(cache_key)


    if cached_data:
        print("CACHE HIT - Document Categories returned from Redis")
        return cached_data


    print("CACHE MISS - Document Categories returned from Supabase")


    query = db.query(DocumentCategory)


    query = smart_search(query, DocumentCategory.name, name)
    query = smart_search(query, DocumentCategory.description, description)


    categories = query.all()


    response = []


    for category in categories:
        response.append({
            "id": category.id,
            "name": category.name,
            "description": category.description
        })


    set_cache(cache_key, response, expire=3600)


    return response




@router.get("/{category_id}", response_model=DocumentCategoryResponse)
def get_document_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("Admin", "Lawyer", "Manager", "Assistant")
    )
):
    cache_key = f"document_categories:id={category_id}"


    cached_data = get_cache(cache_key)


    if cached_data:
        print("CACHE HIT - Document Category returned from Redis")
        return cached_data


    print("CACHE MISS - Document Category returned from Supabase")


    category = db.query(DocumentCategory).filter(DocumentCategory.id == category_id).first()


    if not category:
        raise HTTPException(status_code=404, detail="Document category not found")


    response = {
        "id": category.id,
        "name": category.name,
        "description": category.description
    }


    set_cache(cache_key, response, expire=3600)


    return response




@router.put("/{category_id}", response_model=DocumentCategoryResponse)
def update_document_category(
    category_id: int,
    updated_category: DocumentCategoryCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("Admin", "Lawyer"))
):
    category = db.query(DocumentCategory).filter(DocumentCategory.id == category_id).first()


    if not category:
        raise HTTPException(status_code=404, detail="Document category not found")


    category.name = updated_category.name
    category.description = updated_category.description


    db.commit()
    db.refresh(category)


    delete_cache_by_pattern("document_categories:*")


    return category




@router.delete("/{category_id}")
def delete_document_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("Admin", "Lawyer"))
):
    category = db.query(DocumentCategory).filter(DocumentCategory.id == category_id).first()


    if not category:
        raise HTTPException(status_code=404, detail="Document category not found")


    db.delete(category)
    db.commit()


    delete_cache_by_pattern("document_categories:*")


    return {"message": "Document category deleted successfully"}

