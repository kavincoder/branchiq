from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import date, datetime


class LoanCreate(BaseModel):
    loan_id:          str
    account_number:   str
    holder_name:      str
    principal_amount: float
    interest_rate:    float
    risk_score:       Optional[float] = 0.0
    status:           Optional[str]   = "active"
    start_date:       date
    end_date:         date
    note:             Optional[str]   = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in ("active", "closed", "defaulted"):
            raise ValueError("status must be 'active', 'closed', or 'defaulted'")
        return v

    @field_validator("principal_amount", "interest_rate")
    @classmethod
    def validate_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("value must be greater than 0")
        return v


class LoanUpdate(BaseModel):
    account_number:   Optional[str]   = None
    holder_name:      Optional[str]   = None
    principal_amount: Optional[float] = None
    interest_rate:    Optional[float] = None
    risk_score:       Optional[float] = None
    status:           Optional[str]   = None
    start_date:       Optional[date]  = None
    end_date:         Optional[date]  = None
    note:             Optional[str]   = None


class LoanResponse(BaseModel):
    loan_id:          str
    account_number:   str
    holder_name:      str
    principal_amount: float
    interest_rate:    float
    risk_score:       float
    status:           str
    start_date:       date
    end_date:         date
    note:             Optional[str]
    is_deleted:       bool
    created_at:       datetime
    created_by:       Optional[str]

    model_config = {"from_attributes": True}
