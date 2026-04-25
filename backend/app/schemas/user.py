from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    full_name: str
    username:  str
    password:  str
    role:      Optional[str] = "staff"

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v not in ("staff", "manager"):
            raise ValueError("role must be 'staff' or 'manager'")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("password must be at least 8 characters")
        return v


class UserStatusUpdate(BaseModel):
    is_active: bool


class UserResponse(BaseModel):
    user_id:    str
    full_name:  str
    username:   str
    role:       str
    is_active:  bool
    created_at: datetime

    model_config = {"from_attributes": True}
