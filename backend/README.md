# BranchIQ Backend

FastAPI + PostgreSQL + scikit-learn backend for BranchIQ Banking Management System.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | FastAPI 0.111 |
| Database | PostgreSQL 16 via SQLAlchemy 2.0 |
| Auth | JWT (PyJWT) + bcrypt + httpOnly cookies |
| ML | IsolationForest (scikit-learn) with joblib model caching |
| Migrations | Alembic |
| Rate Limiting | slowapi |

---

## Quick Start

### 1. Prerequisites

- Python 3.12+
- PostgreSQL 16 running locally

### 2. Create and activate virtual environment

```bash
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment

```bash
cp .env.example .env
# Edit .env — set DATABASE_URL and SECRET_KEY
```

Generate a secure secret key:
```bash
openssl rand -hex 32
```

### 5. Run database migrations

```bash
alembic upgrade head
```

### 6. Seed the database

```bash
python3 seed.py
```

Default users after seeding:
| Username | Password | Role |
|----------|----------|------|
| arjun.manager | branchiq123 | manager |
| priya.staff | branchiq123 | staff |

### 7. Start the server

```bash
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs  
Health check: http://localhost:8000/health

---

## Running Tests

```bash
pytest tests/ -v
```

Tests use an in-memory SQLite database — they never touch your development data.

---

## Project Structure

```
app/
├── main.py           # FastAPI entry point, middleware, router registration
├── config.py         # Pydantic-settings config loader from .env
├── database.py       # SQLAlchemy engine, session factory
├── models/           # SQLAlchemy ORM models (User, Transaction, Loan, Deposit, Investment, AuditLog)
├── routers/          # Route handlers per domain (auth, transactions, loans, deposits, investments, ai, users)
├── schemas/          # Pydantic request/response models
├── services/
│   ├── ai_engine.py  # IsolationForest anomaly detection + dormant account detection
│   └── audit.py      # Audit log service (write-through, failure-isolated)
└── utils/
    ├── analytics.py  # Shared month_sum, pct_change utilities
    └── security.py   # JWT creation/validation, bcrypt, FastAPI dependencies
migrations/           # Alembic migration scripts
tests/                # pytest test suite
seed.py               # Database seeding script
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `SECRET_KEY` | ✅ | — | JWT signing secret (min 32 chars) |
| `ALGORITHM` | | HS256 | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | | 120 | Token lifetime (2 hours) |
| `CORS_ORIGINS` | | localhost:5173 | Comma-separated allowed origins |
| `DB_POOL_SIZE` | | 10 | SQLAlchemy connection pool size |
| `DB_MAX_OVERFLOW` | | 20 | Max overflow connections |
| `DB_POOL_TIMEOUT` | | 30 | Connection timeout (seconds) |

---

## Authentication

All endpoints except `POST /auth/login` require authentication.

The API sets an **httpOnly cookie** (`branchiq_token`) on login. This cookie is sent automatically with every subsequent request. The cookie cannot be read by JavaScript, eliminating XSS-based token theft.

Frontend must use `credentials: "include"` in all fetch calls.

For API clients (Postman, scripts), Bearer token in `Authorization` header is also accepted as a fallback.

---

## Docker

```bash
# From the project root
docker-compose up --build
```

This starts PostgreSQL, runs migrations, and starts the backend on port 8000.
