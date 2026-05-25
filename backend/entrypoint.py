#!/usr/bin/env python3
"""Docker entrypoint — seed database then start server."""
import asyncio
import os
import sys

async def main():
    from app.database import AsyncSessionLocal
    from sqlalchemy import text
    os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:////app/data/review_template.db")

    # Check if DB is already seeded
    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(text("SELECT COUNT(*) FROM users"))
            count = result.scalar()
        except Exception:
            count = 0
        await db.commit()

    if count == 0:
        print("🔄 Seeding database...")
        from seed import seed
        await seed()
        print("✅ Seed complete!")
    else:
        print(f"✅ Database ready ({count} users)")

if __name__ == "__main__":
    asyncio.run(main())
    os.execvp("uvicorn", ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"])
