from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..dependencies import get_current_user, require_role
from ..schemas.approval import ApprovalRejectRequest, SubmitForReviewRequest
from ..models.user import User
from ..models.template import Template
from ..models.template_version import TemplateVersion
from ..models.approval_record import ApprovalRecord

router = APIRouter()


@router.post("/templates/{template_id}/approvals/submit")
async def submit_for_review(
    template_id: int,
    data: SubmitForReviewRequest,
    current_user: User = Depends(require_role("sys_admin", "template_admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Template).where(Template.id == template_id)
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="模板不存在")
    
    if not template.current_version_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="模板无当前版本")
    
    v_result = await db.execute(
        select(TemplateVersion)
        .options(selectinload(TemplateVersion.doc_blocks), selectinload(TemplateVersion.review_items))
        .where(TemplateVersion.id == template.current_version_id)
    )
    version = v_result.scalar_one_or_none()
    
    if not version or version.status not in ("draft", "rejected"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="仅编辑中或已驳回状态的版本可提交审核")
    
    # Check version has content
    if len(version.doc_blocks) == 0 and len(version.review_items) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="模板内容为空，请先添加文档区块或评审项")
    
    version.status = "reviewing"
    version.change_summary = data.change_summary
    db.add(version)
    
    # Create approval record
    record = ApprovalRecord(
        template_id=template_id,
        version_id=version.id,
        action="submit",
        operator_id=current_user.id,
    )
    db.add(record)
    await db.flush()
    
    return {"message": "已提交审核", "version_id": version.id}


@router.post("/templates/{template_id}/approvals/approve")
async def approve_template(
    template_id: int,
    current_user: User = Depends(require_role("sys_admin", "template_reviewer")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Template).where(Template.id == template_id)
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="模板不存在")
    
    # Find the reviewing version for this template
    v_result = await db.execute(
        select(TemplateVersion).where(
            TemplateVersion.template_id == template_id,
            TemplateVersion.status == "reviewing"
        )
    )
    version = v_result.scalar_one_or_none()
    
    if not version:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="没有找到审核中的版本")
    
    # Cannot approve own submission
    result2 = await db.execute(
        select(ApprovalRecord)
        .where(
            ApprovalRecord.version_id == version.id,
            ApprovalRecord.action == "submit",
        )
        .order_by(ApprovalRecord.operated_at.desc())
    )
    submit_record = result2.scalars().first()
    if submit_record and submit_record.operator_id == current_user.id and current_user.role != "sys_admin":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="不能审批自己提交的模板")
    
    version.status = "published"
    template.status = "active"
    template.current_version_id = version.id
    db.add(version)
    db.add(template)
    
    record = ApprovalRecord(
        template_id=template_id,
        version_id=version.id,
        action="approve",
        operator_id=current_user.id,
    )
    db.add(record)
    await db.flush()
    
    return {"message": "审核通过，模板已发布"}


@router.post("/templates/{template_id}/approvals/reject")
async def reject_template(
    template_id: int,
    data: ApprovalRejectRequest,
    current_user: User = Depends(require_role("sys_admin", "template_reviewer")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Template).where(Template.id == template_id)
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="模板不存在")
    
    # Find the reviewing version for this template
    v_result = await db.execute(
        select(TemplateVersion).where(
            TemplateVersion.template_id == template_id,
            TemplateVersion.status == "reviewing"
        )
    )
    version = v_result.scalar_one_or_none()
    
    if not version:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="没有找到审核中的版本")
    
    version.status = "rejected"
    db.add(version)
    
    record = ApprovalRecord(
        template_id=template_id,
        version_id=version.id,
        action="reject",
        comment=data.comment,
        operator_id=current_user.id,
    )
    db.add(record)
    await db.flush()
    
    return {"message": "已驳回", "comment": data.comment}



@router.get("/templates/{template_id}/approvals")
async def get_approval_history(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ApprovalRecord)
        .options(selectinload(ApprovalRecord.operator))
        .where(ApprovalRecord.template_id == template_id)
        .order_by(ApprovalRecord.operated_at.desc())
    )
    records = result.scalars().all()
    
    items = []
    for r in records:
        item = r.to_dict()
        if r.operator:
            item["operator_name"] = r.operator.display_name
        items.append(item)
    
    return {"items": items}


@router.get("/approvals/pending")
async def get_pending_approvals(
    current_user: User = Depends(require_role("sys_admin", "template_reviewer")),
    db: AsyncSession = Depends(get_db),
):
    v_result = await db.execute(
        select(TemplateVersion)
        .options(selectinload(TemplateVersion.template))
        .where(TemplateVersion.status == "reviewing")
        .order_by(TemplateVersion.created_at.desc())
    )
    versions = v_result.scalars().all()
    
    items = []
    for v in versions:
        # Get submitter
        sub_result = await db.execute(
            select(ApprovalRecord)
            .options(selectinload(ApprovalRecord.operator))
            .where(
                ApprovalRecord.version_id == v.id,
                ApprovalRecord.action == "submit",
            )
            .order_by(ApprovalRecord.operated_at.desc())
            .limit(1)
        )
        submit_record = sub_result.scalar_one_or_none()
        
        item = {
            "template_id": v.template_id,
            "template_name": v.template.name if v.template else "",
            "version_id": v.id,
            "version_number": v.version_number,
            "submitter_name": "",
            "submitted_at": None,
        }
        
        if submit_record:
            item["submitter_name"] = submit_record.operator.display_name if submit_record.operator else ""
            item["submitted_at"] = submit_record.operated_at.isoformat() if submit_record.operated_at else None
        
        items.append(item)
    
    return {"items": items}
