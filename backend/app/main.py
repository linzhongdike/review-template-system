from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from .config import get_settings
from .database import init_db

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables
    await init_db()
    yield
    # Shutdown


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploads
import os
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

# Import and register routers
from .routers import auth, users, review_types, templates, versions, approvals, admin, dashboard
from .models.role_permission import RolePermission

app.include_router(auth.router, prefix="/api/auth", tags=["认证"])
app.include_router(users.router, prefix="/api/users", tags=["用户管理"])
app.include_router(review_types.router, prefix="/api/review-types", tags=["评审阶段"])
app.include_router(templates.router, prefix="/api/templates", tags=["模板管理"])
app.include_router(versions.router, prefix="/api/templates", tags=["版本管理"])
app.include_router(approvals.router, prefix="/api", tags=["审批管理"])
app.include_router(admin.router, prefix="/api", tags=["权限管理"])
app.include_router(dashboard.router, prefix="/api", tags=["仪表盘"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "version": settings.APP_VERSION}
