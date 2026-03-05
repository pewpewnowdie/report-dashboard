import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base


class RobotRun(Base):
    __tablename__ = "robot_runs"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )

    run_name: Mapped[str] = mapped_column(
        String, nullable=False
    )

    started_by_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id"), nullable=False
    )

    started_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )

    ended_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=True
    )

    status: Mapped[str] = mapped_column(
        String, nullable=False, default="STARTED"
    )

    release_id: Mapped[str] = mapped_column(
        String, ForeignKey("releases.id"), nullable=False
    )

    started_by = relationship("User")
    release = relationship("Release")

    upload_token_hash: Mapped[str | None] = mapped_column(String, nullable=True)
    upload_token_used: Mapped[bool] = mapped_column(Boolean, default=False)

    xml_path: Mapped[str | None] = mapped_column(String, nullable=True)
    log_path: Mapped[str | None] = mapped_column(String, nullable=True)
    report_path: Mapped[str | None] = mapped_column(String, nullable=True)

    total: Mapped[int | None] = mapped_column(nullable=True)
    passed: Mapped[int | None] = mapped_column(nullable=True)
    failed: Mapped[int | None] = mapped_column(nullable=True)
    skipped: Mapped[int | None] = mapped_column(nullable=True)
    duration: Mapped[str] = mapped_column(String, nullable=False, default="0")

    tests = relationship("RobotTest", back_populates="run", cascade="all, delete-orphan")