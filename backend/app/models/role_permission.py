import json
from sqlalchemy import Column, String, Text
from ..database import Base


class RolePermission(Base):
    __tablename__ = "role_permissions"

    role = Column(String(30), primary_key=True)
    permissions = Column(Text, nullable=False, default="[]")  # JSON array of permission keys

    def get_permissions(self) -> list:
        return json.loads(self.permissions) if self.permissions else []

    def set_permissions(self, perms: list):
        self.permissions = json.dumps(perms)
