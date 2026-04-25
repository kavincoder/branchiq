import logging
from typing import Optional
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog

logger = logging.getLogger(__name__)


def log_action(
    db: Session,
    table_name: str,
    record_id: str,
    action: str,
    performed_by: Optional[str] = None,
    performed_by_name: Optional[str] = None,
    ip_address: Optional[str] = None,
    extra_info: Optional[str] = None,
) -> None:
    try:
        entry = AuditLog(
            table_name=table_name,
            record_id=record_id,
            action=action,
            performed_by=performed_by,
            performed_by_name=performed_by_name,
            ip_address=ip_address,
            extra_info=extra_info,
        )
        db.add(entry)
        db.commit()
    except Exception as e:
        db.rollback()
        # Never crash the main operation because of a failed audit log
        logger.error("audit log failed: %s | table=%s record=%s action=%s", e, table_name, record_id, action)
