from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import date, datetime


class DepositCreate(BaseModel):
    deposit_id:    str
    account_number:str
    holder_name:   str
    deposit_type:  str           # "fixed" or "savings"
    principal:     float
    interest_rate: float
    status:        Optional[str]  = "active"
    start_date:    date
    maturity_date: Optional[date] = None
    note:          Optional[str]  = None

    @field_validator("deposit_type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        if v not in ("fixed", "savings"):
            raise ValueError("deposit_type must be 'fixed' or 'savings'")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in ("active", "matured", "withdrawn"):
            raise ValueError("status must be 'active', 'matured', or 'withdrawn'")
        return v

    @field_validator("principal", "interest_rate")
    @classmethod
    def validate_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("value must be greater than 0")
        return v


class DepositUpdate(BaseModel):
    account_number: Optional[str]  = None
    holder_name:    Optional[str]  = None
    deposit_type:   Optional[str]  = None
    principal:      Optional[float]= None
    interest_rate:  Optional[float]= None
    status:         Optional[str]  = None
    start_date:     Optional[date] = None
    maturity_date:  Optional[date] = None
    note:           Optional[str]  = None


class DepositResponse(BaseModel):
    deposit_id:    str
    account_number:str
    holder_name:   str
    deposit_type:  str
    principal:     float
    interest_rate: float
    status:        str
    start_date:    date
    maturity_date: Optional[date]
    note:          Optional[str]
    is_deleted:    bool
    created_at:    datetime
    created_by:    Optional[str]
    created_by_name: Optional[str] = None

    model_config = {"from_attributes": True}
