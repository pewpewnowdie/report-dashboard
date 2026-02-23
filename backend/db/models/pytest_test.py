import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base

class PytestTest(Base):
    __tablename__ = "pytest_tests"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )

    run_id: Mapped[str] = mapped_column(
        String, ForeignKey("pytest_runs.id"), nullable=False
    )

    name: Mapped[str] = mapped_column(String, nullable=False)
    file_path: Mapped[str] = mapped_column(String, nullable=False)

    status: Mapped[str] = mapped_column(String, nullable=False)
    duration: Mapped[float] = mapped_column(nullable=False)

    error_message: Mapped[str | None] = mapped_column(String, nullable=True)
    std_out: Mapped[str | None] = mapped_column(String, nullable=True)
    std_err: Mapped[str | None] = mapped_column(String, nullable=True)

    run = relationship("PytestRun", back_populates="tests")
