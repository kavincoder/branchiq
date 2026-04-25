"""
Test configuration and shared fixtures.
Uses a separate in-memory SQLite database so tests never touch production data.
"""
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models.user import User
from app.utils.security import hash_password

# ── In-memory SQLite for tests ────────────────────────────────────────────────
TEST_DB_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


def _mock_rate_limit_check(request, *args, **kwargs):
    """Set the view_rate_limit state attribute that slowapi expects, but don't actually rate-limit."""
    request.state.view_rate_limit = ("999/minute", 999)


@pytest.fixture(autouse=True)
def disable_rate_limits():
    """Disable slowapi rate limiting for all tests."""
    with patch("slowapi.extension.Limiter._check_request_limit", side_effect=_mock_rate_limit_check):
        yield


@pytest.fixture(scope="function")
def client(disable_rate_limits):
    """Create a fresh database and test client for each test function."""
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db

    # Seed test users
    db = TestingSession()
    db.add(User(
        user_id="USR-TEST-0001",
        full_name="Test Manager",
        username="test.manager",
        hashed_password=hash_password("testpass123"),
        role="manager",
        is_active=True,
        failed_login_count=0,
    ))
    db.add(User(
        user_id="USR-TEST-0002",
        full_name="Test Staff",
        username="test.staff",
        hashed_password=hash_password("testpass123"),
        role="staff",
        is_active=True,
        failed_login_count=0,
    ))
    db.add(User(
        user_id="USR-TEST-0003",
        full_name="Inactive User",
        username="inactive.user",
        hashed_password=hash_password("testpass123"),
        role="staff",
        is_active=False,
        failed_login_count=0,
    ))
    db.commit()
    db.close()

    with TestClient(app) as c:
        yield c

    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()


@pytest.fixture
def manager_token(client):
    """Log in as manager and return auth cookie."""
    resp = client.post("/auth/login", json={"username": "test.manager", "password": "testpass123"})
    assert resp.status_code == 200, f"Login failed: {resp.json()}"
    return resp.cookies.get("branchiq_token")


@pytest.fixture
def staff_token(client):
    """Log in as staff and return auth cookie."""
    resp = client.post("/auth/login", json={"username": "test.staff", "password": "testpass123"})
    assert resp.status_code == 200, f"Login failed: {resp.json()}"
    return resp.cookies.get("branchiq_token")
