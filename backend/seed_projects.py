from sqlalchemy.orm import Session
from db.session import engine
from db.models.project import Project
from db.models.release import Release


def seed_projects():
    with Session(engine) as db:

        # Prevent duplicate seeding
        if db.query(Project).first():
            print("Projects already exist. Skipping seed.")
            return

        # 🔹 Project 1
        project1 = Project(
            project_key="RD",
            name="Report Dashboard",
            is_active=True
        )

        project1.releases = [
            Release(name="v1.0"),
            Release(name="v1.1"),
            Release(name="v2.0"),
        ]

        # 🔹 Project 2
        project2 = Project(
            project_key="PT",
            name="Performance Tool",
            is_active=True
        )

        project2.releases = [
            Release(name="Beta"),
            Release(name="v1.0"),
        ]

        # 🔹 Project 3
        project3 = Project(
            project_key="AUTO",
            name="Automation Suite",
            is_active=False
        )

        project3.releases = [
            Release(name="Initial"),
        ]

        db.add_all([project1, project2, project3])
        db.commit()

        print("Projects and releases seeded successfully.")


if __name__ == "__main__":
    seed_projects()
