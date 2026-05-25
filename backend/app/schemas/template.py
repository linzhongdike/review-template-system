from pydantic import BaseModel, Field
from typing import Optional, List


class TemplateCreate(BaseModel):
    review_type_id: int
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    expire_at: Optional[str] = None


class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    expire_at: Optional[str] = None


class DocBlockData(BaseModel):
    id: Optional[int] = None
    sort_order: int = 0
    title: Optional[str] = None
    content: str = ""


class ReviewItemData(BaseModel):
    id: Optional[int] = None
    sort_order: int = 0
    name: str
    description: Optional[str] = None
    item_type: str  # score, text, textarea, radio, checkbox, attachment
    required: bool = False
    config: dict = Field(default_factory=dict)


class VersionContentUpdate(BaseModel):
    doc_blocks: List[DocBlockData] = Field(default_factory=list)
    review_items: List[ReviewItemData] = Field(default_factory=list)
    change_summary: Optional[str] = None


class TemplateResponse(BaseModel):
    id: int
    review_type_id: int
    name: str
    description: Optional[str] = None
    status: str
    tags: Optional[list] = []
    current_version_id: Optional[int] = None
    expire_at: Optional[str] = None
    created_by: Optional[int] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    review_type_name: Optional[str] = None
    current_version_number: Optional[str] = None
    creator_name: Optional[str] = None
