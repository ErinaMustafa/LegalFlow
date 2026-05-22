from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.document_category import DocumentCategory
from app.schemas.document_category_schema import DocumentCategoryCreate, DocumentCategoryResponse

router = APIRouter(prefix="/document-categories", tags=["Document Categories"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=DocumentCategoryResponse)
def create_document_category(category: DocumentCategoryCreate, db: Session = Depends(get_db)):
    new_category = DocumentCategory(
        name=category.name,
        description=category.description
    )

    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    return new_category

@router.get("/", response_model=list[DocumentCategoryResponse])
def get_document_categories(db: Session = Depends(get_db)):
    return db.query(DocumentCategory).all()

@router.get("/{category_id}", response_model=DocumentCategoryResponse)
def get_document_category(category_id: int, db: Session = Depends(get_db)):
    category = db.query(DocumentCategory).filter(DocumentCategory.id == category_id).first()

    if not category:
        raise HTTPException(status_code=404, detail="Document category not found")

    return category

@router.put("/{category_id}", response_model=DocumentCategoryResponse)
def update_document_category(category_id: int, updated_category: DocumentCategoryCreate, db: Session = Depends(get_db)):
    category = db.query(DocumentCategory).filter(DocumentCategory.id == category_id).first()

    if not category:
        raise HTTPException(status_code=404, detail="Document category not found")

    category.name = updated_category.name
    category.description = updated_category.description

    db.commit()
    db.refresh(category)
    return category

@router.delete("/{category_id}")
def delete_document_category(category_id: int, db: Session = Depends(get_db)):
    category = db.query(DocumentCategory).filter(DocumentCategory.id == category_id).first()

    if not category:
        raise HTTPException(status_code=404, detail="Document category not found")

    db.delete(category)
    db.commit()

    return {"message": "Document category deleted successfully"}
