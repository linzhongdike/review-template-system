from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class ReviewItem(Base):
    __tablename__ = "review_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    version_id = Column(Integer, ForeignKey("template_versions.id", ondelete="CASCADE"), nullable=False)
    sort_order = Column(Integer, nullable=False, default=0)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    item_type = Column(String(20), nullable=False)  # score, text, textarea, radio, checkbox, attachment
    required = Column(Boolean, nullable=False, default=False)
    config = Column(Text, nullable=False, default="{}")  # JSON config string
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    version = relationship("TemplateVersion", back_populates="review_items")

    def to_dict(self):
        import json
        return {
            "id": self.id,
            "version_id": self.version_id,
            "sort_order": self.sort_order,
            "name": self.name,
            "description": self.description,
            "item_type": self.item_type,
            "required": self.required,
            "config": json.loads(self.config) if self.config else {},
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
