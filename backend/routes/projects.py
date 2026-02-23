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
from db.models.release import Release
from db.models.project_user import ProjectUser
from db.models.jmeter_run import JmeterRun
from db.models.pytest_run import PytestRun

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
            "name": p.name,
            "releases": [
                {
                    "id": r.id,
                    "name": r.name,
                }
                for r in p.releases
            ]
        }
        for p in projects
    ]

@router.post("/{project_key}/releases/{release_id}/")
def get_reports(
    request: Request,
    project_key: str,
    release_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
  release = db.query(Release).filter_by(id=release_id).first()

  if not release:
      raise HTTPException(404, "Release not found")    

  project = release.project

  if current_user.role != "admin":
      access = db.query(ProjectUser).filter(
          ProjectUser.user_id == current_user.id,
          ProjectUser.project_id == project.id
      ).first()

      if not access:
          raise HTTPException(403, "No access")
      
  jmeter_reports = db.query(JmeterRun).join(Release).join(Project).filter(
    Project.project_key == project_key,
    Release.id == release_id
  ).all()
  pytest_reports = db.query(PytestRun).join(Release).join(Project).filter(
    Project.project_key == project_key,
    Release.id == release_id
  ).all()
  result = {
    "jmeter_runs": [
      {
        "run_id": run.id,
        "run_name": run.run_name,
        "status": run.status,
        "started_at": run.started_at,
        "started_by": run.started_by.username,
        "release": run.release.id if run.release else None,
        "ended_at": run.ended_at,
        "report_url": f"{request.base_url}reports/{run.id}/report/"
            if run.status in ("FINISHED", "FAILED") and hasattr(run, 'report_path') else None,
        "script_name": run.script_name,
        "run_status": run.run_status,
        "duration": run.duration,
        "v_users": run.v_users,
        "avg_response_time": run.avg_response_time,
        "error_rate": run.error_rate,
        "throughput": run.throughput,
        "project_key": project_key,
        "files": {
          "jmx": { "name": run.script_name, "url": f"{request.base_url}reports/{run.id}/jmx/" },
          "jtl": { "name": run.jtl_path.split("\\")[-1] if hasattr(run, 'jtl_path') and run.jtl_path else None, "url": f"{request.base_url}reports/{run.id}/jtl/" },
          "log": { "name": run.log_path.split("\\")[-1] if hasattr(run, 'log_path') and run.log_path else None, "url": f"{request.base_url}reports/{run.id}/log/" },
        }
      }
      for run in jmeter_reports
    ],
    "pytest_runs": [
      {
        "run_id": run.id,
        "run_name": run.run_name,
        "status": run.status,
        "started_at": run.started_at,
        "started_by": run.started_by.username if hasattr(run, 'started_by') else None,
        "release": run.release.id if hasattr(run, 'release') and run.release else None,
        "ended_at": run.ended_at,
        "total": run.total,
        "passed": run.passed,
        "failed": run.passed,
        "skipped": run.skipped,
        "duration": run.duration,                      
        "tests": [
          {
            "test_id": test.id,
            "name": test.name,
            "status": test.status,
            "duration": test.duration,                
            "error_message": test.error_message if hasattr(test, 'error_message') else None,
            "std_out": test.std_out if hasattr(test, 'std_out') else None,
            "std_err": test.std_err if hasattr(test, 'std_err') else None
          }
          for test in run.tests if hasattr(run, 'tests')
        ],
        "files": {
          "json": { "name": run.json_path.split("\\")[-1] if hasattr(run, 'json_path') and run.json_path else None, "url": f"{request.base_url}reports/{run.id}/json/" },
          "csv": { "name": run.csv_path.split("\\")[-1] if hasattr(run, 'csv_path') and run.csv_path else None, "url": f"{request.base_url}reports/{run.id}/csv/" },
        }
      }
      for run in pytest_reports
    ]
  }
  return result

@router.post("/{project_key}/releases/{release_id}/jmeter")
def get_jmeter_reports(
    request: Request,
    project_key: str,
    release_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
  release = db.query(Release).filter_by(id=release_id).first()

  if not release:
      raise HTTPException(404, "Release not found")    

  project = release.project

  if current_user.role != "admin":
      access = db.query(ProjectUser).filter(
          ProjectUser.user_id == current_user.id,
          ProjectUser.project_id == project.id
      ).first()

      if not access:
          raise HTTPException(403, "No access")
      
  jmeter_reports = db.query(JmeterRun).join(Release).join(Project).filter(
    Project.project_key == project_key,
    Release.id == release_id
  ).all()
  result = [
      {
        "run_id": run.id,
        "run_name": run.run_name,
        "status": run.status,
        "started_at": run.started_at,
        "started_by": run.started_by.username,
        "release": run.release.id if run.release else None,
        "ended_at": run.ended_at,
        "report_url": f"{request.base_url}reports/{run.id}/report/"
            if run.status in ("FINISHED", "FAILED") and hasattr(run, 'report_path') else None,
        "script_name": run.script_name,
        "run_status": run.run_status,
        "duration": run.duration,
        "v_users": run.v_users,
        "avg_response_time": run.avg_response_time,
        "error_rate": run.error_rate,
        "throughput": run.throughput,
        "project_key": project_key,
        "files": {
          "jmx": { "name": run.script_name, "url": f"{request.base_url}reports/{run.id}/jmx/" },
          "jtl": { "name": run.jtl_path.split("\\")[-1] if hasattr(run, 'jtl_path') and run.jtl_path else None, "url": f"{request.base_url}reports/{run.id}/jtl/" },
          "log": { "name": run.log_path.split("\\")[-1] if hasattr(run, 'log_path') and run.log_path else None, "url": f"{request.base_url}reports/{run.id}/log/" },
        }
      }
      for run in jmeter_reports
    ]
  return result

@router.post("/{project_key}/releases/{release_id}/pytest")
def get_pytest_reports(
    request: Request,
    project_key: str,
    release_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
  release = db.query(Release).filter_by(id=release_id).first()

  if not release:
      raise HTTPException(404, "Release not found")    

  project = release.project

  if current_user.role != "admin":
      access = db.query(ProjectUser).filter(
          ProjectUser.user_id == current_user.id,
          ProjectUser.project_id == project.id
      ).first()

      if not access:
          raise HTTPException(403, "No access")
      
  pytest_reports = db.query(PytestRun).join(Release).join(Project).filter(
    Project.project_key == project_key,
    Release.id == release_id
  ).all()
  result = [
      {
        "run_id": run.id,
        "run_name": run.run_name,
        "status": run.status,
        "started_at": run.started_at,
        "started_by": run.started_by.username if hasattr(run, 'started_by') else None,
        "release": run.release.id if hasattr(run, 'release') and run.release else None,
        "ended_at": run.ended_at,
        "total": run.total,
        "passed": run.passed,
        "failed": run.passed,
        "skipped": run.skipped,
        "duration": run.duration,                      
        "tests": [
          {
            "test_id": test.id,
            "name": test.name,
            "status": test.status,
            "duration": test.duration,                
            "error_message": test.error_message if hasattr(test, 'error_message') else None,
            "std_out": test.std_out if hasattr(test, 'std_out') else None,
            "std_err": test.std_err if hasattr(test, 'std_err') else None
          }
          for test in run.tests if hasattr(run, 'tests')
        ],
        "files": {
          "json": { "name": run.json_path.split("\\")[-1] if hasattr(run, 'json_path') and run.json_path else None, "url": f"{request.base_url}reports/{run.id}/json/" },
          "csv": { "name": run.csv_path.split("\\")[-1] if hasattr(run, 'csv_path') and run.csv_path else None, "url": f"{request.base_url}reports/{run.id}/csv/" },
        }
      }
      for run in pytest_reports
  ]
  return result