from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from ..models.template import Template
from ..models.template_version import TemplateVersion
from ..models.doc_block import DocBlock
from ..models.review_item import ReviewItem
from ..schemas.template import VersionContentUpdate
import json


async def create_template_with_version(db: AsyncSession, data: dict, user_id: int) -> Template:
    template = Template(
        review_type_id=data["review_type_id"],
        name=data["name"],
        description=data.get("description", ""),
        tags=json.dumps(data.get("tags", [])),
        created_by=user_id,
    )
    db.add(template)
    await db.flush()

    version = TemplateVersion(
        template_id=template.id,
        version_number="1.0",
        status="draft",
        created_by=user_id,
    )
    db.add(version)
    await db.flush()

    template.current_version_id = version.id
    db.add(template)
    await db.flush()
    return template


async def update_version_content(db: AsyncSession, version: TemplateVersion, data: VersionContentUpdate) -> TemplateVersion:
    for block in version.doc_blocks:
        await db.delete(block)
    for item in version.review_items:
        await db.delete(item)
    await db.flush()

    for i, block_data in enumerate(data.doc_blocks):
        block = DocBlock(version_id=version.id, sort_order=i, title=block_data.title, content=block_data.content)
        db.add(block)

    for i, item_data in enumerate(data.review_items):
        item = ReviewItem(version_id=version.id, sort_order=i, name=item_data.name,
                          description=item_data.description, item_type=item_data.item_type,
                          required=item_data.required, config=json.dumps(item_data.config))
        db.add(item)

    if data.change_summary:
        version.change_summary = data.change_summary
    await db.flush()
    return version


async def get_template_detail(db: AsyncSession, template_id: int) -> dict:
    result = await db.execute(
        select(Template).options(selectinload(Template.review_type), selectinload(Template.creator))
        .where(Template.id == template_id)
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="模板不存在")

    template_dict = template.to_dict()
    if template.review_type:
        template_dict["review_type_name"] = template.review_type.name
        template_dict["review_type_status"] = template.review_type.status
    if template.creator:
        template_dict["creator_name"] = template.creator.display_name

    if template.current_version_id:
        v_result = await db.execute(
            select(TemplateVersion)
            .options(selectinload(TemplateVersion.doc_blocks), selectinload(TemplateVersion.review_items))
            .where(TemplateVersion.id == template.current_version_id)
        )
        current_version = v_result.scalar_one_or_none()
        if current_version:
            template_dict["current_version_number"] = current_version.version_number
            template_dict["current_version"] = current_version.to_dict()
            template_dict["current_version"]["doc_blocks"] = [b.to_dict() for b in current_version.doc_blocks]
            template_dict["current_version"]["review_items"] = [i.to_dict() for i in current_version.review_items]

    return template_dict


async def search_templates(
    db: AsyncSession,
    keyword: str = None,
    review_type_id: int = None,
    status: str = None,
    tag: str = None,
    version_status: str = None,
    include_inactive_types: bool = False,
    exclude_archived: bool = True,
    page: int = 1,
    page_size: int = 20,
):
    from ..models.review_type import ReviewType
    query = select(Template).options(selectinload(Template.review_type), selectinload(Template.creator))

    conditions = []
    if keyword:
        conditions.append(or_(Template.name.ilike(f"%{keyword}%"), Template.description.ilike(f"%{keyword}%")))
    if review_type_id:
        conditions.append(Template.review_type_id == review_type_id)
    if status:
        conditions.append(Template.status == status)
    if version_status:
        # Filter by current version status via subquery
        from sqlalchemy import exists, and_
        sub = select(TemplateVersion.id).where(
            and_(TemplateVersion.template_id == Template.id, TemplateVersion.status == version_status)
        ).correlate(Template)
        conditions.append(exists(sub))
    if tag:
        conditions.append(Template.tags.ilike(f"%{tag}%"))
    if not include_inactive_types:
        # Exclude templates whose review type is inactive
        conditions.append(Template.review_type.has(ReviewType.status == "active"))
    if exclude_archived:
        conditions.append(Template.status != "archived")

    if conditions:
        query = query.where(*conditions)

    count_query = select(func.count()).select_from(Template)
    if not include_inactive_types:
        count_query = count_query.where(Template.review_type.has(ReviewType.status == "active"))
    if exclude_archived:
        count_query = count_query.where(Template.status != "archived")
    if conditions:
        count_query = count_query.where(*conditions)
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    query = query.order_by(Template.updated_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    templates = result.scalars().all()

    items = []
    for t in templates:
        item = t.to_dict()
        item["review_type_name"] = t.review_type.name if t.review_type else ""
        item["review_type_status"] = t.review_type.status if t.review_type else "active"
        item["review_type_category"] = t.review_type.project_category if t.review_type else None
        item["review_type_sub_category"] = t.review_type.sub_category if t.review_type else None
        item["creator_name"] = t.creator.display_name if t.creator else ""
        if t.current_version_id:
            v_result = await db.execute(
                select(TemplateVersion).where(TemplateVersion.id == t.current_version_id)
            )
            cv = v_result.scalar_one_or_none()
            if cv:
                item["current_version_number"] = cv.version_number
                item["current_version_status"] = cv.status
            item["current_version_id"] = t.current_version_id
            # Find latest published version (id + number)
            pub_result = await db.execute(
                select(TemplateVersion.id, TemplateVersion.version_number).where(
                    TemplateVersion.template_id == t.id,
                    TemplateVersion.status == "published"
                ).order_by(TemplateVersion.created_at.desc()).limit(1)
            )
            pub_row = pub_result.one_or_none()
            if pub_row:
                item["latest_published_version_id"] = pub_row[0]
            # Find latest publish (approve) time
            from ..models.approval_record import ApprovalRecord
            appr_result = await db.execute(
                select(ApprovalRecord.operated_at).where(
                    ApprovalRecord.template_id == t.id,
                    ApprovalRecord.action == "approve"
                ).order_by(ApprovalRecord.operated_at.desc()).limit(1)
            )
            appr_time = appr_result.scalar_one_or_none()
            if appr_time:
                item["published_at"] = appr_time.isoformat()
            # Find latest rejection reason for current version
            if t.current_version_id:
                rej_result = await db.execute(
                    select(ApprovalRecord.comment).where(
                        ApprovalRecord.version_id == t.current_version_id,
                        ApprovalRecord.action == "reject"
                    ).order_by(ApprovalRecord.operated_at.desc()).limit(1)
                )
                rej_comment = rej_result.scalar_one_or_none()
                if rej_comment:
                    item["rejection_reason"] = rej_comment
                item["latest_published_version_number"] = pub_row[1]
        items.append(item)

    return {"items": items, "total": total, "page": page, "page_size": page_size}
