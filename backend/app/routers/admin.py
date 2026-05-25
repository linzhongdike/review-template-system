import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from ..database import get_db
from ..dependencies import get_current_user, require_role
from ..models.user import User
from ..models.role_permission import RolePermission

router = APIRouter()


class PermissionUpdate(BaseModel):
    permissions: list[str]


# Default permissions for each role
DEFAULT_PERMISSIONS = {
    "sys_admin": [
        "templates.view", "templates.create", "templates.edit", "templates.delete",
        "templates.archive", "templates.export",
        "versions.view", "versions.create", "versions.delete", "versions.rollback",
        "approvals.submit", "approvals.approve", "approvals.reject",
        "users.manage", "review_types.manage", "admin.roles",
    ],
    "template_admin": [
        "templates.view", "templates.create", "templates.edit", "templates.delete",
        "templates.archive", "templates.export",
        "versions.view", "versions.create", "versions.delete",
        "approvals.submit",
    ],
    "template_reviewer": [
        "templates.view",
        "versions.view",
        "approvals.approve", "approvals.reject",
    ],
    "general_user": [
        "templates.view",
        "versions.view",
    ],
}


async def ensure_defaults(db: AsyncSession):
    """Ensure default permissions exist for all roles."""
    for role, perms in DEFAULT_PERMISSIONS.items():
        result = await db.execute(select(RolePermission).where(RolePermission.role == role))
        existing = result.scalar_one_or_none()
        if not existing:
            rp = RolePermission(role=role)
            rp.set_permissions(perms)
            db.add(rp)
    await db.flush()


@router.get("/admin/roles")
async def list_role_permissions(
    current_user: User = Depends(require_role("sys_admin")),
    db: AsyncSession = Depends(get_db),
):
    await ensure_defaults(db)
    result = await db.execute(select(RolePermission))
    rows = result.scalars().all()
    return [
        {"role": r.role, "permissions": r.get_permissions()}
        for r in rows
    ]


@router.put("/admin/roles/{role}")
async def update_role_permissions(
    role: str,
    data: PermissionUpdate,
    current_user: User = Depends(require_role("sys_admin")),
    db: AsyncSession = Depends(get_db),
):
    if role not in DEFAULT_PERMISSIONS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="未知角色")

    result = await db.execute(select(RolePermission).where(RolePermission.role == role))
    rp = result.scalar_one_or_none()
    if not rp:
        rp = RolePermission(role=role)
        db.add(rp)
    rp.set_permissions(data.permissions)
    await db.flush()
    return {"role": role, "permissions": rp.get_permissions()}


@router.get("/admin/my-permissions")
async def get_my_permissions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await ensure_defaults(db)
    result = await db.execute(select(RolePermission).where(RolePermission.role == current_user.role))
    rp = result.scalar_one_or_none()
    permissions = rp.get_permissions() if rp else DEFAULT_PERMISSIONS.get(current_user.role, [])
    return {"role": current_user.role, "permissions": permissions}
