from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.deposit import Deposit
from app.models.user import User
from app.schemas.deposit import DepositCreate, DepositUpdate, DepositResponse
from app.utils.security import get_current_user, require_manager
from app.services.audit import log_action


def _enrich(deposits, db: Session):
    ids = {d.created_by for d in deposits if d.created_by}
    names = {}
    if ids:
        names = {u.user_id: u.full_name for u in db.query(User).filter(User.user_id.in_(list(ids))).all()}
    result = []
    for d in deposits:
        row = {c.name: getattr(d, c.name) for c in d.__table__.columns}
        row["created_by_name"] = names.get(d.created_by, d.created_by or "Staff")
        result.append(row)
    return result

router = APIRouter()


@router.get("/", response_model=list[DepositResponse])
def get_deposits(
    search:         Optional[str] = None,
    deposit_status: Optional[str] = None,
    deposit_type:   Optional[str] = None,
    skip:           int = Query(0, ge=0),
    limit:          int = Query(100, ge=1, le=10000),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(Deposit).filter(Deposit.is_deleted == False)

    if deposit_status:
        query = query.filter(Deposit.status == deposit_status)
    if deposit_type:
        query = query.filter(Deposit.deposit_type == deposit_type)
    if search:
        term = f"%{search.lower()}%"
        query = query.filter(
            Deposit.holder_name.ilike(term) |
            Deposit.account_number.ilike(term) |
            Deposit.deposit_id.ilike(term)
        )

    deps = query.order_by(Deposit.created_at.desc()).offset(skip).limit(limit).all()
    return _enrich(deps, db)


@router.post("/", response_model=DepositResponse, status_code=status.HTTP_201_CREATED)
def create_deposit(
    payload: DepositCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    existing = db.query(Deposit).filter(Deposit.deposit_id == payload.deposit_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Deposit ID already exists")

    deposit = Deposit(**payload.model_dump(), created_by=current_user.user_id)
    db.add(deposit)
    db.commit()
    db.refresh(deposit)

    log_action(
        db=db,
        table_name="deposits",
        record_id=deposit.deposit_id,
        action="create",
        performed_by=current_user.user_id,
        performed_by_name=current_user.full_name,
        ip_address=request.client.host if request.client else None,
    )

    return deposit


@router.get("/{deposit_id}", response_model=DepositResponse)
def get_deposit(
    deposit_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    deposit = db.query(Deposit).filter(
        Deposit.deposit_id == deposit_id,
        Deposit.is_deleted == False,
    ).first()
    if not deposit:
        raise HTTPException(status_code=404, detail="Deposit not found")
    return _enrich([deposit], db)[0]


@router.put("/{deposit_id}", response_model=DepositResponse)
def update_deposit(
    deposit_id: str,
    payload: DepositUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager),
):
    deposit = db.query(Deposit).filter(
        Deposit.deposit_id == deposit_id,
        Deposit.is_deleted == False,
    ).first()
    if not deposit:
        raise HTTPException(status_code=404, detail="Deposit not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(deposit, field, value)

    db.commit()
    db.refresh(deposit)

    log_action(
        db=db,
        table_name="deposits",
        record_id=deposit.deposit_id,
        action="update",
        performed_by=current_user.user_id,
        performed_by_name=current_user.full_name,
        ip_address=request.client.host if request.client else None,
    )

    return deposit


@router.delete("/{deposit_id}", status_code=status.HTTP_200_OK)
def delete_deposit(
    deposit_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager),
):
    deposit = db.query(Deposit).filter(
        Deposit.deposit_id == deposit_id,
        Deposit.is_deleted == False,
    ).first()
    if not deposit:
        raise HTTPException(status_code=404, detail="Deposit not found")

    deposit.is_deleted = True
    db.commit()

    log_action(
        db=db,
        table_name="deposits",
        record_id=deposit_id,
        action="delete",
        performed_by=current_user.user_id,
        performed_by_name=current_user.full_name,
        ip_address=request.client.host if request.client else None,
    )

    return {"message": "Deposit deleted"}
