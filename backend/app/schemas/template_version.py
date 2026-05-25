from pydantic import BaseModel
from typing import Optional, List


class VersionCreate(BaseModel):
    change_summary: Optional[str] = None


class VersionResponse(BaseModel):
    id: int
    template_id: int
    version_number: str
    status: str
    change_summary: Optional[str] = None
    created_by: Optional[int] = None
    created_at: Optional[str] = None
    creator_name: Optional[str] = None


class VersionDetailResponse(BaseModel):
    id: int
    template_id: int
    template_name: str
    version_number: str
    status: str
    change_summary: Optional[str] = None
    created_by: Optional[int] = None
    created_at: Optional[str] = None
    creator_name: Optional[str] = None
    doc_blocks: list = []
    review_items: list = []


class VersionDiffResponse(BaseModel):
    version_a: dict
    version_b: dict
    block_diffs: list = []  # list of {sort_order, type: added/removed/modified, a, b}
    item_diffs: list = []


class VersionRollbackRequest(BaseModel):
    pass  # no extra fields needed
