from pydantic import BaseModel
from typing import Optional


class AuditLogResponse(BaseModel):
    id: int
    operator_id: int
    action: str
    target_type: str
    target_name: Optional[str] = None
    operated_at: Optional[str] = None
