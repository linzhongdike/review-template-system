from pydantic import BaseModel, Field
from typing import Optional, List


class ReviewInstanceCreate(BaseModel):
    review_type_id: int
    template_id: int
    title: str = Field(..., min_length=1, max_length=200)


class ReviewInstanceResponse(BaseModel):
    id: int
    review_type_id: int
    template_id: int
    template_version_id: int
    title: str
    initiator_id: int
    status: str
    created_at: Optional[str] = None
