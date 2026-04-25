from sqlalchemy import Column, String, Boolean, DateTime, Date, Text, Numeric
from sqlalchemy.sql import func
from app.database import Base


class Loan(Base):
    __tablename__ = "loans"

    loan_id          = Column(String, primary_key=True, index=True)
    account_number   = Column(String, nullable=False, index=True)
    holder_name      = Column(String, nullable=False)
    principal_amount = Column(Numeric(15, 2), nullable=False)
    interest_rate    = Column(Numeric(5, 2), nullable=False)    # as percentage e.g. 10.5
    risk_score       = Column(Numeric(5, 2), default=0.0, nullable=False)   # 0–100
    status           = Column(String, nullable=False, default="active")  # active / closed / defaulted
    start_date       = Column(Date, nullable=False)
    end_date         = Column(Date, nullable=False)
    note             = Column(Text, nullable=True)

    is_deleted = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_by = Column(String, nullable=True)
