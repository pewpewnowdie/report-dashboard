from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from middleware.auth import auth_middleware
from routes.auth import router as auth_router
from routes.jmeter_runs import router as jmeter_runs_router
from routes.admin import router as admin_router
from routes.projects import router as projects_router
from routes.pytest_runs import router as pytest_runs_router
from routes.robot_runs import router as robot_runs_router
from routes.files import router as files_router
from routes.applications import router as applications_router

REPORT_ROOT = Path("data/run")
app = FastAPI(title="JMCTL Server")

app.mount(
    "/reports",
    StaticFiles(directory=REPORT_ROOT, html=True),
    name="reports"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.middleware("http")(auth_middleware)

app.include_router(admin_router)
app.include_router(auth_router)
app.include_router(jmeter_runs_router)
app.include_router(pytest_runs_router)
app.include_router(robot_runs_router)
app.include_router(projects_router)
app.include_router(files_router)
app.include_router(applications_router)
