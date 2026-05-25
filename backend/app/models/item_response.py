from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class ItemResponse(Base):
    __tablename__ = "item_responses"
    __table_args__ = (UniqueConstraint("instance_id", "review_item_id"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    instance_id = Column(Integer, ForeignKey("review_instances.id", ondelete="CASCADE"), nullable=False)
    review_item_id = Column(Integer, ForeignKey("review_items.id"), nullable=False)
    value = Column(Text, nullable=True)
    attachments = Column(Text, nullable=True, default="[]")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    instance = relationship("ReviewInstance", back_populates="responses")

    def to_dict(self):
        import json
        return {
            "id": self.id,
            "instance_id": self.instance_id,
            "review_item_id": self.review_item_id,
            "value": self.value,
            "attachments": json.loads(self.attachments) if self.attachments else [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
