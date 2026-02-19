from db.base import Base
from db.session import engine

from db.models.user import User
from db.models.project import Project
from db.models.project_user import ProjectUser
from db.models.run import Run
from db.models.release import Release

Base.metadata.create_all(bind=engine)