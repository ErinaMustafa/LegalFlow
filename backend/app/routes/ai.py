from fastapi import APIRouter

router = APIRouter(
    prefix="/ai",
    tags=["AI"]
)

@router.post("/summarize-document")
def summarize_document():

    return {
        "summary": "This is AI generated summary."
    }