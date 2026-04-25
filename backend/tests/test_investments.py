"""
Tests for /investments/ CRUD endpoints.
Covers: list, create, duplicate ID, update, soft-delete, RBAC, type filter.
"""

INVESTMENT_PAYLOAD = {
    "investment_id":   "INV-TEST-0001",
    "account_number":  "ACC-TEST-001",
    "holder_name":     "Test Investor",
    "investment_type": "govt_bond",
    "amount":          300000,
    "interest_rate":   6.5,
    "status":          "active",
    "start_date":      "2026-01-01",
    "end_date":        "2031-01-01",
}


def test_list_investments_empty(client, staff_token):
    resp = client.get("/investments/", cookies={"branchiq_token": staff_token})
    assert resp.status_code == 200
    assert resp.json() == []


def test_create_investment(client, staff_token):
    resp = client.post("/investments/", json=INVESTMENT_PAYLOAD, cookies={"branchiq_token": staff_token})
    assert resp.status_code == 201
    body = resp.json()
    assert body["investment_id"] == "INV-TEST-0001"
    assert body["investment_type"] == "govt_bond"
    assert float(body["amount"]) == 300000.0


def test_create_investment_duplicate_id(client, staff_token):
    client.post("/investments/", json=INVESTMENT_PAYLOAD, cookies={"branchiq_token": staff_token})
    resp = client.post("/investments/", json=INVESTMENT_PAYLOAD, cookies={"branchiq_token": staff_token})
    assert resp.status_code == 400


def test_get_investment_by_id(client, staff_token):
    client.post("/investments/", json=INVESTMENT_PAYLOAD, cookies={"branchiq_token": staff_token})
    resp = client.get("/investments/INV-TEST-0001", cookies={"branchiq_token": staff_token})
    assert resp.status_code == 200
    assert resp.json()["investment_id"] == "INV-TEST-0001"


def test_update_investment_status(client, manager_token):
    client.post("/investments/", json=INVESTMENT_PAYLOAD, cookies={"branchiq_token": manager_token})
    resp = client.put(
        "/investments/INV-TEST-0001",
        json={"status": "matured"},
        cookies={"branchiq_token": manager_token},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "matured"


def test_staff_cannot_delete_investment(client, staff_token):
    client.post("/investments/", json=INVESTMENT_PAYLOAD, cookies={"branchiq_token": staff_token})
    resp = client.delete("/investments/INV-TEST-0001", cookies={"branchiq_token": staff_token})
    assert resp.status_code == 403


def test_soft_delete_investment(client, manager_token):
    client.post("/investments/", json=INVESTMENT_PAYLOAD, cookies={"branchiq_token": manager_token})
    del_resp = client.delete("/investments/INV-TEST-0001", cookies={"branchiq_token": manager_token})
    assert del_resp.status_code == 200
    list_resp = client.get("/investments/", cookies={"branchiq_token": manager_token})
    ids = [i["investment_id"] for i in list_resp.json()]
    assert "INV-TEST-0001" not in ids


def test_filter_investments_by_type(client, staff_token):
    client.post("/investments/", json=INVESTMENT_PAYLOAD, cookies={"branchiq_token": staff_token})
    mf = {**INVESTMENT_PAYLOAD, "investment_id": "INV-TEST-0002", "investment_type": "mutual_fund"}
    client.post("/investments/", json=mf, cookies={"branchiq_token": staff_token})

    resp = client.get("/investments/?investment_type=govt_bond", cookies={"branchiq_token": staff_token})
    assert resp.status_code == 200
    assert all(i["investment_type"] == "govt_bond" for i in resp.json())


def test_investment_not_found(client, staff_token):
    resp = client.get("/investments/INV-DOESNT-EXIST", cookies={"branchiq_token": staff_token})
    assert resp.status_code == 404
