from sqlalchemy import Column, String, Boolean, DateTime, Date, Text, Numeric
from sqlalchemy.sql import func
from app.database import Base


class Deposit(Base):
    __tablename__ = "deposits"

    deposit_id     = Column(String, primary_key=True, index=True)
    account_number = Column(String, nullable=False, index=True)
    holder_name    = Column(String, nullable=False)
    deposit_type   = Column(String, nullable=False)   # "fixed" or "savings"
    principal      = Column(Numeric(15, 2), nullable=False)
    interest_rate  = Column(Numeric(5, 2), nullable=False)     # as percentage e.g. 6.5
    status         = Column(String, nullable=False, default="active")  # active / matured / withdrawn
    start_date     = Column(Date, nullable=False)
    maturity_date  = Column(Date, nullable=True)      # only for fixed deposits
    note           = Column(Text, nullable=True)

    is_deleted = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_by = Column(String, nullable=True)
