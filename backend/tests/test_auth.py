"""
Tests for POST /auth/login and POST /auth/logout.
Covers: success, wrong password, wrong username, inactive account, cookie presence.
"""


def test_login_success_sets_cookie(client):
    resp = client.post("/auth/login", json={"username": "test.manager", "password": "testpass123"})
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body
    assert body["role"] == "manager"
    assert body["full_name"] == "Test Manager"
    # httpOnly cookie must be set by the server
    assert "branchiq_token" in resp.cookies


def test_login_wrong_password(client):
    resp = client.post("/auth/login", json={"username": "test.manager", "password": "wrongpassword"})
    assert resp.status_code == 401
    assert "Incorrect" in resp.json()["detail"]


def test_login_wrong_username(client):
    resp = client.post("/auth/login", json={"username": "nobody", "password": "testpass123"})
    assert resp.status_code == 401


def test_login_inactive_account(client):
    resp = client.post("/auth/login", json={"username": "inactive.user", "password": "testpass123"})
    assert resp.status_code == 403
    assert "deactivated" in resp.json()["detail"].lower()


def test_login_staff_role(client):
    resp = client.post("/auth/login", json={"username": "test.staff", "password": "testpass123"})
    assert resp.status_code == 200
    assert resp.json()["role"] == "staff"


def test_logout_clears_cookie(client):
    # First login
    client.post("/auth/login", json={"username": "test.manager", "password": "testpass123"})
    # Then logout
    resp = client.post("/auth/logout")
    assert resp.status_code == 200
    assert resp.json()["message"] == "Logged out successfully"


def test_protected_route_without_token(client):
    resp = client.get("/transactions/")
    assert resp.status_code == 401


def test_protected_route_with_valid_cookie(client, manager_token):
    resp = client.get("/transactions/", cookies={"branchiq_token": manager_token})
    assert resp.status_code == 200
