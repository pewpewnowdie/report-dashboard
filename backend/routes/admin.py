from fastapi import APIRouter, Depends, HTTPException, Request, Query
from datetime import datetime
from sqlalchemy.orm import Session, joinedload
from db.deps import get_db
from auth.deps import get_current_user
from db.models.user import User
from db.models.project import Project
from db.models.release import Release
from db.models.project_user import ProjectUser
from db.models.jmeter_run import JmeterRun
from db.models.pytest_run import PytestRun
from db.models.robot_run import RobotRun
from pydantic import BaseModel, Field

def require_admin(
    current_user = Depends(get_current_user)
):
    if getattr(current_user, "role", None) != "admin":
        raise HTTPException(403, "Admin Access Required")
    return current_user

class ProjectCreate(BaseModel):
    project_key: str
    name: str

class ReleaseCreate(BaseModel):
    project_key: str
    name: str

class AddUserToProject(BaseModel):
    project_key: str
    username: str

class RemoveUserFromProject(BaseModel):
    project_key: str
    username: str

router = APIRouter(
    prefix="/admin",
    tags=["admin"]
)

@router.post("/projects")
async def create_project(
    req: ProjectCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    if db.query(Project).filter_by(project_key=req.project_key).first():
        raise HTTPException(status_code=400, detail="Project already exists")

    project = Project(
        project_key=req.project_key,
        name=req.name,
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    return {
        "id": project.id,
        "project_key": project.project_key,
        "name": project.name
    }

@router.get("/projects")
async def get_projects(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    projects = db.query(Project).all()

    return [
        {
            "project_key": p.project_key,
            "name": p.name
        }
        for p in projects
    ]

@router.delete("/projects/{project_key}")
async def delete_project(
    project_key: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    project = db.query(Project).filter_by(project_key=project_key).first()

    if not project:
        raise HTTPException(404, "Project not found")

    db.delete(project)
    db.commit()

    return {"status": "deleted"}

@router.post("/releases")
async def create_release(
    req: ReleaseCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    project = db.query(Project).filter_by(project_key=req.project_key).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    existing = db.query(Release).join(Project).filter(
        Release.name == req.name,
        Project.id == project.id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Duplicate release name in same project")

    release = Release(
        project_id=project.id,
        name=req.name,
    )

    db.add(release)
    db.commit()
    db.refresh(release)

    return {
        "id": release.id,
        "project_key": project.project_key,
        "name": release.name
    }

@router.get("/releases")
async def get_releases(
    request: Request,
    project: str = Query(..., description="Project"),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    releases = (
        db.query(Release)
        .join(Project, Project.id == Release.project_id)
        .filter(
            Project.project_key == project
        ).order_by(Release.created_at.asc()).all()
    )

    return [
        {
            "id": r.id,
            "name": r.name,
            "created_at": r.created_at
        }
        for r in releases
    ]

@router.delete("/releases/{release_id}")
async def delete_release(
    request: Request,
    release_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    release = db.query(Release).filter_by(id=release_id).first()

    if not release:
        raise HTTPException(404, "Release not found")
    
    db.delete(release)
    db.commit()

    return {"status": "deleted"}

@router.get("/releases/{release_id}")
async def list_runs(
    request: Request,
    release_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    release = db.query(Release).filter_by(id=release_id).first()

    if not release:
        raise HTTPException(404, "Release not found")
    
    runs = (
        db.query(JmeterRun)
        .options(joinedload(JmeterRun.release))
        .filter(
        JmeterRun.release_id == release_id
        ).order_by(JmeterRun.started_at.desc()).all()
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
            "project_key": release.project.project_key
        }
        for run in runs
    ]

@router.post("/projects/users")
async def add_user_to_project(
    req: AddUserToProject,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    project = db.query(Project).filter_by(project_key=req.project_key).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    user = db.query(User).filter_by(username=req.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    exists = db.query(ProjectUser).filter_by(project_id=project.id, user_id=user.id).first()

    if exists:
        return {"status": "already linked"}

    db.add(ProjectUser(project_id=project.id, user_id=user.id))
    db.commit()

    return {
        "status": "linked"
    }


@router.delete("/projects/users")
async def remove_user_from_project(
    req: AddUserToProject,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    project = db.query(Project).filter_by(project_key=req.project_key).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    user = db.query(User).filter_by(username=req.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    existing = db.query(ProjectUser).filter_by(project_id=project.id, user_id=user.id).first()

    if not existing:
        return {"status": "does not exist"}
    
    db.delete(existing)
    db.commit()

    return {
        "status": "removed"
    }

@router.get("/users")
async def get_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    users = db.query(User).all()

    return [
        {
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "is_active": user.is_active,
            "created_at": user.created_at
        } 
        for user in users
    ]

@router.get("/users/{user_id}/projects")
async def get_project_users(
    request: Request,
    user_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    projects = (
        db.query(Project)
        .join(ProjectUser, ProjectUser.project_id == Project.id)
        .filter(ProjectUser.user_id == user_id)
    ).all()

    return [
        {
            "id": project.id,
            "project_key": project.project_key,
            "name": project.name
        }
        for project in projects
    ]

@router.get("/projects/{project_key}/users")
async def get_project_users(
    request: Request,
    project_key: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    project = db.query(Project).filter_by(project_key=project_key).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    results = (
        db.query(User)
        .join(ProjectUser, ProjectUser.user_id == User.id)
        .filter(ProjectUser.project_id == project.id)
    ).all()

    return [
        {
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "is_active": user.is_active,
            "created_at": user.created_at
        } 
        for user in results
    ]

@router.get("/users/{user_id}/runs")
async def get_user_runs(
    request: Request,
    user_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    jmeter_runs = (
        db.query(JmeterRun)
        .filter(JmeterRun.started_by_id == user_id)
        .filter(JmeterRun.status != "STARTED")
    ).all()
    pytest_runs = (
        db.query(PytestRun)
        .filter(PytestRun.started_by_id == user_id)
        .filter(PytestRun.status != "STARTED")
    ).all()
    robot_runs = (
        db.query(RobotRun)
        .filter(RobotRun.started_by_id == user_id)
        .filter(RobotRun.status != "STARTED")
    ).all()

    return {
        "jmeter_runs": [
            {
                "run_id": run.id,
                "run_name": run.run_name,
                "status": run.status,
                "started_at": run.started_at,
                "started_by": run.started_by.username,
                "release": run.release.name if run.release else None,
                "ended_at": run.ended_at,
                "script_name": run.script_name,
                "run_status": run.run_status,
                "duration": run.duration,
                "v_users": run.v_users,
                "avg_response_time": run.avg_response_time,
                "error_rate": run.error_rate,
                "throughput": run.throughput,
                "project_key": run.release.project.project_key,
                "test_type": "jmeter",
                "release_id": run.release.id if run.release else None,
            }
            for run in jmeter_runs
        ],
        "pytest_runs": [
            {
                "run_id": run.id,
                "run_name": run.run_name,
                "status": run.status,
                "started_at": run.started_at,
                "started_by": run.started_by.username if hasattr(run, 'started_by') else None,
                "release": run.release.name if hasattr(run, 'release') and run.release else None,
                "project_key": run.release.project.project_key,
                "ended_at": run.ended_at,
                "total": run.total,
                "passed": run.passed,
                "failed": run.failed,
                "skipped": run.skipped,
                "duration": run.duration,
                "test_type": "pytest",
                "release_id": run.release.id if hasattr(run, 'release') and run.release else None,
            }
            for run in pytest_runs
        ],
        "robot_runs": [
            {
                "run_id": run.id,
                "run_name": run.run_name,
                "status": run.status,
                "started_at": run.started_at,
                "started_by": run.started_by.username if hasattr(run, 'started_by') else None,
                "release": run.release.name if hasattr(run, 'release') and run.release else None,
                "project_key": run.release.project.project_key,
                "ended_at": run.ended_at,
                "total": run.total,
                "passed": run.passed,
                "failed": run.failed,
                "skipped": run.skipped,
                "duration": run.duration,
                "test_type": "robot",
                "release_id": run.release.id if hasattr(run, 'release') and run.release else None,
            } for run in robot_runs
        ]
    }