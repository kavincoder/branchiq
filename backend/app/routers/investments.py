from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.investment import Investment
from app.schemas.investment import InvestmentCreate, InvestmentUpdate, InvestmentResponse
from app.utils.security import get_current_user, require_manager
from app.services.audit import log_action

router = APIRouter()


@router.get("/", response_model=list[InvestmentResponse])
def get_investments(
    search:            Optional[str] = None,
    investment_status: Optional[str] = None,
    investment_type:   Optional[str] = None,
    skip:              int = Query(0, ge=0),
    limit:             int = Query(100, ge=1, le=10000),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(Investment).filter(Investment.is_deleted == False)

    if investment_status:
        query = query.filter(Investment.status == investment_status)
    if investment_type:
        query = query.filter(Investment.investment_type == investment_type)
    if search:
        term = f"%{search.lower()}%"
        query = query.filter(
            Investment.holder_name.ilike(term) |
            Investment.account_number.ilike(term) |
            Investment.investment_id.ilike(term)
        )

    return query.order_by(Investment.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=InvestmentResponse, status_code=status.HTTP_201_CREATED)
def create_investment(
    payload: InvestmentCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    existing = db.query(Investment).filter(
        Investment.investment_id == payload.investment_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Investment ID already exists")

    investment = Investment(**payload.model_dump(), created_by=current_user.user_id)
    db.add(investment)
    db.commit()
    db.refresh(investment)

    log_action(
        db=db,
        table_name="investments",
        record_id=investment.investment_id,
        action="create",
        performed_by=current_user.user_id,
        performed_by_name=current_user.full_name,
        ip_address=request.client.host if request.client else None,
    )

    return investment


@router.get("/{investment_id}", response_model=InvestmentResponse)
def get_investment(
    investment_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    investment = db.query(Investment).filter(
        Investment.investment_id == investment_id,
        Investment.is_deleted == False,
    ).first()
    if not investment:
        raise HTTPException(status_code=404, detail="Investment not found")
    return investment


@router.put("/{investment_id}", response_model=InvestmentResponse)
def update_investment(
    investment_id: str,
    payload: InvestmentUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager),
):
    investment = db.query(Investment).filter(
        Investment.investment_id == investment_id,
        Investment.is_deleted == False,
    ).first()
    if not investment:
        raise HTTPException(status_code=404, detail="Investment not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(investment, field, value)

    db.commit()
    db.refresh(investment)

    log_action(
        db=db,
        table_name="investments",
        record_id=investment.investment_id,
        action="update",
        performed_by=current_user.user_id,
        performed_by_name=current_user.full_name,
        ip_address=request.client.host if request.client else None,
    )

    return investment


@router.delete("/{investment_id}", status_code=status.HTTP_200_OK)
def delete_investment(
    investment_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager),
):
    investment = db.query(Investment).filter(
        Investment.investment_id == investment_id,
        Investment.is_deleted == False,
    ).first()
    if not investment:
        raise HTTPException(status_code=404, detail="Investment not found")

    investment.is_deleted = True
    db.commit()

    log_action(
        db=db,
        table_name="investments",
        record_id=investment_id,
        action="delete",
        performed_by=current_user.user_id,
        performed_by_name=current_user.full_name,
        ip_address=request.client.host if request.client else None,
    )

    return {"message": "Investment deleted"}
