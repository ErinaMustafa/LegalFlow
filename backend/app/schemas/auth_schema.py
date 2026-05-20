from pydantic import BaseModel

class RegisterSchema(BaseModel):
    username: str
    email: str
    password: str
    role_id: int

class LoginSchema(BaseModel):
    email: str
    password: str