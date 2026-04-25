from sqlalchemy import Column, String, Boolean, DateTime, Integer
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    user_id         = Column(String, primary_key=True, index=True)
    full_name       = Column(String, nullable=False)
    username        = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    role            = Column(String, nullable=False, default="staff")  # "staff" or "manager"
    is_active       = Column(Boolean, default=True, nullable=False)
    created_at      = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Security tracking — added for production hardening
    last_login          = Column(DateTime(timezone=True), nullable=True)
    failed_login_count  = Column(Integer, default=0, nullable=False)
