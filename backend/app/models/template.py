from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class Template(Base):
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    review_type_id = Column(Integer, ForeignKey("review_types.id"), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="draft")  # draft, active, inactive, archived
    tags = Column(Text, nullable=True, default="[]")  # JSON array string
    current_version_id = Column(Integer, nullable=True)
    expire_at = Column(DateTime, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    review_type = relationship("ReviewType", back_populates="templates")
    creator = relationship("User", back_populates="templates", foreign_keys=[created_by])
    versions = relationship("TemplateVersion", back_populates="template", cascade="all, delete-orphan")
    approval_records = relationship("ApprovalRecord", back_populates="template", cascade="all, delete-orphan")

    def to_dict(self):
        import json
        return {
            "id": self.id,
            "review_type_id": self.review_type_id,
            "name": self.name,
            "description": self.description,
            "status": self.status,
            "tags": json.loads(self.tags) if self.tags else [],
            "current_version_id": self.current_version_id,
            "expire_at": self.expire_at.isoformat() if self.expire_at else None,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
