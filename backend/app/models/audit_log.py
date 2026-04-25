from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id               = Column(Integer, primary_key=True, autoincrement=True)
    table_name       = Column(String, nullable=False, index=True)  # e.g. "transactions", "loans"
    record_id        = Column(String, nullable=False)              # ID of the row that changed
    action           = Column(String, nullable=False, index=True)  # "create" / "update" / "delete" / "login"
    performed_by     = Column(String, nullable=True)               # user_id of who did it
    performed_by_name= Column(String, nullable=True)               # full name for easy display
    ip_address       = Column(String, nullable=True)
    extra_info       = Column(Text, nullable=True)                 # stores JSON strings; migrate to JSONB after data cleanup
    performed_at     = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
