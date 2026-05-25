from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class ApprovalRecord(Base):
    __tablename__ = "approval_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    template_id = Column(Integer, ForeignKey("templates.id"), nullable=False)
    version_id = Column(Integer, ForeignKey("template_versions.id"), nullable=False)
    action = Column(String(20), nullable=False)  # submit, approve, reject
    comment = Column(Text, nullable=True)
    operator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    operated_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    template = relationship("Template", back_populates="approval_records")
    version = relationship("TemplateVersion", back_populates="approval_records")
    operator = relationship("User", back_populates="approval_records", foreign_keys=[operator_id])

    def to_dict(self):
        return {
            "id": self.id,
            "template_id": self.template_id,
            "version_id": self.version_id,
            "action": self.action,
            "comment": self.comment,
            "operator_id": self.operator_id,
            "operated_at": self.operated_at.isoformat() if self.operated_at else None,
        }
