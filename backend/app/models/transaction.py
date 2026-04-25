from sqlalchemy import Column, String, Boolean, DateTime, Text, Numeric, Index
from sqlalchemy.sql import func
from app.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    transaction_id   = Column(String, primary_key=True, index=True)
    account_number   = Column(String, nullable=False, index=True)
    holder_name      = Column(String, nullable=False)
    transaction_type = Column(String, nullable=False)   # "deposit" / "withdrawal" / "transfer" / "loan_repayment"
    amount           = Column(Numeric(15, 2), nullable=False)
    note             = Column(Text, nullable=True)

    # Anomaly detection — Numeric(5,4) for precise fraud scores (not Float, which has IEEE 754 imprecision)
    anomaly_score     = Column(Numeric(5, 4), default=0.0, nullable=False)
    anomaly_reason    = Column(Text, nullable=True)
    anomaly_dismissed = Column(Boolean, default=False, nullable=False)

    # Soft delete — never actually remove rows (required for audit trail)
    is_deleted = Column(Boolean, default=False, nullable=False)

    created_at      = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    created_by      = Column(String, nullable=True)   # user_id of staff who created it
    created_by_name = Column(String, nullable=True)   # denormalized for display

    # Composite indexes for common query patterns (avoids full table scans)
    __table_args__ = (
        Index("ix_transactions_type_date", "transaction_type", "created_at"),
        Index("ix_transactions_account_date", "account_number", "created_at"),
    )
