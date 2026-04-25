from typing import ClassVar, Optional
from datetime import datetime
from pydantic import BaseModel, field_validator

VALID_TRANSACTION_TYPES: frozenset = frozenset({"deposit", "withdrawal", "transfer", "loan_repayment"})


class TransactionCreate(BaseModel):
    transaction_id:   str
    account_number:   str
    holder_name:      str
    transaction_type: str           # deposit | withdrawal | transfer | loan_repayment
    amount:           float
    note:             Optional[str] = None

    @field_validator("transaction_type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        if v not in VALID_TRANSACTION_TYPES:
            raise ValueError(f"transaction_type must be one of: {', '.join(sorted(VALID_TRANSACTION_TYPES))}")
        return v

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("amount must be greater than 0")
        return v


class TransactionUpdate(BaseModel):
    account_number:   Optional[str]   = None
    holder_name:      Optional[str]   = None
    transaction_type: Optional[str]   = None
    amount:           Optional[float] = None
    note:             Optional[str]   = None
    anomaly_dismissed:Optional[bool]  = None


class TransactionResponse(BaseModel):
    transaction_id:    str
    account_number:    str
    holder_name:       str
    transaction_type:  str
    amount:            float
    note:              Optional[str]
    anomaly_score:     float
    anomaly_reason:    Optional[str]
    anomaly_dismissed: bool
    is_deleted:        bool
    created_at:        datetime
    created_by:        Optional[str]
    created_by_name:   Optional[str] = None

    model_config = {"from_attributes": True}
