import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from db.base import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )

    username: Mapped[str] = mapped_column(
        String, unique=True, index=True, nullable=False
    )

    password_hash: Mapped[str] = mapped_column(
        String, nullable=False
    )

    role: Mapped[str] = mapped_column(
        String, nullable=False, default="user"
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )