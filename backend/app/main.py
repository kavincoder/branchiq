import logging
import logging.config

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.config import settings
from app.routers import auth, transactions, loans, deposits, investments, ai, users

# ── Structured logging setup ──────────────────────────────────────────────────
LOG_FORMAT = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
logging.basicConfig(
    level=logging.INFO,
    format=LOG_FORMAT,
    handlers=[logging.StreamHandler()],
)
# Suppress noisy third-party loggers
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
logger = logging.getLogger("branchiq")

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="BranchIQ API",
    description="AI-Powered Banking Management System",
    version="1.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request body size limit (10 MB) — prevents oversized payload attacks ──────
@app.middleware("http")
async def limit_body_size(request: Request, call_next):
    MAX_BODY = 10 * 1024 * 1024  # 10 MB
    if request.headers.get("content-length"):
        if int(request.headers["content-length"]) > MAX_BODY:
            return JSONResponse(status_code=413, content={"detail": "Request body too large (max 10 MB)"})
    return await call_next(request)

app.include_router(auth.router,         prefix="/auth",         tags=["Auth"])
app.include_router(transactions.router, prefix="/transactions", tags=["Transactions"])
app.include_router(loans.router,        prefix="/loans",        tags=["Loans"])
app.include_router(deposits.router,     prefix="/deposits",     tags=["Deposits"])
app.include_router(investments.router,  prefix="/investments",  tags=["Investments"])
app.include_router(ai.router,           prefix="/ai",           tags=["AI"])
app.include_router(users.router,        prefix="/users",        tags=["Users"])


@app.get("/")
def root():
    return {"status": "BranchIQ backend running", "version": "1.0.0"}


@app.get("/health", tags=["Health"])
def health_check():
    """Load balancer health probe — returns 200 OK when the service is up."""
    return {"status": "healthy", "version": "1.0.0", "environment": settings.ENVIRONMENT}
