import os
import shutil
from pathlib import Path
from ..config import get_settings

settings = get_settings()


def get_upload_dir() -> Path:
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    return upload_dir


def save_upload_file(file_data: bytes, filename: str) -> str:
    upload_dir = get_upload_dir()
    file_path = upload_dir / filename
    with open(file_path, "wb") as f:
        f.write(file_data)
    return str(file_path)


def delete_file(filepath: str) -> bool:
    try:
        if os.path.exists(filepath):
            os.remove(filepath)
        return True
    except Exception:
        return False
