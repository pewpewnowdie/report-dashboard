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
from persistence import save_run_files_pytest
from auth.deps import get_current_user
from sqlalchemy.orm import Session
from db.deps import get_db
from db.models.user import User
from db.models.project import Project
from db.models.project_user import ProjectUser
from db.models.release import Release
from db.models.pytest_run import PytestRun
from db.models.pytest_test import PytestTest

class TestStartRequest(BaseModel):
    run_name: str
    host: str
    pytest_version: str
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
    total : int
    passed : int
    failed : int
    skipped : int
    json_path : str
    log_path : str
    tests : list[dict]
    artifacts : dict


def extract_test_row(test, summary):
    nodeid = test.get("nodeid")
    outcome = test.get("outcome")

    setup = test.get("setup", {})
    call = test.get("call", {})
    teardown = test.get("teardown", {})

    setup_dur = setup.get("duration", 0)
    call_dur = call.get("duration", 0)
    teardown_dur = teardown.get("duration", 0)

    total_duration = setup_dur + call_dur + teardown_dur

    error_message = ""
    file_path = ""
    line_no = ""

    if outcome == "failed":
        crash = call.get("crash", {})
        error_message = crash.get("message", "")
        file_path = crash.get("path", "")
        line_no = crash.get("lineno", "")

    return {
        "nodeid": nodeid,
        "outcome": outcome,
        "total_duration_s": total_duration,
        "setup_duration_s": setup_dur,
        "call_duration_s": call_dur,
        "teardown_duration_s": teardown_dur,
        "error_message": error_message,
        "file": file_path,
        "line": line_no,
        "total_tests": summary.get("total"),
        "passed": summary.get("passed"),
        "failed": summary.get("failed"),
        "exit_code": summary.get("exitcode"),
    }


def generate_csv_report(json_path, output_path):
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    summary = data.get("summary", {})
    summary["exitcode"] = data.get("exitcode")

    rows = [
        extract_test_row(test, summary)
        for test in data.get("tests", [])
    ]

    df = pd.DataFrame(rows)

    df.to_csv(output_path, index=False)
    return output_path

def make_zip_bytes(folder: Path) -> bytes:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in folder.rglob("*"):
            if path.is_file():
                arcname = path.relative_to(folder)
                zf.write(path, arcname)
    return buffer.getvalue()

router = APIRouter(prefix="/pytest_runs")

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

    run = PytestRun(
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
    json_file: UploadFile = File(...),
    log: UploadFile = File(...),
    x_run_token: str = Header(..., alias="X-Run-Token"),
    db: Session = Depends(get_db)
):
    run = db.query(PytestRun).filter(PytestRun.id == run_id).first()

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

    json_bytes = await json_file.read()
    log_bytes = await log.read()

    json_hash = sha256_bytes(json_bytes)
    log_hash = sha256_bytes(log_bytes)

    if json_hash != meta.artifacts.get("json_hash"):
        raise HTTPException(400, "JSON hash mismatch")
    
    if log_hash != meta.artifacts.get("log_hash"):
        raise HTTPException(400, "log hash mismatch")
    
    status = "FINISHED" if meta.exit_code <= 1  else "FAILED"

    files = {
        "json": json_bytes,
        "log": log_bytes,
    }

    saved_paths = save_run_files_pytest(run_id, run, files)

    run.status = status
    run.exit_code = meta.exit_code
    run.duration = meta.duration
    run.log_path = meta.log_path
    run.json_path = meta.json_path
    run.total = meta.total
    run.passed = meta.passed
    run.failed = meta.failed
    run.skipped = meta.skipped
    run.json_path = saved_paths["json_path"]
    run.log_path = saved_paths["log_path"]
    run.upload_token_used = True

    for test in meta.tests:
        test_entry = PytestTest(
            run_id=run.id,
            name=test.get("name"),
            file_path=test.get("file_path"),
            status=test.get("status"),
            duration=test.get("duration"),
            error_message=test.get("error_message"),
            std_out=test.get("std_out"),
            std_err=test.get("std_err")
        )
        db.add(test_entry)

    try:
        csv_path = generate_csv_report(run.json_path, f"data/run/{run.id}/report.csv")
        run.csv_path = csv_path
        db.commit()
    except Exception as e:
        run.csv_path = None
        db.commit()

    return { "run_id": run.id, "status": status }