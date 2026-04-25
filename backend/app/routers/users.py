import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.audit_log import AuditLog
from app.schemas.user import UserCreate, UserStatusUpdate, UserResponse
from app.utils.security import hash_password, require_manager
from app.services.audit import log_action

router = APIRouter()


def _generate_user_id() -> str:
    return f"USR-{uuid.uuid4().hex[:12].upper()}"


@router.get("/", response_model=list[UserResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user=Depends(require_manager),
):
    return db.query(User).order_by(User.created_at.asc()).all()


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager),
):
    existing = db.query(User).filter(User.username == payload.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    new_user = User(
        user_id=        _generate_user_id(),
        full_name=      payload.full_name,
        username=       payload.username,
        hashed_password=hash_password(payload.password),
        role=           payload.role,
        is_active=      True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_action(
        db=db,
        table_name="users",
        record_id=new_user.user_id,
        action="create",
        performed_by=current_user.user_id,
        performed_by_name=current_user.full_name,
        ip_address=request.client.host if request.client else None,
    )

    return new_user


@router.put("/{user_id}/status", response_model=UserResponse)
def update_user_status(
    user_id: str,
    payload: UserStatusUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager),
):
    if user_id == current_user.user_id:
        raise HTTPException(status_code=400, detail="You cannot change your own status")

    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = payload.is_active
    db.commit()
    db.refresh(user)

    action_label = "activate" if payload.is_active else "deactivate"
    log_action(
        db=db,
        table_name="users",
        record_id=user_id,
        action=action_label,
        performed_by=current_user.user_id,
        performed_by_name=current_user.full_name,
        ip_address=request.client.host if request.client else None,
    )

    return user


@router.get("/audit-logs")
def get_audit_logs(
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager),
):
    """Paginated audit log — default 200 rows, max 1000. Use skip/limit for pagination."""
    limit = min(limit, 1000)   # hard cap to prevent accidental full-table fetches
    logs = (
        db.query(AuditLog)
        .order_by(AuditLog.performed_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [
        {
            "id":                log.id,
            "table_name":        log.table_name,
            "record_id":         log.record_id,
            "action":            log.action,
            "performed_by":      log.performed_by,
            "performed_by_name": log.performed_by_name,
            "ip_address":        log.ip_address,
            "extra_info":        log.extra_info,
            "performed_at":      log.performed_at,
        }
        for log in logs
    ]
