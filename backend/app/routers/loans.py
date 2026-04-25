from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.loan import Loan
from app.schemas.loan import LoanCreate, LoanUpdate, LoanResponse
from app.utils.security import get_current_user, require_manager
from app.services.audit import log_action

router = APIRouter()


@router.get("/overdue-count")
def get_overdue_count(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Returns count of active loans whose end_date has passed."""
    today = date.today()
    count = db.query(Loan).filter(
        Loan.is_deleted == False,
        Loan.status == "active",
        Loan.end_date < today,
    ).count()
    return {"count": count}


@router.get("/", response_model=list[LoanResponse])
def get_loans(
    search:      Optional[str] = None,
    loan_status: Optional[str] = None,
    skip:        int = Query(0, ge=0),
    limit:       int = Query(100, ge=1, le=10000),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(Loan).filter(Loan.is_deleted == False)

    if loan_status:
        query = query.filter(Loan.status == loan_status)
    if search:
        term = f"%{search.lower()}%"
        query = query.filter(
            Loan.holder_name.ilike(term) |
            Loan.account_number.ilike(term) |
            Loan.loan_id.ilike(term)
        )

    return query.order_by(Loan.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=LoanResponse, status_code=status.HTTP_201_CREATED)
def create_loan(
    payload: LoanCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    existing = db.query(Loan).filter(Loan.loan_id == payload.loan_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Loan ID already exists")

    loan = Loan(**payload.model_dump(), created_by=current_user.user_id)
    db.add(loan)
    db.commit()
    db.refresh(loan)

    log_action(
        db=db,
        table_name="loans",
        record_id=loan.loan_id,
        action="create",
        performed_by=current_user.user_id,
        performed_by_name=current_user.full_name,
        ip_address=request.client.host if request.client else None,
    )

    return loan


@router.get("/{loan_id}", response_model=LoanResponse)
def get_loan(
    loan_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    loan = db.query(Loan).filter(
        Loan.loan_id == loan_id,
        Loan.is_deleted == False,
    ).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    return loan


@router.put("/{loan_id}", response_model=LoanResponse)
def update_loan(
    loan_id: str,
    payload: LoanUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager),
):
    loan = db.query(Loan).filter(
        Loan.loan_id == loan_id,
        Loan.is_deleted == False,
    ).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(loan, field, value)

    db.commit()
    db.refresh(loan)

    log_action(
        db=db,
        table_name="loans",
        record_id=loan.loan_id,
        action="update",
        performed_by=current_user.user_id,
        performed_by_name=current_user.full_name,
        ip_address=request.client.host if request.client else None,
    )

    return loan


@router.delete("/{loan_id}", status_code=status.HTTP_200_OK)
def delete_loan(
    loan_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager),
):
    loan = db.query(Loan).filter(
        Loan.loan_id == loan_id,
        Loan.is_deleted == False,
    ).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")

    loan.is_deleted = True
    db.commit()

    log_action(
        db=db,
        table_name="loans",
        record_id=loan_id,
        action="delete",
        performed_by=current_user.user_id,
        performed_by_name=current_user.full_name,
        ip_address=request.client.host if request.client else None,
    )

    return {"message": "Loan deleted"}
