from fastapi import APIRouter, UploadFile, File, Header, HTTPException, Form, Query, Request, Depends
from fastapi.responses import StreamingResponse
from datetime import datetime
import hashlib
import json
from pathlib import Path
import zipfile
import io

from auth.deps import get_current_user
from sqlalchemy.orm import Session
from db.deps import get_db
from db.models.user import User
from db.models.project import Project
from db.models.project_user import ProjectUser
from db.models.release import Release
from db.models.jmeter_run import JmeterRun
from db.models.pytest_run import PytestRun

def make_zip_bytes(folder: Path) -> bytes:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in folder.rglob("*"):
            if path.is_file():
                arcname = path.relative_to(folder)
                zf.write(path, arcname)
    return buffer.getvalue()

router = APIRouter(prefix="/files")

@router.get("/jmeter/{run_id}/{file_type}")
@router.get("/jmeter/{run_id}/{file_type}/")
def get_jmeter_file(run_id: str,
                    file_type: str,
                    db: Session = Depends(get_db)):
    run = db.query(JmeterRun).filter_by(id=run_id).first()

    if not run:
        raise HTTPException(404, "Run not found")
    
    file_path = None
    if file_type == "jmx":
        file_path = run.jmx_path
    elif file_type == "jtl":
        file_path = run.jtl_path
    elif file_type == "log":
        file_path = run.log_path
    elif file_type == "html":
        html = run.report_path
    else:
        raise HTTPException(400, "Invalid file type requested")
    if file_type == "html":
        if not html:
            raise HTTPException(404, "Requested file not found")
        zip_bytes = make_zip_bytes(Path(html))
        return StreamingResponse(
            io.BytesIO(zip_bytes),
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename={Path(html).name}.zip"}
        )
    if not file_path or not Path(file_path).is_file():
        raise HTTPException(404, "Requested file not found")
    
    return StreamingResponse(Path(file_path).open("rb"), media_type="application/octet-stream", headers={"Content-Disposition": f"attachment; filename={Path(file_path).name}"})

@router.get("/pytest/{run_id}/{file_type}")
@router.get("/pytest/{run_id}/{file_type}/")
def get_pytest_file(run_id: str,
                    file_type: str,
                    db: Session = Depends(get_db)):
    run = db.query(PytestRun).filter_by(id=run_id).first()

    if not run:
        raise HTTPException(404, "Run not found")
    
    file_path = None
    if file_type == "json":
        file_path = run.json_path
    elif file_type == "csv":
        file_path = run.csv_path
    elif file_type == "log":
        file_path = run.log_path
    elif file_type == "html":
        html = run.report_path
    else:
        raise HTTPException(400, "Invalid file type requested")
    if file_type == "html":
        if not html:
            raise HTTPException(404, "Requested file not found")
        zip_bytes = make_zip_bytes(Path(html))
        return StreamingResponse(
            io.BytesIO(zip_bytes),
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename={Path(html).name}.zip"}
        )
    if not file_path or not Path(file_path).is_file():
        raise HTTPException(404, "Requested file not found")
    
    return StreamingResponse(Path(file_path).open("rb"), media_type="application/octet-stream", headers={"Content-Disposition": f"attachment; filename={Path(file_path).name}"})

@router.get("/applications/{filename}")
def get_application_file(filename: str):
    file_path = Path("data/applications") / filename
    if not file_path.is_file():
        raise HTTPException(404, "Requested file not found")
    
    return StreamingResponse(file_path.open("rb"), media_type="application/octet-stream", headers={"Content-Disposition": f"attachment; filename={file_path.name}"})