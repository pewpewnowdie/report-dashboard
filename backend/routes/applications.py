from fastapi import APIRouter, UploadFile, File, Header, HTTPException, Form, Query, Request, Depends
from fastapi.responses import StreamingResponse
from datetime import datetime
import hashlib
import json
from pathlib import Path
import zipfile
import io

def make_zip_bytes(folder: Path) -> bytes:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in folder.rglob("*"):
            if path.is_file():
                arcname = path.relative_to(folder)
                zf.write(path, arcname)
    return buffer.getvalue()

router = APIRouter(prefix="/applications")

BASE_DIR = Path("data/applications")

@router.get("")
def get_applications(
    request: Request
):
    if not BASE_DIR.exists():
        raise HTTPException(status_code=500, detail="Applications directory not found")

    applications = []

    for json_file in BASE_DIR.glob("*.json"):
        try:
            with open(json_file, "r", encoding="utf-8") as f:
                app_data = json.load(f)

            for version in app_data.get("versions", []):
                filename = version.get("filename")
                if filename:
                    version["download_url"] = f"{request.base_url}files/applications/{filename}"

            applications.append(app_data)

        except Exception as e:
            print(f"Error loading {json_file.name}: {e}")

    return applications
