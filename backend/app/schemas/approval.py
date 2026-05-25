from pydantic import BaseModel, Field
from typing import Optional


class SubmitForReviewRequest(BaseModel):
    change_summary: str = Field(..., min_length=1, max_length=500)


class ApprovalRejectRequest(BaseModel):
    comment: str = Field(..., min_length=1, max_length=500)


class ApprovalRecordResponse(BaseModel):
    id: int
    template_id: int
    version_id: int
    action: str
    comment: Optional[str] = None
    operator_id: int
    operator_name: Optional[str] = None
    operated_at: Optional[str] = None


class PendingApprovalResponse(BaseModel):
    template_id: int
    template_name: str
    version_id: int
    version_number: str
    submitter_name: str
    submitted_at: Optional[str] = None
