"""
Tests for /loans/ CRUD endpoints.
Covers: list, create, duplicate ID, update, soft-delete, RBAC, status filter.
"""

LOAN_PAYLOAD = {
    "loan_id":          "LN-TEST-0001",
    "account_number":   "ACC-TEST-001",
    "holder_name":      "Test Borrower",
    "principal_amount": 100000,
    "interest_rate":    10.5,
    "risk_score":       35,
    "status":           "active",
    "start_date":       "2026-01-01",
    "end_date":         "2029-01-01",
    "note":             "Home renovation",
}


def test_list_loans_empty(client, staff_token):
    resp = client.get("/loans/", cookies={"branchiq_token": staff_token})
    assert resp.status_code == 200
    assert resp.json() == []


def test_create_loan(client, staff_token):
    resp = client.post("/loans/", json=LOAN_PAYLOAD, cookies={"branchiq_token": staff_token})
    assert resp.status_code == 201
    body = resp.json()
    assert body["loan_id"] == "LN-TEST-0001"
    assert float(body["principal_amount"]) == 100000.0
    assert body["status"] == "active"


def test_create_loan_duplicate_id(client, staff_token):
    client.post("/loans/", json=LOAN_PAYLOAD, cookies={"branchiq_token": staff_token})
    resp = client.post("/loans/", json=LOAN_PAYLOAD, cookies={"branchiq_token": staff_token})
    assert resp.status_code == 400


def test_get_loan_by_id(client, staff_token):
    client.post("/loans/", json=LOAN_PAYLOAD, cookies={"branchiq_token": staff_token})
    resp = client.get("/loans/LN-TEST-0001", cookies={"branchiq_token": staff_token})
    assert resp.status_code == 200
    assert resp.json()["loan_id"] == "LN-TEST-0001"


def test_update_loan_status(client, manager_token):
    client.post("/loans/", json=LOAN_PAYLOAD, cookies={"branchiq_token": manager_token})
    resp = client.put(
        "/loans/LN-TEST-0001",
        json={"status": "closed"},
        cookies={"branchiq_token": manager_token},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "closed"


def test_staff_cannot_delete_loan(client, staff_token):
    client.post("/loans/", json=LOAN_PAYLOAD, cookies={"branchiq_token": staff_token})
    resp = client.delete("/loans/LN-TEST-0001", cookies={"branchiq_token": staff_token})
    assert resp.status_code == 403


def test_soft_delete_loan(client, manager_token):
    client.post("/loans/", json=LOAN_PAYLOAD, cookies={"branchiq_token": manager_token})
    del_resp = client.delete("/loans/LN-TEST-0001", cookies={"branchiq_token": manager_token})
    assert del_resp.status_code == 200
    # Should not appear in list after soft delete
    list_resp = client.get("/loans/", cookies={"branchiq_token": manager_token})
    ids = [l["loan_id"] for l in list_resp.json()]
    assert "LN-TEST-0001" not in ids


def test_filter_loans_by_status(client, staff_token):
    client.post("/loans/", json=LOAN_PAYLOAD, cookies={"branchiq_token": staff_token})
    closed = {**LOAN_PAYLOAD, "loan_id": "LN-TEST-0002", "status": "closed"}
    client.post("/loans/", json=closed, cookies={"branchiq_token": staff_token})

    resp = client.get("/loans/?loan_status=active", cookies={"branchiq_token": staff_token})
    assert resp.status_code == 200
    assert all(l["status"] == "active" for l in resp.json())


def test_loan_not_found(client, staff_token):
    resp = client.get("/loans/LN-DOESNT-EXIST", cookies={"branchiq_token": staff_token})
    assert resp.status_code == 404
