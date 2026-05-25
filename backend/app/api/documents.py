from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import case
from typing import Optional

from app.core.security import require_roles
from app.db.database import SessionLocal
from app.models.document import Document
from app.schemas.document_schema import DocumentCreate, DocumentResponse


from app.services.cache_service import (
    get_cache,
    set_cache,
    delete_cache_by_pattern
)


router = APIRouter(prefix="/documents", tags=["Documents"])




def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()




def smart_search(query, column, value):
    if value:
        if len(value) == 1:
            return query.filter(
                column.ilike(f"{value}%")
            )


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




@router.get("/", response_model=list[DocumentResponse])
def get_documents(
    title: Optional[str] = Query(
        None,
        description="Smart search document titles"
    ),


    document_type: Optional[str] = Query(
        None,
        description="Smart search document types"
    ),


    file_url: Optional[str] = Query(
        None,
        description="Smart search document file URLs"
    ),


    case_id: Optional[int] = Query(
        None,
        description="Filter by case ID"
    ),


    category_id: Optional[int] = Query(
        None,
        description="Filter by category ID"
    ),


    db: Session = Depends(get_db),
    current_user: dict = Depends(
    require_roles("Admin", "Lawyer", "Manager", "Assistant", "Finance")
    )
):
    cache_key = (
        f"documents:"
        f"title={title}:"
        f"document_type={document_type}:"
        f"file_url={file_url}:"
        f"case_id={case_id}:"
        f"category_id={category_id}"
    )


    cached_data = get_cache(cache_key)


    if cached_data:
        print("CACHE HIT - Documents returned from Redis")
        return cached_data


    print("CACHE MISS - Documents returned from Supabase")


    query = db.query(Document)


    query = smart_search(query, Document.title, title)
    query = smart_search(query, Document.document_type, document_type)
    query = smart_search(query, Document.file_url, file_url)


    if case_id is not None:
        query = query.filter(
            Document.case_id == case_id
        )


    if category_id is not None:
        query = query.filter(
            Document.category_id == category_id
        )


    documents = query.all()


    response = []


    for document in documents:
        response.append({
            "id": document.id,
            "title": document.title,
            "file_url": document.file_url,
            "document_type": document.document_type,
            "case_id": document.case_id,
            "category_id": document.category_id
        })


    set_cache(cache_key, response, expire=3600)


    return response




@router.post("/", response_model=DocumentResponse)
def create_document(
    document: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("Admin", "Lawyer", "Assistant"))
):


    new_document = Document(
        title=document.title,
        file_url=document.file_url,
        document_type=document.document_type,
        case_id=document.case_id,
        category_id=document.category_id
    )


    db.add(new_document)
    db.commit()
    db.refresh(new_document)


    delete_cache_by_pattern("documents:*")


    return new_document




@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("Admin", "Lawyer", "Manager", "Assistant", "Finance")
    )
):

    cache_key = f"documents:id={document_id}"


    cached_data = get_cache(cache_key)


    if cached_data:
        print("CACHE HIT - Document returned from Redis")
        return cached_data


    print("CACHE MISS - Document returned from Supabase")


    document = db.query(Document).filter(
        Document.id == document_id
    ).first()


    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )


    response = {
        "id": document.id,
        "title": document.title,
        "file_url": document.file_url,
        "document_type": document.document_type,
        "case_id": document.case_id,
        "category_id": document.category_id
    }


    set_cache(cache_key, response, expire=3600)


    return response




@router.put("/{document_id}", response_model=DocumentResponse)
def update_document(
    document_id: int,
    updated_document: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("Admin", "Lawyer", "Assistant"))
):


    document = db.query(Document).filter(
        Document.id == document_id
    ).first()


    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )


    document.title = updated_document.title
    document.file_url = updated_document.file_url
    document.document_type = updated_document.document_type
    document.case_id = updated_document.case_id
    document.category_id = updated_document.category_id


    db.commit()
    db.refresh(document)


    delete_cache_by_pattern("documents:*")


    return document




@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("Admin", "Lawyer"))
):


    document = db.query(Document).filter(
        Document.id == document_id
    ).first()


    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )


    db.delete(document)
    db.commit()


    delete_cache_by_pattern("documents:*")


    return {"message": "Document deleted successfully"}


