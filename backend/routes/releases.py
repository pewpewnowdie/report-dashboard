from fastapi import APIRouter, HTTPException, Form, Query, Request, Depends
from sqlalchemy.orm import joinedload

from auth.deps import get_current_user
from sqlalchemy.orm import Session
from db.deps import get_db
from db.models.user import User
from db.models.project import Project
from db.models.project_user import ProjectUser
from db.models.release import Release
from db.models.run import Run

router = APIRouter(prefix="/releases")

@router.get("")
async def get_releases(
    request: Request,
    project: str = Query(..., description="Project"),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    releases = (
        db.query(Release)
        .join(Project, Project.id == Release.project_id)
        .filter(
            Project.project_key == project
        ).order_by(Release.created_at.desc()).all()
    )

    return [
        {
            "id": r.id,
            "name": r.name,
            "created_at": r.created_at
        }
        for r in releases
    ]

@router.get("/{release_id}")
async def list_runs(
    request: Request,
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
    
    runs = (
        db.query(Run)
        .options(joinedload(Run.release))
        .filter(
        Run.release_id == release_id,
        Run.status == "FINISHED"
        ).order_by(Run.started_at.desc()).all()
    )

    return [
        {
            "id": run.id,
            "name": run.run_name,
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
        for run in runs
    ]

