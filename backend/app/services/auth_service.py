from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from ..models.user import User
from ..utils.security import hash_password, verify_password, create_access_token


async def register_user(db: AsyncSession, username: str, password: str, display_name: str) -> User:
    result = await db.execute(select(User).where(User.username == username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="用户名已存在")
    user = User(
        username=username,
        password_hash=hash_password(password),
        display_name=display_name,
        role="template_admin"
    )
    db.add(user)
    await db.flush()
    return user


async def login_user(db: AsyncSession, username: str, password: str) -> dict:
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户名或密码错误")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="用户已被禁用")
    token = create_access_token(subject=user.id)
    return {"access_token": token, "token_type": "bearer", "user": user.to_dict()}


async def change_password(db: AsyncSession, user: User, old_password: str, new_password: str):
    if not verify_password(old_password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="原密码错误")
    user.password_hash = hash_password(new_password)
    db.add(user)
    await db.flush()
