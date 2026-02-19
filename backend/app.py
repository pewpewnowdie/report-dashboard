from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from middleware.auth import auth_middleware
from routes.auth import router as auth_router
from routes.runs import router as runs_router
from routes.admin import router as admin_router
from routes.releases import router as releases_router
from routes.projects import router as projects_router

REPORTS_ROOT = Path("data/run")
FRONTEND_ROOT = Path("frontend")
app = FastAPI(title="JMCTL Server")

app.mount(
    "/reports",
    StaticFiles(directory=REPORTS_ROOT, html=True),
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
app.include_router(runs_router)
app.include_router(releases_router)
app.include_router(projects_router)
