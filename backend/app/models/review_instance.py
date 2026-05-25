from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class ReviewInstance(Base):
    __tablename__ = "review_instances"

    id = Column(Integer, primary_key=True, autoincrement=True)
    review_type_id = Column(Integer, ForeignKey("review_types.id"), nullable=False)
    template_id = Column(Integer, ForeignKey("templates.id"), nullable=False)
    template_version_id = Column(Integer, ForeignKey("template_versions.id"), nullable=False)
    title = Column(String(200), nullable=False)
    initiator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String(20), nullable=False, default="draft")  # draft, in_progress, submitted
    snapshot = Column(Text, nullable=False, default="{}")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    submitted_at = Column(DateTime, nullable=True)

    responses = relationship("ItemResponse", back_populates="instance", cascade="all, delete-orphan")

    def to_dict(self):
        import json
        return {
            "id": self.id,
            "review_type_id": self.review_type_id,
            "template_id": self.template_id,
            "template_version_id": self.template_version_id,
            "title": self.title,
            "initiator_id": self.initiator_id,
            "assignee_id": self.assignee_id,
            "status": self.status,
            "snapshot": json.loads(self.snapshot) if self.snapshot else {},
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "submitted_at": self.submitted_at.isoformat() if self.submitted_at else None,
        }
