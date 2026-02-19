from fastapi import APIRouter, UploadFile, File, Header, HTTPException, Form, Query, Request, Depends
from fastapi.responses import StreamingResponse
from datetime import datetime
import hashlib
import json
from pathlib import Path
import zipfile
import io

from models import TestStartRequest, TestStartResponse, TestStopMetadata
from security import generate_upload_token
from hashing import sha256_bytes
from persistence import save_run_files
from config import get_jmeter
from reporting import generate_html_report
from auth.deps import get_current_user
from sqlalchemy.orm import Session
from db.deps import get_db
from db.models.user import User
from db.models.project import Project
from db.models.project_user import ProjectUser
from db.models.release import Release
from db.models.run import Run

def make_zip_bytes(folder: Path) -> bytes:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in folder.rglob("*"):
            if path.is_file():
                arcname = path.relative_to(folder)
                zf.write(path, arcname)
    return buffer.getvalue()

router = APIRouter(prefix="/runs")

@router.post("/start", response_model=TestStartResponse)
def run_start(req: TestStartRequest, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(Project).filter(
        Project.project_key == req.project_key,
        Project.is_active == True
    ).first()

    if not project:
        raise HTTPException(403, "Project not found")
    
    access = db.query(ProjectUser).filter(
        ProjectUser.user_id == current_user.id,
        ProjectUser.project_id == project.id
    ).first()

    if not access:
        raise HTTPException(403, "Project not accessible")
    
    release = (
        db.query(Release)
        .filter_by(name=req.release, project_id=project.id)
        .first()
    )

    if not release:
        raise HTTPException(404, "Release not found")

    upload_token, token_hash = generate_upload_token()

    run = Run(
        run_name=req.run_name,
        release=release,
        started_by=current_user,
        status="STARTED",
        upload_token_hash=token_hash,
        jmx_path=None,
        jmx_hash=req.jmx_hash
    )

    db.add(run)
    db.commit()
    db.refresh(run)

    return TestStartResponse(
        run_id=run.id,
        upload_token=upload_token,
        server_time=datetime.utcnow()
    )

@router.post("/stop/{run_id}")
async def run_stop(
    run_id: str,
    metadata: str = Form(...),
    jmx: UploadFile = File(...),
    jtl: UploadFile = File(...),
    log: UploadFile = File(...),
    x_run_token: str = Header(..., alias="X-Run-Token"),
    db: Session = Depends(get_db)
):
    run = db.query(Run).filter(Run.id == run_id).first()

    if not run:
        raise HTTPException(404, "Unkown run_id")
    
    if run.status != "STARTED":
        raise HTTPException(400, "Run already close")
    
    if not x_run_token:
        raise HTTPException(400, "Missing Upload Token")
    
    token_hash = hashlib.sha256(x_run_token.encode()).hexdigest()

    if token_hash != run.upload_token_hash:
        raise HTTPException(403, "Invalid Upload Token")
    
    if run.upload_token_used:
        raise HTTPException(403, "Upload Token already used")
    
    try:
        meta = TestStopMetadata(**json.loads(metadata))
    except:
        raise HTTPException(400, "Invalid metadata payload")

    jmx_bytes = await jmx.read()
    jtl_bytes = await jtl.read()
    log_bytes = await log.read()

    jmx_hash = sha256_bytes(jmx_bytes)
    jtl_hash = sha256_bytes(jtl_bytes)
    log_hash = sha256_bytes(log_bytes)

    if jmx_hash != run.jmx_hash:
        raise HTTPException(400, "JMX hash mismatch")

    if jtl_hash != meta.artifacts.get("jtl_hash"):
        raise HTTPException(400, "JTL hash mismatch")
    
    if log_hash != meta.artifacts.get("log_hash"):
        raise HTTPException(400, "log hash mismatch")
    
    status = "FINISHED" if meta.exit_code == 0 else "FAILED"

    files = {
        "jmx": jmx_bytes,
        "jtl": jtl_bytes,
        "log": log_bytes,
    }

    saved_paths = save_run_files(run_id, run, files)

    run.status = status
    run.exit_code = meta.exit_code
    run.duration = meta.duration
    run.v_users = meta.v_users
    run.avg_response_time = meta.avg_response_time
    run.error_rate = meta.error_rate
    run.throughput = meta.throughput
    run.run_status= meta.run_status
    run.ended_at = datetime.utcnow()
    run.upload_token_used = True
    run.script_name = meta.script_name
    run.jmx_path = saved_paths.get("jmx")
    run.jtl_path = saved_paths.get("jtl")
    run.log_path = saved_paths.get("log")

    db.commit()

    try:
        report_path = generate_html_report(run_id, get_jmeter())
        run.report_path = report_path
        db.commit()
    except Exception as e:
        run.report_path = None
        db.commit()

    return { "run_id": run.id, "status": status }

@router.get("/{run_id}")
async def get_run(
    request: Request,
    run_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    run = db.query(Run).filter_by(id=run_id).first()

    if not run:
        raise HTTPException(404, "Run not found")    
    
    project = run.release.project
    
    if current_user.role != "admin":
        access = db.query(ProjectUser).filter(
            ProjectUser.user_id == current_user.id,
            ProjectUser.project_id == project.id
        ).first()

        if not access:
            raise HTTPException(403, "No access")

    return (
        {
            "run_id": run.id,
            "run_name": run.run_name,
            "status": run.status,
            "started_at": run.started_at,
            "started_by": run.started_by.username,
            "release": run.release.id if run.release else None,
            "ended_at": run.ended_at,
            "report_url": f"{request.base_url}reports/{run.id}/report/"
                if run.status in ("FINISHED", "FAILED") else None,
            "script_name": run.script_name,
            "run_status": run.run_status,
            "duration": run.duration,
            "v_users": run.v_users,
            "avg_response_time": run.avg_response_time,
            "error_rate": run.error_rate,
            "throughput": run.throughput,
            "project_key": project.project_key
        }
    )

@router.get("/download/{run_id}")
async def download_run(
    request: Request,
    run_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    run = db.query(Run).filter_by(id=run_id).first()

    if not run:
        raise HTTPException(404, "Run not found")    
    
    project = run.release.project
    
    if current_user.role != "admin":
        access = db.query(ProjectUser).filter(
            ProjectUser.user_id == current_user.id,
            ProjectUser.project_id == project.id
        ).first()

        if not access:
            raise HTTPException(403, "No access")
        
    base_dir = Path("data/run")
    target = base_dir / run.id

    if not target.is_dir():
        raise HTTPException(404, "Run not found")
    
    zip_bytes = make_zip_bytes(target)

    return StreamingResponse(
        io.BytesIO(zip_bytes),
        media_type="application/zip",
        headers={
            "Content-Disposition": f"attachment; filename={target.name}.zip"
        },
    )