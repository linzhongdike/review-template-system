from pydantic import BaseModel, Field
from typing import Optional


class ReviewTypeCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    project_category: Optional[str] = None
    sub_category: Optional[str] = None


class ReviewTypeUpdate(BaseModel):
    name: Optional[str] = None
    project_category: Optional[str] = None
    sub_category: Optional[str] = None


class ReviewTypeStatusUpdate(BaseModel):
    status: str  # active or inactive


class ReviewTypeResponse(BaseModel):
    id: int
    name: str
    status: str
    project_category: Optional[str] = None
    sub_category: Optional[str] = None
    created_by: Optional[int] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    template_count: Optional[int] = 0
