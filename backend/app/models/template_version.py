from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class TemplateVersion(Base):
    __tablename__ = "template_versions"
    __table_args__ = (UniqueConstraint("template_id", "version_number"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    template_id = Column(Integer, ForeignKey("templates.id", ondelete="CASCADE"), nullable=False)
    version_number = Column(String(20), nullable=False)  # e.g. "1.0", "2.0"
    status = Column(String(20), nullable=False, default="draft")  # draft, reviewing, published, rejected, archived
    change_summary = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    template = relationship("Template", back_populates="versions")
    creator = relationship("User", back_populates="template_versions", foreign_keys=[created_by])
    doc_blocks = relationship("DocBlock", back_populates="version", cascade="all, delete-orphan", order_by="DocBlock.sort_order")
    review_items = relationship("ReviewItem", back_populates="version", cascade="all, delete-orphan", order_by="ReviewItem.sort_order")
    approval_records = relationship("ApprovalRecord", back_populates="version")

    def to_dict(self):
        return {
            "id": self.id,
            "template_id": self.template_id,
            "version_number": self.version_number,
            "status": self.status,
            "change_summary": self.change_summary,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
