from pydantic import BaseModel

class CaseCreate(BaseModel):
    title: str
    description: str
    status: str
    client_id: int

class CaseResponse(BaseModel):
    id: int
    title: str
    description: str
    status: str
    client_id: int

    class Config:
        from_attributes = True