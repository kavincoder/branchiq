from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import date, datetime


class InvestmentCreate(BaseModel):
    investment_id:   str
    account_number:  str
    holder_name:     str
    investment_type: str           # "govt_bond" / "mutual_fund" / "fixed_deposit"
    amount:          float
    interest_rate:   float
    status:          Optional[str] = "active"
    start_date:      date
    end_date:        date
    note:            Optional[str] = None

    @field_validator("investment_type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        if v not in ("govt_bond", "mutual_fund", "fixed_deposit"):
            raise ValueError("investment_type must be 'govt_bond', 'mutual_fund', or 'fixed_deposit'")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in ("active", "matured", "liquidated"):
            raise ValueError("status must be 'active', 'matured', or 'liquidated'")
        return v

    @field_validator("amount", "interest_rate")
    @classmethod
    def validate_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("value must be greater than 0")
        return v


class InvestmentUpdate(BaseModel):
    account_number:  Optional[str]  = None
    holder_name:     Optional[str]  = None
    investment_type: Optional[str]  = None
    amount:          Optional[float]= None
    interest_rate:   Optional[float]= None
    status:          Optional[str]  = None
    start_date:      Optional[date] = None
    end_date:        Optional[date] = None
    note:            Optional[str]  = None


class InvestmentResponse(BaseModel):
    investment_id:   str
    account_number:  str
    holder_name:     str
    investment_type: str
    amount:          float
    interest_rate:   float
    status:          str
    start_date:      date
    end_date:        date
    note:            Optional[str]
    is_deleted:      bool
    created_at:      datetime
    created_by:      Optional[str]

    model_config = {"from_attributes": True}
