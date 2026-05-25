import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from ..database import get_db
from ..dependencies import get_current_user, require_role
from ..schemas.template import TemplateCreate, TemplateUpdate, VersionContentUpdate
from ..models.user import User
from ..models.template import Template
from ..models.template_version import TemplateVersion
from ..models.doc_block import DocBlock
from ..models.review_item import ReviewItem
from ..services.template_service import create_template_with_version, update_version_content, get_template_detail, search_templates

router = APIRouter()


@router.get("")
async def list_templates(
    keyword: str = Query(None),
    review_type_id: int = Query(None),
    status: str = Query(None),
    tag: str = Query(None),
    version_status: str = Query(None),
    include_inactive_types: bool = Query(False),
    exclude_archived: bool = Query(True),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await search_templates(db, keyword, review_type_id, status, tag, version_status, include_inactive_types, exclude_archived, page, page_size)


@router.get("/{template_id}")
async def get_template(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_template_detail(db, template_id)


@router.post("")
async def create_template(
    data: TemplateCreate,
    current_user: User = Depends(require_role("sys_admin", "template_admin")),
    db: AsyncSession = Depends(get_db),
):
    template = await create_template_with_version(db, data.model_dump(), current_user.id)
    return await get_template_detail(db, template.id)


@router.put("/{template_id}")
async def update_template(
    template_id: int,
    data: TemplateUpdate,
    current_user: User = Depends(require_role("sys_admin", "template_admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Template).where(Template.id == template_id))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="模板不存在")
    
    if template.status not in ("draft",):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="仅草稿状态的模板可修改基本信息")
    
    if data.name is not None:
        template.name = data.name
    if data.description is not None:
        template.description = data.description
    if data.tags is not None:
        template.tags = json.dumps(data.tags)
    if data.expire_at is not None:
        template.expire_at = datetime.fromisoformat(data.expire_at.replace("Z", "+00:00")) if data.expire_at else None
    
    db.add(template)
    await db.flush()
    return await get_template_detail(db, template_id)


@router.delete("/{template_id}")
async def delete_template(
    template_id: int,
    current_user: User = Depends(require_role("sys_admin", "template_admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Template).where(Template.id == template_id))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="模板不存在")
    
    if template.status not in ("draft", "archived"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="仅草稿或已失效模板可删除")
    
    await db.delete(template)
    await db.flush()
    return {"message": "模板已删除"}


@router.put("/{template_id}/expire")
async def set_template_expire(
    template_id: int,
    expire_at: str = Query(None),
    current_user: User = Depends(require_role("sys_admin", "template_admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Template).where(Template.id == template_id))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="模板不存在")
    
    template.expire_at = datetime.fromisoformat(expire_at.replace("Z", "+00:00")) if expire_at else None
    db.add(template)
    await db.flush()
    return await get_template_detail(db, template_id)


@router.post("/{template_id}/archive")
async def archive_template(
    template_id: int,
    current_user: User = Depends(require_role("sys_admin", "template_admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Template).where(Template.id == template_id))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="模板不存在")
    
    if template.status not in ("active", "inactive"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="仅已发布模板可设为失效")
    
    template.status = "archived"
    db.add(template)
    await db.flush()
    return {"message": "模板已失效"}


@router.get("/{template_id}/export")
async def export_template_json(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    detail = await get_template_detail(db, template_id)
    
    export_data = {
        "version": "1.0",
        "exported_at": datetime.utcnow().isoformat(),
        "template": {
            "name": detail.get("name"),
            "description": detail.get("description"),
            "review_type_name": detail.get("review_type_name"),
            "tags": detail.get("tags", []),
            "version_number": detail.get("current_version_number"),
            "doc_blocks": detail.get("current_version", {}).get("doc_blocks", []),
            "review_items": detail.get("current_version", {}).get("review_items", []),
        }
    }
    return export_data


@router.post("/import")
async def import_template_json(
    current_user: User = Depends(require_role("sys_admin", "template_admin")),
    db: AsyncSession = Depends(get_db),
):
    """Import will be handled from request body - stub for now"""
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="导入功能开发中")
