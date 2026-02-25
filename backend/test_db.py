from sqlalchemy.orm import Session
from db.session import engine
from db.models.project import Project


def get_all_projects():
    with Session(engine) as session:
        projects = session.query(Project).all()

        return [
            {
                "id": p.id,
                "project_key": p.project_key,
                "name": p.name,
                "is_active": p.is_active,
                "created_at": p.created_at.isoformat() if p.created_at else None,
                "releases": [
                    {
                        "id": r.id,
                        "name": r.name,
                        "created_at": r.created_at.isoformat() if r.created_at else None,
                    }
                    for r in p.releases
                ]
            }
            for p in projects
        ]


print(get_all_projects())
