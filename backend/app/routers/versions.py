import json
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..dependencies import get_current_user, require_role
from ..schemas.template_version import VersionCreate
from ..schemas.template import VersionContentUpdate
from ..models.user import User
from ..models.template import Template
from ..models.template_version import TemplateVersion
from ..models.doc_block import DocBlock
from ..models.review_item import ReviewItem
from ..services.template_service import update_version_content

router = APIRouter()


@router.get("/{template_id}/versions")
async def list_versions(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Template).where(Template.id == template_id))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="模板不存在")

    v_result = await db.execute(
        select(TemplateVersion)
        .options(selectinload(TemplateVersion.creator))
        .where(TemplateVersion.template_id == template_id)
        .order_by(TemplateVersion.created_at.desc())
    )
    versions = v_result.scalars().all()

    items = []
    for v in versions:
        item = v.to_dict()
        item["creator_name"] = v.creator.display_name if v.creator else ""
        # Find publish (approve) time
        from ..models.approval_record import ApprovalRecord
        appr_result = await db.execute(
            select(ApprovalRecord.operated_at).where(
                ApprovalRecord.version_id == v.id,
                ApprovalRecord.action == "approve"
            ).order_by(ApprovalRecord.operated_at.desc()).limit(1)
        )
        appr_time = appr_result.scalar_one_or_none()
        if appr_time:
            item["published_at"] = appr_time.isoformat()
        # Find latest rejection reason
        rej_result = await db.execute(
            select(ApprovalRecord.comment).where(
                ApprovalRecord.version_id == v.id,
                ApprovalRecord.action == "reject"
            ).order_by(ApprovalRecord.operated_at.desc()).limit(1)
        )
        rej_comment = rej_result.scalar_one_or_none()
        if rej_comment:
            item["rejection_reason"] = rej_comment
        items.append(item)

    return {"items": items}


@router.get("/{template_id}/versions/{version_id}")
async def get_version_detail(
    template_id: int,
    version_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TemplateVersion)
        .options(
            selectinload(TemplateVersion.creator),
            selectinload(TemplateVersion.template),
            selectinload(TemplateVersion.doc_blocks),
            selectinload(TemplateVersion.review_items),
        )
        .where(
            TemplateVersion.id == version_id,
            TemplateVersion.template_id == template_id,
        )
    )
    version = result.scalar_one_or_none()
    if not version:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="版本不存在")

    detail = version.to_dict()
    detail["template_name"] = version.template.name if version.template else ""
    detail["creator_name"] = version.creator.display_name if version.creator else ""
    detail["doc_blocks"] = [b.to_dict() for b in version.doc_blocks]
    detail["review_items"] = [i.to_dict() for i in version.review_items]

    return detail


@router.post("/{template_id}/versions")
async def create_new_version(
    template_id: int,
    data: VersionCreate,
    current_user: User = Depends(require_role("sys_admin", "template_admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Template).where(Template.id == template_id))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="模板不存在")

    if not template.current_version_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="模板无当前版本")

    # Prevent creating new version when a draft or reviewing version exists
    active_result = await db.execute(
        select(TemplateVersion).where(
            TemplateVersion.template_id == template_id,
            TemplateVersion.status.in_(["draft", "reviewing"]),
        )
    )
    active_version = active_result.scalar_one_or_none()
    if active_version:
        state_label = "编辑中" if active_version.status == "draft" else "审核中"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"版本 v{active_version.version_number} 当前处于「{state_label}」状态，请先完成该版本后再创建新版本",
        )

    cv_result = await db.execute(
        select(TemplateVersion)
        .options(selectinload(TemplateVersion.doc_blocks), selectinload(TemplateVersion.review_items))
        .where(TemplateVersion.id == template.current_version_id)
    )
    current_version = cv_result.scalar_one_or_none()
    if not current_version:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="当前版本不存在")

    major = int(current_version.version_number.split(".")[0])

    # Find the actual max version number across ALL versions, not just current
    max_result = await db.execute(
        select(TemplateVersion.version_number).where(
            TemplateVersion.template_id == template_id
        ).order_by(TemplateVersion.version_number.desc()).limit(1)
    )
    max_version = max_result.scalar_one_or_none()
    if max_version:
        max_major = int(max_version.split(".")[0])
        major = max(major, max_major)

    new_number = f"{major + 1}.0"

    new_version = TemplateVersion(
        template_id=template_id, version_number=new_number,
        status="draft", change_summary=data.change_summary, created_by=current_user.id,
    )
    db.add(new_version)
    await db.flush()

    for block in current_version.doc_blocks:
        new_block = DocBlock(version_id=new_version.id, sort_order=block.sort_order,
                             title=block.title, content=block.content)
        db.add(new_block)

    for item in current_version.review_items:
        new_item = ReviewItem(version_id=new_version.id, sort_order=item.sort_order,
                              name=item.name, description=item.description,
                              item_type=item.item_type, required=item.required, config=item.config)
        db.add(new_item)

    template.current_version_id = new_version.id
    db.add(template)
    await db.flush()

    result2 = await db.execute(
        select(TemplateVersion)
        .options(selectinload(TemplateVersion.doc_blocks), selectinload(TemplateVersion.review_items))
        .where(TemplateVersion.id == new_version.id)
    )
    loaded_version = result2.scalar_one()

    detail = loaded_version.to_dict()
    detail["doc_blocks"] = [b.to_dict() for b in loaded_version.doc_blocks]
    detail["review_items"] = [i.to_dict() for i in loaded_version.review_items]
    return detail


@router.put("/{template_id}/versions/{version_id}")
async def update_version(
    template_id: int,
    version_id: int,
    data: VersionContentUpdate,
    current_user: User = Depends(require_role("sys_admin", "template_admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TemplateVersion)
        .options(selectinload(TemplateVersion.doc_blocks), selectinload(TemplateVersion.review_items))
        .where(TemplateVersion.id == version_id, TemplateVersion.template_id == template_id)
    )
    version = result.scalar_one_or_none()
    if not version:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="版本不存在")

    if version.status not in ("draft", "rejected"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="仅编辑中或已驳回状态的版本可编辑")

    await update_version_content(db, version, data)
    await db.refresh(version)

    # 保存草稿版本时，更新模板的 current_version_id
    if version.status == "draft":
        t_result = await db.execute(select(Template).where(Template.id == template_id))
        template = t_result.scalar_one_or_none()
        if template:
            template.current_version_id = version.id
            db.add(template)
            await db.flush()

    detail = version.to_dict()
    detail["doc_blocks"] = [b.to_dict() for b in version.doc_blocks]
    detail["review_items"] = [i.to_dict() for i in version.review_items]
    return detail


@router.delete("/{template_id}/versions/{version_id}")
async def delete_version(
    template_id: int,
    version_id: int,
    current_user: User = Depends(require_role("sys_admin", "template_admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TemplateVersion).where(
            TemplateVersion.id == version_id,
            TemplateVersion.template_id == template_id,
        )
    )
    version = result.scalar_one_or_none()
    if not version:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="版本不存在")

    if version.status not in ("draft", "rejected"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="仅编辑中或已驳回状态的版本可删除")

    # Prevent deleting if it's the only version
    count_result = await db.execute(
        select(func.count()).select_from(TemplateVersion).where(TemplateVersion.template_id == template_id)
    )
    if count_result.scalar() <= 1:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="至少需要保留一个版本")

    # Unlink from template if this is the current version
    tpl_result = await db.execute(select(Template).where(Template.id == template_id))
    template = tpl_result.scalar_one_or_none()
    if template and template.current_version_id == version_id:
        # Find another version to set as current
        alt_result = await db.execute(
            select(TemplateVersion.id).where(
                TemplateVersion.template_id == template_id,
                TemplateVersion.id != version_id,
            ).order_by(TemplateVersion.created_at.desc()).limit(1)
        )
        alt_id = alt_result.scalar_one_or_none()
        template.current_version_id = alt_id
        db.add(template)
        await db.flush()

    await db.delete(version)
    await db.flush()
    return {"message": "版本已删除"}


@router.post("/{template_id}/versions/{version_id}/rollback")
async def rollback_version(
    template_id: int,
    version_id: int,
    current_user: User = Depends(require_role("sys_admin", "template_admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TemplateVersion)
        .options(selectinload(TemplateVersion.doc_blocks), selectinload(TemplateVersion.review_items))
        .where(TemplateVersion.id == version_id, TemplateVersion.template_id == template_id)
    )
    target_version = result.scalar_one_or_none()
    if not target_version:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="版本不存在")

    tpl_result = await db.execute(select(Template).where(Template.id == template_id))
    template = tpl_result.scalar_one_or_none()

    cv = None
    if template and template.current_version_id:
        cv_result = await db.execute(
            select(TemplateVersion).where(TemplateVersion.id == template.current_version_id)
        )
        cv = cv_result.scalar_one_or_none()

    major = int(cv.version_number.split(".")[0]) + 1 if cv else 1
    new_number = f"{major}.0"

    new_version = TemplateVersion(
        template_id=template_id, version_number=new_number,
        status="draft", change_summary=f"回滚自 v{target_version.version_number}",
        created_by=current_user.id,
    )
    db.add(new_version)
    await db.flush()

    for block in target_version.doc_blocks:
        db.add(DocBlock(version_id=new_version.id, sort_order=block.sort_order,
                        title=block.title, content=block.content))
    for item in target_version.review_items:
        db.add(ReviewItem(version_id=new_version.id, sort_order=item.sort_order,
                          name=item.name, description=item.description,
                          item_type=item.item_type, required=item.required, config=item.config))

    template.current_version_id = new_version.id
    db.add(template)
    await db.flush()

    result2 = await db.execute(
        select(TemplateVersion)
        .options(selectinload(TemplateVersion.doc_blocks), selectinload(TemplateVersion.review_items))
        .where(TemplateVersion.id == new_version.id)
    )
    loaded_version = result2.scalar_one()

    detail = loaded_version.to_dict()
    detail["doc_blocks"] = [b.to_dict() for b in loaded_version.doc_blocks]
    detail["review_items"] = [i.to_dict() for i in loaded_version.review_items]
    return detail


@router.get("/{template_id}/versions/{version_id}/diff")
async def get_version_diff(
    template_id: int,
    version_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TemplateVersion)
        .options(selectinload(TemplateVersion.doc_blocks), selectinload(TemplateVersion.review_items))
        .where(TemplateVersion.id == version_id, TemplateVersion.template_id == template_id)
    )
    version = result.scalar_one_or_none()
    if not version:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="版本不存在")

    prev_result = await db.execute(
        select(TemplateVersion)
        .options(selectinload(TemplateVersion.doc_blocks), selectinload(TemplateVersion.review_items))
        .where(TemplateVersion.template_id == template_id, TemplateVersion.created_at < version.created_at)
        .order_by(TemplateVersion.created_at.desc()).limit(1)
    )
    prev_version = prev_result.scalar_one_or_none()

    version_detail = version.to_dict()
    version_detail["doc_blocks"] = [b.to_dict() for b in version.doc_blocks]
    version_detail["review_items"] = [i.to_dict() for i in version.review_items]

    prev_detail = None
    block_diffs = []
    item_diffs = []

    if prev_version:
        prev_detail = prev_version.to_dict()
        prev_detail["doc_blocks"] = [b.to_dict() for b in prev_version.doc_blocks]
        prev_detail["review_items"] = [i.to_dict() for i in prev_version.review_items]

        prev_blocks = {b["sort_order"]: b for b in prev_detail["doc_blocks"]}
        curr_blocks = {b["sort_order"]: b for b in version_detail["doc_blocks"]}

        for order in sorted(set(list(prev_blocks.keys()) + list(curr_blocks.keys()))):
            if order not in prev_blocks:
                block_diffs.append({"sort_order": order, "type": "added", "b": curr_blocks[order]})
            elif order not in curr_blocks:
                block_diffs.append({"sort_order": order, "type": "removed", "a": prev_blocks[order]})
            elif prev_blocks[order]["content"] != curr_blocks[order]["content"] or prev_blocks[order]["title"] != curr_blocks[order]["title"]:
                block_diffs.append({"sort_order": order, "type": "modified", "a": prev_blocks[order], "b": curr_blocks[order]})

        prev_items = {i["sort_order"]: i for i in prev_detail["review_items"]}
        curr_items = {i["sort_order"]: i for i in version_detail["review_items"]}

        for order in sorted(set(list(prev_items.keys()) + list(curr_items.keys()))):
            if order not in prev_items:
                item_diffs.append({"sort_order": order, "type": "added", "b": curr_items[order]})
            elif order not in curr_items:
                item_diffs.append({"sort_order": order, "type": "removed", "a": prev_items[order]})
            elif json.dumps(prev_items[order], sort_keys=True) != json.dumps(curr_items[order], sort_keys=True):
                item_diffs.append({"sort_order": order, "type": "modified", "a": prev_items[order], "b": curr_items[order]})

    return {"version_a": prev_detail, "version_b": version_detail, "block_diffs": block_diffs, "item_diffs": item_diffs}
