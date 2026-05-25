from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func, and_
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..dependencies import get_current_user
from ..models.user import User
from ..models.template import Template
from ..models.template_version import TemplateVersion
from ..models.review_type import ReviewType
from ..models.approval_record import ApprovalRecord

router = APIRouter()


@router.get("/dashboard/stats")
async def dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """仪表盘统计：总数、已发布、编辑中、已失效"""

    # 模板总数（包含失效）
    total_result = await db.execute(select(func.count(Template.id)))
    total = total_result.scalar()

    # 已发布：非失效 + 当前版本状态为 published
    published_result = await db.execute(
        select(func.count(Template.id))
        .join(TemplateVersion, Template.current_version_id == TemplateVersion.id)
        .where(Template.status != "archived", TemplateVersion.status == "published")
    )
    published = published_result.scalar()

    # 编辑中：非失效 + 当前版本状态为 draft
    draft_result = await db.execute(
        select(func.count(Template.id))
        .join(TemplateVersion, Template.current_version_id == TemplateVersion.id)
        .where(Template.status != "archived", TemplateVersion.status == "draft")
    )
    draft = draft_result.scalar()

    # 已失效：已失效模板
    archived_result = await db.execute(
        select(func.count(Template.id)).where(Template.status == "archived")
    )
    archived = archived_result.scalar()

    return {
        "total": total,
        "published": published,
        "draft": draft,
        "expired": archived,
    }


@router.get("/dashboard/recent-changes")
async def recent_changes(
    days: int = Query(15, ge=1, le=90),
    limit: int = Query(30, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    since = datetime.utcnow() - timedelta(days=days)
    items = []

    # === 1. 版本变更事件：新建 / 升版（排除编辑中和审核中） ===
    v_result = await db.execute(
        select(TemplateVersion)
        .options(selectinload(TemplateVersion.template).selectinload(Template.review_type))
        .where(
            TemplateVersion.created_at >= since,
            TemplateVersion.status.notin_(["draft", "reviewing"]),
        )
        .order_by(desc(TemplateVersion.created_at))
        .limit(limit)
    )
    for v in v_result.scalars().all():
        t = v.template
        if not t:
            continue
        appr_result = await db.execute(
            select(ApprovalRecord).where(
                ApprovalRecord.version_id == v.id,
                ApprovalRecord.action == "approve",
            ).order_by(desc(ApprovalRecord.operated_at)).limit(1)
        )
        appr = appr_result.scalar_one_or_none()
        items.append({
            "change_type": "新建" if v.version_number == "1.0" else "升版",
            "template_id": t.id,
            "template_name": t.name,
            "review_type_name": t.review_type.name if t.review_type else "",
            "change_time": v.created_at.isoformat(),
            "version_id": v.id,
            "version_number": v.version_number,
            "version_status": v.status,
            "change_summary": v.change_summary or "",
            "published_at": appr.operated_at.isoformat() if appr else None,
        })

    # === 2. 失效事件：模板被设为失效 ===
    archived_result = await db.execute(
        select(Template)
        .options(selectinload(Template.review_type))
        .where(Template.status == "archived", Template.updated_at >= since)
        .order_by(desc(Template.updated_at))
        .limit(limit)
    )
    for t in archived_result.scalars().all():
        vn_result = await db.execute(
            select(TemplateVersion.version_number, TemplateVersion.status).where(TemplateVersion.id == t.current_version_id)
        )
        vrow = vn_result.one_or_none()
        vn, vs = vrow if vrow else (None, None)
        items.append({
            "change_type": "失效",
            "template_id": t.id,
            "template_name": t.name,
            "version_number": vn,
            "version_status": vs,
            "review_type_name": t.review_type.name if t.review_type else "",
            "change_time": t.updated_at.isoformat(),
            "change_summary": f"模板「{t.name}」已失效",
        })

    # === 3. 评审停用事件：评审阶段被停用，列出受影响的非失效模板 ===
    inactive_types_result = await db.execute(
        select(ReviewType)
        .where(ReviewType.status == "inactive", ReviewType.updated_at >= since)
        .order_by(desc(ReviewType.updated_at))
    )
    for rt in inactive_types_result.scalars().all():
        # 找出该评审阶段下的非失效模板
        tmpl_result = await db.execute(
            select(Template).where(
                Template.review_type_id == rt.id,
                Template.status != "archived",
            )
        )
        for t in tmpl_result.scalars().all():
            vn_result = await db.execute(
                select(TemplateVersion.version_number, TemplateVersion.status).where(TemplateVersion.id == t.current_version_id)
            )
            vrow = vn_result.one_or_none()
            vn, vs = vrow if vrow else (None, None)
            items.append({
                "change_type": "评审停用",
                "template_id": t.id,
                "template_name": t.name,
                "version_number": vn,
                "version_status": vs,
                "review_type_name": rt.name,
                "change_time": rt.updated_at.isoformat(),
                "change_summary": f"评审阶段「{rt.name}」已停用，关联模板失效",
            })

    # 按时间排序，截取 limit
    items.sort(key=lambda x: x["change_time"], reverse=True)
    items = items[:limit]

    return {"items": items}
