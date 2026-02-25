import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base


class JmeterRun(Base):
    __tablename__ = "jmeter_runs"

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

    jmx_hash: Mapped[str] = mapped_column(String, nullable=False)

    upload_token_hash: Mapped[str | None] = mapped_column(String, nullable=True)
    upload_token_used: Mapped[bool] = mapped_column(Boolean, default=False)

    jmx_path: Mapped[str | None] = mapped_column(String, nullable=True)
    jtl_path: Mapped[str | None] = mapped_column(String, nullable=True)
    log_path: Mapped[str | None] = mapped_column(String, nullable=True)
    report_path: Mapped[str | None] = mapped_column(String, nullable=True)

    exit_code: Mapped[str] = mapped_column(String, nullable=False, default="1")
    duration: Mapped[str] = mapped_column(String, nullable=False, default="0")
    error_rate: Mapped[str] = mapped_column(String, nullable=False, default="0")
    v_users: Mapped[str] = mapped_column(String, nullable=False, default="0")
    avg_response_time: Mapped[str] = mapped_column(String, nullable=False, default="0")
    throughput: Mapped[str] = mapped_column(String, nullable=False, default="0")
    run_status: Mapped[str] = mapped_column(String, nullable=False, default="failed")
    script_name: Mapped[str] = mapped_column(String, nullable=False, default="unknown.jmx")
