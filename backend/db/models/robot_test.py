import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base

class RobotTest(Base):
    __tablename__ = "robot_tests"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )

    run_id: Mapped[str] = mapped_column(
        String, ForeignKey("robot_runs.id"), nullable=False
    )

    name: Mapped[str] = mapped_column(String, nullable=False)

    status: Mapped[str] = mapped_column(String, nullable=False)
    duration: Mapped[float] = mapped_column(nullable=False)

    info: Mapped[str | None] = mapped_column(String, nullable=True)
    warn: Mapped[str | None] = mapped_column(String, nullable=True)
    error: Mapped[str | None] = mapped_column(String, nullable=True)
    debug: Mapped[str | None] = mapped_column(String, nullable=True)

    run = relationship("RobotRun", back_populates="tests")