"""
Tests for /deposits/ CRUD endpoints.
Covers: list, create, duplicate ID, update, soft-delete, RBAC, type filter.
"""

DEPOSIT_PAYLOAD = {
    "deposit_id":     "DEP-TEST-0001",
    "account_number": "ACC-TEST-001",
    "holder_name":    "Test Depositor",
    "deposit_type":   "fixed",
    "principal":      200000,
    "interest_rate":  7.0,
    "status":         "active",
    "start_date":     "2026-01-01",
    "maturity_date":  "2027-01-01",
}


def test_list_deposits_empty(client, staff_token):
    resp = client.get("/deposits/", cookies={"branchiq_token": staff_token})
    assert resp.status_code == 200
    assert resp.json() == []


def test_create_deposit(client, staff_token):
    resp = client.post("/deposits/", json=DEPOSIT_PAYLOAD, cookies={"branchiq_token": staff_token})
    assert resp.status_code == 201
    body = resp.json()
    assert body["deposit_id"] == "DEP-TEST-0001"
    assert body["deposit_type"] == "fixed"
    assert float(body["principal"]) == 200000.0


def test_create_deposit_duplicate_id(client, staff_token):
    client.post("/deposits/", json=DEPOSIT_PAYLOAD, cookies={"branchiq_token": staff_token})
    resp = client.post("/deposits/", json=DEPOSIT_PAYLOAD, cookies={"branchiq_token": staff_token})
    assert resp.status_code == 400


def test_get_deposit_by_id(client, staff_token):
    client.post("/deposits/", json=DEPOSIT_PAYLOAD, cookies={"branchiq_token": staff_token})
    resp = client.get("/deposits/DEP-TEST-0001", cookies={"branchiq_token": staff_token})
    assert resp.status_code == 200
    assert resp.json()["deposit_id"] == "DEP-TEST-0001"


def test_update_deposit_status(client, manager_token):
    client.post("/deposits/", json=DEPOSIT_PAYLOAD, cookies={"branchiq_token": manager_token})
    resp = client.put(
        "/deposits/DEP-TEST-0001",
        json={"status": "matured"},
        cookies={"branchiq_token": manager_token},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "matured"


def test_staff_cannot_delete_deposit(client, staff_token):
    client.post("/deposits/", json=DEPOSIT_PAYLOAD, cookies={"branchiq_token": staff_token})
    resp = client.delete("/deposits/DEP-TEST-0001", cookies={"branchiq_token": staff_token})
    assert resp.status_code == 403


def test_soft_delete_deposit(client, manager_token):
    client.post("/deposits/", json=DEPOSIT_PAYLOAD, cookies={"branchiq_token": manager_token})
    del_resp = client.delete("/deposits/DEP-TEST-0001", cookies={"branchiq_token": manager_token})
    assert del_resp.status_code == 200
    list_resp = client.get("/deposits/", cookies={"branchiq_token": manager_token})
    ids = [d["deposit_id"] for d in list_resp.json()]
    assert "DEP-TEST-0001" not in ids


def test_filter_deposits_by_type(client, staff_token):
    client.post("/deposits/", json=DEPOSIT_PAYLOAD, cookies={"branchiq_token": staff_token})
    savings = {**DEPOSIT_PAYLOAD, "deposit_id": "DEP-TEST-0002", "deposit_type": "savings", "maturity_date": None}
    client.post("/deposits/", json=savings, cookies={"branchiq_token": staff_token})

    resp = client.get("/deposits/?deposit_type=fixed", cookies={"branchiq_token": staff_token})
    assert resp.status_code == 200
    assert all(d["deposit_type"] == "fixed" for d in resp.json())


def test_deposit_not_found(client, staff_token):
    resp = client.get("/deposits/DEP-DOESNT-EXIST", cookies={"branchiq_token": staff_token})
    assert resp.status_code == 404
