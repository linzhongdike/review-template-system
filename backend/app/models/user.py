from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    display_name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=True)
    role = Column(String(20), nullable=False, default="template_admin")  # general_user, template_admin, template_reviewer, sys_admin
    department = Column(String(100), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    templates = relationship("Template", back_populates="creator", foreign_keys="Template.created_by")
    template_versions = relationship("TemplateVersion", back_populates="creator", foreign_keys="TemplateVersion.created_by")
    approval_records = relationship("ApprovalRecord", back_populates="operator", foreign_keys="ApprovalRecord.operator_id")

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "display_name": self.display_name,
            "email": self.email,
            "role": self.role,
            "department": self.department,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
