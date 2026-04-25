import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionUpdate, TransactionResponse
from app.utils.security import get_current_user, require_manager
from app.services.audit import log_action

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_model=list[TransactionResponse])
def get_transactions(
    search:       Optional[str]  = None,
    txn_type:     Optional[str]  = None,
    anomaly_only: Optional[bool] = False,
    skip:         int = Query(0, ge=0),
    limit:        int = Query(100, ge=1, le=10000),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(Transaction).filter(Transaction.is_deleted == False)

    if txn_type:
        query = query.filter(Transaction.transaction_type == txn_type)
    if anomaly_only:
        query = query.filter(Transaction.anomaly_score >= 0.6)
    if search:
        term = f"%{search.lower()}%"
        query = query.filter(
            Transaction.holder_name.ilike(term) |
            Transaction.account_number.ilike(term) |
            Transaction.transaction_id.ilike(term)
        )

    return query.order_by(Transaction.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    payload: TransactionCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    existing = db.query(Transaction).filter(
        Transaction.transaction_id == payload.transaction_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Transaction ID already exists")

    txn = Transaction(**payload.model_dump(), created_by=current_user.user_id)
    db.add(txn)
    db.commit()
    db.refresh(txn)

    log_action(
        db=db,
        table_name="transactions",
        record_id=txn.transaction_id,
        action="create",
        performed_by=current_user.user_id,
        performed_by_name=current_user.full_name,
        ip_address=request.client.host if request.client else None,
    )

    return txn


@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    txn = db.query(Transaction).filter(
        Transaction.transaction_id == transaction_id,
        Transaction.is_deleted == False,
    ).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return txn


@router.put("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(
    transaction_id: str,
    payload: TransactionUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager),
):
    txn = db.query(Transaction).filter(
        Transaction.transaction_id == transaction_id,
        Transaction.is_deleted == False,
    ).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(txn, field, value)

    db.commit()
    db.refresh(txn)

    log_action(
        db=db,
        table_name="transactions",
        record_id=txn.transaction_id,
        action="update",
        performed_by=current_user.user_id,
        performed_by_name=current_user.full_name,
        ip_address=request.client.host if request.client else None,
    )

    return txn


@router.delete("/{transaction_id}", status_code=status.HTTP_200_OK)
def delete_transaction(
    transaction_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager),
):
    txn = db.query(Transaction).filter(
        Transaction.transaction_id == transaction_id,
        Transaction.is_deleted == False,
    ).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    txn.is_deleted = True
    db.commit()

    log_action(
        db=db,
        table_name="transactions",
        record_id=transaction_id,
        action="delete",
        performed_by=current_user.user_id,
        performed_by_name=current_user.full_name,
        ip_address=request.client.host if request.client else None,
    )

    return {"message": "Transaction deleted"}
