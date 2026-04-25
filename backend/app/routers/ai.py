import calendar
import logging
from datetime import datetime, date, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import func
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

from app.database import get_db
from app.models.transaction import Transaction
from app.models.audit_log import AuditLog
from app.models.loan import Loan
from app.models.investment import Investment
from app.utils.security import get_current_user
from app.utils.analytics import month_boundaries, month_sum, pct_change
from app.services.ai_engine import run_analysis, get_dormant_accounts
from app.services.audit import log_action

router = APIRouter()


@router.get("/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    now, this_start, last_start = month_boundaries()

    this_dep  = month_sum(db, this_start, now, "deposit")
    last_dep  = month_sum(db, last_start, this_start, "deposit")
    this_with = month_sum(db, this_start, now, "withdrawal")
    last_with = month_sum(db, last_start, this_start, "withdrawal")

    active_loans = db.query(Loan).filter(Loan.is_deleted == False, Loan.status == "active").all()
    new_loans = db.query(func.count(Loan.loan_id)).filter(
        Loan.is_deleted == False,
        Loan.created_at >= this_start,
    ).scalar() or 0

    total_inv = db.query(func.sum(Investment.amount)).filter(
        Investment.is_deleted == False,
        Investment.status == "active",
    ).scalar() or 0

    return {
        "total_deposits":     this_dep,
        "deposits_change":    pct_change(this_dep, last_dep),
        "total_withdrawals":  this_with,
        "withdrawals_change": pct_change(this_with, last_with),
        "active_loans":       len(active_loans),
        "loans_new":          new_loans,
        "total_loan_amount":  float(sum(float(l.principal_amount) for l in active_loans)),
        "total_investments":  float(total_inv),
    }


@router.post("/run")
def trigger_analysis(
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = run_analysis(db)

    log_action(
        db=db,
        table_name="ai_analysis",
        record_id=f"RUN-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
        action="create",
        performed_by=current_user.user_id,
        performed_by_name=current_user.full_name,
        ip_address=request.client.host if request.client else None,
        extra_info=str(result),
    )

    return result


@router.get("/anomalies")
def get_anomalies(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    anomalies = (
        db.query(Transaction)
        .filter(
            Transaction.is_deleted == False,
            Transaction.anomaly_score >= 0.6,
        )
        .order_by(Transaction.anomaly_score.desc())
        .all()
    )
    return anomalies


@router.post("/anomalies/{transaction_id}/dismiss")
def dismiss_anomaly(
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

    txn.anomaly_dismissed = True
    db.commit()

    return {"message": "Anomaly dismissed"}


@router.get("/history")
def get_analysis_history(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    runs = (
        db.query(AuditLog)
        .filter(AuditLog.table_name == "ai_analysis")
        .order_by(AuditLog.performed_at.desc())
        .limit(5)
        .all()
    )
    return [
        {
            "run_id":      f"RUN-{r.id:04d}",
            "run_at":      r.performed_at,
            "run_by_name": r.performed_by_name,
            "extra_info":  r.extra_info,
        }
        for r in runs
    ]


@router.get("/insights")
def get_insights(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    now, this_start, last_start = month_boundaries()

    this_deposits    = month_sum(db, this_start, now, "deposit")
    last_deposits    = month_sum(db, last_start, this_start, "deposit")
    this_withdrawals = month_sum(db, this_start, now, "withdrawal")
    last_withdrawals = month_sum(db, last_start, this_start, "withdrawal")

    total_anomalies = db.query(Transaction).filter(
        Transaction.is_deleted == False,
        Transaction.anomaly_score >= 0.6,
        Transaction.anomaly_dismissed == False,
    ).count()

    active_loans    = db.query(Loan).filter(Loan.is_deleted == False, Loan.status == "active").count()
    defaulted_loans = db.query(Loan).filter(Loan.is_deleted == False, Loan.status == "defaulted").count()

    dormant = get_dormant_accounts(db)

    last_run = (
        db.query(AuditLog)
        .filter(AuditLog.table_name == "ai_analysis")
        .order_by(AuditLog.performed_at.desc())
        .first()
    )

    return {
        "last_run":             last_run.performed_at if last_run else None,
        "transactions_scanned": db.query(Transaction).filter(Transaction.is_deleted == False).count(),
        "active_anomalies":     total_anomalies,
        "loan_performance": {
            "active_count":    active_loans,
            "defaulted_count": defaulted_loans,
        },
        "monthly_comparison": {
            "deposits":    {"this_month": this_deposits,    "change_pct": pct_change(this_deposits, last_deposits)},
            "withdrawals": {"this_month": this_withdrawals, "change_pct": pct_change(this_withdrawals, last_withdrawals)},
        },
        "dormant_accounts": dormant[:5],
    }


@router.get("/daily-snapshot")
def get_daily_snapshot(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Today's transaction stats + top 5 accounts by volume this month."""
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_end   = datetime.now(timezone.utc)

    dep_count, dep_sum = db.query(
        func.count(Transaction.transaction_id), func.sum(Transaction.amount)
    ).filter(
        Transaction.is_deleted == False,
        Transaction.transaction_type == "deposit",
        Transaction.created_at >= today_start,
        Transaction.created_at <= today_end,
    ).first()

    with_count, with_sum = db.query(
        func.count(Transaction.transaction_id), func.sum(Transaction.amount)
    ).filter(
        Transaction.is_deleted == False,
        Transaction.transaction_type == "withdrawal",
        Transaction.created_at >= today_start,
        Transaction.created_at <= today_end,
    ).first()

    total_today = db.query(func.count(Transaction.transaction_id)).filter(
        Transaction.is_deleted == False,
        Transaction.created_at >= today_start,
        Transaction.created_at <= today_end,
    ).scalar() or 0

    _, this_start, _ = month_boundaries()
    top_rows = (
        db.query(
            Transaction.account_number,
            Transaction.holder_name,
            func.sum(Transaction.amount).label("total_amount"),
            func.count(Transaction.transaction_id).label("txn_count"),
        )
        .filter(
            Transaction.is_deleted == False,
            Transaction.created_at >= this_start,
            Transaction.created_at <= today_end,
        )
        .group_by(Transaction.account_number, Transaction.holder_name)
        .order_by(func.sum(Transaction.amount).desc())
        .limit(5)
        .all()
    )

    return {
        "deposits_today":    {"count": dep_count or 0,  "amount": float(dep_sum or 0)},
        "withdrawals_today": {"count": with_count or 0, "amount": float(with_sum or 0)},
        "total_today":       total_today,
        "top_accounts": [
            {
                "account_number": r.account_number,
                "holder_name":    r.holder_name,
                "total_amount":   float(r.total_amount),
                "txn_count":      r.txn_count,
            }
            for r in top_rows
        ],
    }


@router.get("/monthly-trend")
def get_monthly_trend(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Returns last 6 months of deposits, withdrawals, and loan_repayments for the trend chart."""
    now = datetime.now(timezone.utc)
    result = []

    def _month_sum(txn_type: str, start: datetime, end: datetime) -> float:
        val = db.query(func.sum(Transaction.amount)).filter(
            Transaction.is_deleted == False,
            Transaction.transaction_type == txn_type,
            Transaction.created_at >= start,
            Transaction.created_at <= end,
        ).scalar()
        return float(val or 0)

    for i in range(5, -1, -1):
        year  = now.year
        month = now.month - i
        while month <= 0:
            month += 12
            year  -= 1
        _, last_day = calendar.monthrange(year, month)
        m_start = datetime(year, month, 1, tzinfo=timezone.utc)
        m_end   = now if i == 0 else datetime(year, month, last_day, 23, 59, 59, tzinfo=timezone.utc)

        result.append({
            "month":           m_start.strftime("%b %Y"),
            "deposits":        _month_sum("deposit",        m_start, m_end),
            "withdrawals":     _month_sum("withdrawal",     m_start, m_end),
            "loan_repayments": _month_sum("loan_repayment", m_start, m_end),
        })

    return result
