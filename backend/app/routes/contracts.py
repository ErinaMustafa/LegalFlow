from fastapi import APIRouter

router = APIRouter(
    prefix="/contracts",
    tags=["Contracts"]
)

@router.get("/")
def list_contracts():
    return [
        {
            "id": 1,
            "title": "Employment Contract"
        }
    ]

@router.post("/")
def create_contract():
    return {
        "message": "Contract created"
    }