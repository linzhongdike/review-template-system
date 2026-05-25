#!/usr/bin/env python3
"""Seed script - 发动机产品开发评审案例数据（精简版）"""

import asyncio, os, sys, json
sys.path.insert(0, os.path.dirname(__file__))

from app.database import AsyncSessionLocal, init_db
from app.models.user import User
from app.models.review_type import ReviewType
from app.models.template import Template
from app.models.template_version import TemplateVersion
from app.models.doc_block import DocBlock
from app.models.review_item import ReviewItem
from app.models.approval_record import ApprovalRecord
from app.utils.security import hash_password
from sqlalchemy import select, delete


async def seed():
    print("初始化...")
    await init_db()

    async with AsyncSessionLocal() as db:
        await db.execute(delete(ApprovalRecord))
        await db.execute(delete(ReviewItem))
        await db.execute(delete(DocBlock))
        await db.execute(delete(TemplateVersion))
        await db.execute(delete(Template))
        await db.execute(delete(ReviewType))
        await db.execute(delete(User))
        await db.flush()

        # ===== 用户 =====
        users_data = [
            {"username": "admin",      "password": "admin123", "display_name": "张工(系统管理)",  "role": "sys_admin",          "department": "信息技术部"},
            {"username": "tpl_admin",  "password": "admin123", "display_name": "李工(模板管理)",  "role": "template_admin",     "department": "研发中心"},
            {"username": "approver",   "password": "admin123", "display_name": "赵总(总工程师)",  "role": "template_reviewer",  "department": "技术委员会"},
            {"username": "user1",      "password": "admin123", "display_name": "一般用户",        "role": "general_user",       "department": "通用"},
        ]
        users = []
        for u in users_data:
            user = User(username=u["username"], password_hash=hash_password(u["password"]),
                        display_name=u["display_name"], role=u["role"], department=u["department"])
            db.add(user); users.append(user)
        await db.flush()
        print(f"  {len(users)} 个用户")

        # ===== 评审类型 =====
        types_data = [
            {"name": "发动机零部件工艺评审",   "description": "对发动机关键零部件的制造工艺方案进行评审", "created_by": users[0].id},
            {"name": "发动机试验验证评审",     "description": "对发动机台架试验、耐久试验、排放试验等进行评审", "created_by": users[0].id},
        ]
        review_types = []
        for t in types_data:
            rt = ReviewType(**t); db.add(rt); review_types.append(rt)
        await db.flush()
        print(f"  {len(review_types)} 个评审类型")

        # ===== 模板1: 关键零部件工艺评审 (已发布) =====
        tpl1 = Template(review_type_id=review_types[0].id, name="发动机关键零部件工艺评审表",
                        description="对气缸体、气缸盖、曲轴、连杆等关键零部件的铸造/锻造/机加工/热处理工艺方案进行评审",
                        status="active", tags=json.dumps(["工艺", "关键件", "制造"]), created_by=users[1].id)
        db.add(tpl1); await db.flush()
        v1 = TemplateVersion(template_id=tpl1.id, version_number="1.0", status="published",
                             change_summary="初始版本", created_by=users[1].id)
        db.add(v1); await db.flush()

        db.add(DocBlock(version_id=v1.id, sort_order=0, title="评审范围",
            content="<h2>关键零部件清单</h2><ol><li>气缸体（铸铁HT250）</li><li>气缸盖（铝合金）</li><li>曲轴（锻钢42CrMo）</li><li>连杆（锻钢）</li><li>凸轮轴（铸铁）</li><li>活塞（铝合金）</li></ol>"))

        for item in [
            {"sort_order": 0, "name": "铸造工艺可行性", "description": "评估缸体/缸盖铸造工艺方案，包括砂型设计、浇注系统、缺陷控制", "item_type": "score", "required": True,
             "config": json.dumps({"max_score": 100, "min_score": 0, "step": 5})},
            {"sort_order": 1, "name": "锻造工艺可行性", "description": "评估曲轴/连杆锻造工艺方案，包括模具设计、成形力、材料利用率", "item_type": "score", "required": True,
             "config": json.dumps({"max_score": 100, "min_score": 0, "step": 5})},
            {"sort_order": 2, "name": "机加工方案", "description": "评估加工工艺路线、夹具方案、刀具选型", "item_type": "score", "required": True,
             "config": json.dumps({"max_score": 100, "min_score": 0, "step": 5})},
            {"sort_order": 3, "name": "热处理方案", "description": "评估去应力退火、调质处理、表面淬火等方案", "item_type": "textarea", "required": True,
             "config": json.dumps({"max_length": 1000, "placeholder": "请评价热处理工艺参数设置的合理性..."})},
            {"sort_order": 4, "name": "关键工序CPK能力", "description": "关键尺寸的工序能力指数是否满足≥1.33", "item_type": "radio", "required": True,
             "config": json.dumps({"options": [{"label": "全部≥1.33", "value": "good"}, {"label": "部分1.0-1.33", "value": "marginal"}, {"label": "存在<1.0", "value": "poor"}]})},
            {"sort_order": 5, "name": "工艺评审结论", "description": "综合评审结论", "item_type": "radio", "required": True,
             "config": json.dumps({"options": [{"label": "通过", "value": "pass"}, {"label": "需整改", "value": "rework"}, {"label": "不通过", "value": "fail"}]})},
        ]:
            item["version_id"] = v1.id; db.add(ReviewItem(**item))

        tpl1.current_version_id = v1.id; db.add(tpl1)
        db.add(ApprovalRecord(template_id=tpl1.id, version_id=v1.id, action="submit", operator_id=users[1].id))
        db.add(ApprovalRecord(template_id=tpl1.id, version_id=v1.id, action="approve",
                comment="工艺评审模板评审维度完整，审核通过", operator_id=users[3].id))
        await db.flush()

        # ===== 模板2: 台架试验验证评审 (草稿) =====
        tpl2 = Template(review_type_id=review_types[1].id, name="V12发动机台架试验验证评审表",
                        description="对发动机性能试验、可靠性试验、排放试验的结果进行评审，确认是否满足设计目标",
                        status="draft", tags=json.dumps(["试验", "验证", "台架"]), created_by=users[1].id)
        db.add(tpl2); await db.flush()
        v2 = TemplateVersion(template_id=tpl2.id, version_number="1.0", status="draft",
                             change_summary="初始草稿", created_by=users[1].id)
        db.add(v2); await db.flush()

        db.add(DocBlock(version_id=v2.id, sort_order=0, title="试验项目清单",
            content="<h2>台架试验项目</h2><ol><li>外特性试验（额定功率/最大扭矩验证）</li><li>万有特性试验（燃油消耗率MAP）</li><li>1000h全速全负荷可靠性试验</li><li>热循环试验（500次）</li><li>排放试验（国六b标准）</li><li>NVH振动噪声试验</li></ol>"))

        for item in [
            {"sort_order": 0, "name": "性能达标情况", "description": "功率、扭矩、燃油消耗率是否达到设计指标", "item_type": "score", "required": True,
             "config": json.dumps({"max_score": 100, "min_score": 0, "step": 5})},
            {"sort_order": 1, "name": "可靠性试验结果", "description": "1000h可靠性试验是否通过，有无重大故障", "item_type": "radio", "required": True,
             "config": json.dumps({"options": [{"label": "通过，无故障", "value": "passed"}, {"label": "通过，有小故障", "value": "minor_issue"}, {"label": "未通过", "value": "failed"}]})},
            {"sort_order": 2, "name": "排放达标情况", "description": "是否满足国六b排放标准", "item_type": "radio", "required": True,
             "config": json.dumps({"options": [{"label": "达标", "value": "compliant"}, {"label": "超标≤10%", "value": "slight_over"}, {"label": "超标>10%", "value": "over"}]})},
            {"sort_order": 3, "name": "NVH评价", "description": "振动噪声水平是否满足NVH目标", "item_type": "score", "required": True,
             "config": json.dumps({"max_score": 100, "min_score": 0, "step": 5})},
            {"sort_order": 4, "name": "试验结论", "description": "综合验证结论", "item_type": "radio", "required": True,
             "config": json.dumps({"options": [{"label": "通过，可进入SOP", "value": "pass_sop"}, {"label": "有条件通过", "value": "conditional"}, {"label": "不通过，需改进", "value": "fail"}]})},
            {"sort_order": 5, "name": "评审意见", "description": "试验验证详细评审意见", "item_type": "textarea", "required": True,
             "config": json.dumps({"max_length": 3000, "placeholder": "请填写试验验证评审意见..."})},
        ]:
            item["version_id"] = v2.id; db.add(ReviewItem(**item))

        tpl2.current_version_id = v2.id; db.add(tpl2)
        await db.flush()
        await db.commit()

        print(f"\n种子数据完成:")
        print(f"  用户: admin/tpl_admin/approver (密码: admin123)")
        print(f"  评审类型: {len(review_types)} 个")
        print(f"  模板: 2 个")
        print(f"    1. 发动机关键零部件工艺评审表 (active)")
        print(f"    2. V12发动机台架试验验证评审表 (draft)")


if __name__ == "__main__":
    asyncio.run(seed())
