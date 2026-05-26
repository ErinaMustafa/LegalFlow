from typing import Optional


from pydantic import BaseModel




class CreateUserSchema(BaseModel):
    username: str
    email: str
    password: str
    role_id: int


   


class ResetPasswordSchema(BaseModel):
    user_id: Optional[int] = None
   
    email: Optional[str] = None
    new_password: str
