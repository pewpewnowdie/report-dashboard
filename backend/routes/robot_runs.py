from fastapi import APIRouter, UploadFile, File, Header, HTTPException, Form, Query, Request, Depends
from fastapi.responses import StreamingResponse
from datetime import datetime
import hashlib
import json
import sys
import pandas as pd
from pathlib import Path
import zipfile
import io
from pydantic import BaseModel, Field

from security import generate_upload_token
from hashing import sha256_bytes
from persistence import save_run_files_robot
from auth.deps import get_current_user
from sqlalchemy.orm import Session
from db.deps import get_db
from db.models.user import User
from db.models.project import Project
from db.models.project_user import ProjectUser
from db.models.release import Release
from db.models.robot_run import RobotRun
from db.models.robot_test import RobotTest
import os

class TestStartRequest(BaseModel):
    run_name: str
    host: str
    robot_version: str
    start_time: datetime
    project_key: str
    release: str

class TestStartResponse(BaseModel):
    run_id: str
    upload_token: str
    server_time: datetime

class TestStopMetadata(BaseModel):
    exit_code : int
    duration : str
    ended_at: datetime
    total : int
    passed : int
    failed : int
    skipped : int
    xml_path : str
    tests : list[dict]
    artifacts : dict

router = APIRouter(prefix="/robot_runs")

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
    
    release = None

    for r in project.releases:
        if r.id == req.release:
            release = r
            break

    if not release:
        raise HTTPException(404, "Release not found")

    upload_token, token_hash = generate_upload_token()

    run = RobotRun(
        run_name=req.run_name,
        release=release,
        started_by=current_user,
        status="STARTED",
        upload_token_hash=token_hash
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
    xml_file: UploadFile = File(...),
    x_run_token: str = Header(..., alias="X-Run-Token"),
    db: Session = Depends(get_db)
):
    run = db.query(RobotRun).filter(RobotRun.id == run_id).first()
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
    except Exception as e:
        raise HTTPException(400, f"Invalid metadata payload: {str(e)}")

    xml_bytes = await xml_file.read()
    xml_hash = sha256_bytes(xml_bytes)

    if xml_hash != meta.artifacts.get("xml_hash"):
        raise HTTPException(400, "XML hash mismatch")
    
    status = "FINISHED" if meta.exit_code <= 250  else "FAILED"

    files = {
        "xml": xml_bytes,
    }

    saved_paths = save_run_files_robot(run_id, run, files)

    run.status = status
    run.exit_code = meta.exit_code
    run.duration = meta.duration
    run.total = meta.total
    run.passed = meta.passed
    run.failed = meta.failed
    run.skipped = meta.skipped
    run.xml_path = saved_paths["xml_path"]
    run.upload_token_used = True
    run.ended_at = meta.ended_at

    for test in meta.tests:
        test_entry = RobotTest(
            run_id=run.id,
            name=test.get("name"),
            status=test.get("status"),
            duration=test.get("duration"),
            info=test.get("logs", {}).get("info"),
            warn=test.get("logs", {}).get("warn"),
            error=test.get("logs", {}).get("error"),
            debug=test.get("logs", {}).get("debug")
        )
        db.add(test_entry)

    db.commit()

    return { "run_id": run.id, "status": status }

@router.get("/generate_report/{run_id}")
def generate_report(run_id: str, request: Request, db: Session = Depends(get_db)):
    run = db.query(RobotRun).filter(RobotRun.id == run_id).first()

    if not run:
        raise HTTPException(404, "Run not found")
    
    if run.status not in ("FINISHED", "FAILED"):
        raise HTTPException(400, "Run not finished yet")
    
    if os.path.exists(Path(run.report_path) / "index.html"):
        return {"report_url": f"{request.base_url}reports/{run_id}/report/index.html", "download_url": f"{request.base_url}files/robot/{run_id}/html"}
    else:
        return {"report_url": None, "download_url": None}