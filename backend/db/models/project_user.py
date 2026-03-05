import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, UniqueConstraint, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base


class ProjectUser(Base):
    __tablename__ = "project_uers"

    __table_args__ = (
        UniqueConstraint("user_id", "project_id", name="uq_user_project"),
    )

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )

    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id"), nullable=False
    )

    project_id: Mapped[str] = mapped_column(
        String, ForeignKey("projects.id"), nullable=False
    )

    added_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )