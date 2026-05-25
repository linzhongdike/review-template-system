from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from datetime import datetime
from ..database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    operator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(50), nullable=False)
    target_type = Column(String(50), nullable=False)
    target_id = Column(Integer, nullable=True)
    target_name = Column(String(200), nullable=True)
    target_version = Column(String(20), nullable=True)
    before_value = Column(Text, nullable=True)
    after_value = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    operated_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "operator_id": self.operator_id,
            "action": self.action,
            "target_type": self.target_type,
            "target_id": self.target_id,
            "target_name": self.target_name,
            "target_version": self.target_version,
            "before_value": self.before_value,
            "after_value": self.after_value,
            "ip_address": self.ip_address,
            "operated_at": self.operated_at.isoformat() if self.operated_at else None,
        }
