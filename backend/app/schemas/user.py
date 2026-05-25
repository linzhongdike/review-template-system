from pydantic import BaseModel, Field
from typing import Optional


class UserCreate(BaseModel):
    username: str = Field(..., min_length=2, max_length=50)
    password: str = Field(..., min_length=6)
    display_name: str = Field(..., min_length=1, max_length=100)
    email: Optional[str] = None
    role: str = Field(default="template_admin")
    department: Optional[str] = None


class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None
    is_active: Optional[bool] = None


class UserRoleUpdate(BaseModel):
    role: str


class UserResponse(BaseModel):
    id: int
    username: str
    display_name: str
    email: Optional[str] = None
    role: str
    department: Optional[str] = None
    is_active: bool
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
