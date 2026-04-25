from datetime import datetime, timezone, timedelta
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.transaction import Transaction


def month_boundaries(now: datetime = None):
    if now is None:
        now = datetime.now(timezone.utc)
    this_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_start = (this_start - timedelta(days=1)).replace(day=1)
    return now, this_start, last_start


def month_sum(db: Session, start, end, txn_type: str) -> float:
    result = db.query(func.sum(Transaction.amount)).filter(
        Transaction.is_deleted == False,
        Transaction.transaction_type == txn_type,
        Transaction.created_at >= start,
        Transaction.created_at < end,
    ).scalar()
    return float(result or 0)


def pct_change(this: float, last: float) -> float:
    if last == 0:
        return 0.0
    return round(((this - last) / last) * 100, 1)
