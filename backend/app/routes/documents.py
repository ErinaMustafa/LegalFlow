from fastapi import APIRouter

router = APIRouter(
    prefix="/documents",
    tags=["Documents"]
)

@router.get("/")
def list_documents():
    return [
        {
            "id": 1,
            "title": "Contract.pdf"
        }
    ]

@router.post("/")
def create_document():
    return {
        "message": "Document created"
    }