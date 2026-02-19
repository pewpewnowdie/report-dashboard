from fastapi import APIRouter, UploadFile, File, Header, HTTPException, Form, Query, Request, Depends
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from uuid import uuid4
from datetime import datetime
import hashlib
import json
from pathlib import Path

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
from db.models.run import Run

router = APIRouter(prefix="/projects")

@router.get("")
def get_projects(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "admin":
        projects = db.query(Project).all()
    else:
        projects = (
            db.query(Project)
            .join(ProjectUser, Project.id == ProjectUser.project_id)
            .filter(
                ProjectUser.user_id == current_user.id
            ).all()
        )

    return [
        {
            "project_key": p.project_key,
            "name": p.name
        }
        for p in projects
    ]