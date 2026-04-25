import sys
from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120   # 2 hours
    CORS_ORIGINS: str = "http://localhost:5173"
    ENVIRONMENT: str = "development"          # "development" | "production"

    # Database pool tuning — configurable per environment
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_TIMEOUT: int = 30

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"

    @field_validator("DATABASE_URL")
    @classmethod
    def validate_db_url(cls, v: str) -> str:
        if not v or v == "postgresql://postgres:yourpassword@localhost:5432/branchiq":
            print("\n❌  DATABASE_URL is not set. Update it in backend/.env\n")
            sys.exit(1)
        return v

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        if not v or "change-this" in v:
            print("\n❌  SECRET_KEY is not set. Add a real secret key in backend/.env\n")
            sys.exit(1)
        if len(v) < 32:
            print("\n❌  SECRET_KEY must be at least 32 characters long.\n")
            sys.exit(1)
        return v

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    class Config:
        env_file = ".env"


settings = Settings()
print(f"✅  BranchIQ config loaded — CORS: {settings.CORS_ORIGINS}")
