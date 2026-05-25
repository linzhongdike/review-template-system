from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..dependencies import get_current_user
from ..schemas.auth import LoginRequest, RegisterRequest, TokenResponse, ChangePasswordRequest
from ..services.auth_service import register_user, login_user, change_password
from ..models.user import User

router = APIRouter()


@router.post("/register", response_model=TokenResponse)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    user = await register_user(db, data.username, data.password, data.display_name)
    token_data = await login_user(db, data.username, data.password)
    return token_data


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    return await login_user(db, data.username, data.password)


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user.to_dict()


@router.put("/change-password")
async def change_pwd(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await change_password(db, current_user, data.old_password, data.new_password)
    return {"message": "密码修改成功"}
