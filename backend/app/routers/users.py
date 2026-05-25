from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from ..database import get_db
from ..dependencies import get_current_user, require_role
from ..schemas.user import UserCreate, UserUpdate, UserRoleUpdate, UserResponse
from ..models.user import User
from ..utils.security import hash_password

router = APIRouter()


@router.get("")
async def list_users(
    keyword: str = Query(None),
    role: str = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_role("sys_admin")),
    db: AsyncSession = Depends(get_db),
):
    query = select(User)
    count_query = select(func.count()).select_from(User)
    
    conditions = []
    if keyword:
        conditions.append(
            (User.username.ilike(f"%{keyword}%")) | (User.display_name.ilike(f"%{keyword}%"))
        )
    if role:
        conditions.append(User.role == role)
    
    if conditions:
        query = query.where(*conditions)
        count_query = count_query.where(*conditions)
    
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    query = query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    users = result.scalars().all()
    
    return {
        "items": [u.to_dict() for u in users],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{user_id}")
async def get_user(
    user_id: int,
    current_user: User = Depends(require_role("sys_admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")
    return user.to_dict()


@router.post("")
async def create_user(
    data: UserCreate,
    current_user: User = Depends(require_role("sys_admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.username == data.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="用户名已存在")
    
    user = User(
        username=data.username,
        password_hash=hash_password(data.password),
        display_name=data.display_name,
        email=data.email,
        role=data.role,
        department=data.department,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user.to_dict()


@router.put("/{user_id}")
async def update_user(
    user_id: int,
    data: UserUpdate,
    current_user: User = Depends(require_role("sys_admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")
    
    if data.display_name is not None:
        user.display_name = data.display_name
    if data.email is not None:
        user.email = data.email
    if data.department is not None:
        user.department = data.department
    if data.is_active is not None:
        user.is_active = data.is_active
    
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user.to_dict()


@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(require_role("sys_admin")),
    db: AsyncSession = Depends(get_db),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="不能删除自己")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")
    
    user.is_active = False
    db.add(user)
    await db.flush()
    return {"message": "用户已禁用"}


@router.put("/{user_id}/role")
async def update_user_role(
    user_id: int,
    data: UserRoleUpdate,
    current_user: User = Depends(require_role("sys_admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")
    
    valid_roles = ["general_user", "template_admin", "template_reviewer", "sys_admin"]
    if data.role not in valid_roles:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"无效角色，可选: {', '.join(valid_roles)}")
    
    user.role = data.role
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user.to_dict()
