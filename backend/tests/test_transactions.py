"""
Tests for /transactions/ CRUD endpoints.
Covers: list, create, update, soft-delete, RBAC.
"""


def _headers(token):
    return {"Authorization": f"Bearer {token}"}


def test_list_transactions_empty(client, staff_token):
    resp = client.get("/transactions/", cookies={"branchiq_token": staff_token})
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
    assert len(resp.json()) == 0


def test_create_transaction(client, staff_token):
    payload = {
        "transaction_id":   "TXN-TEST-0001",
        "account_number":   "ACC-TEST-0001",
        "holder_name":      "Test Holder",
        "transaction_type": "deposit",
        "amount":           50000,
        "note":             "Test deposit",
    }
    resp = client.post("/transactions/", json=payload, cookies={"branchiq_token": staff_token})
    assert resp.status_code == 201
    body = resp.json()
    assert body["transaction_id"] == "TXN-TEST-0001"
    assert body["transaction_type"] == "deposit"
    assert float(body["amount"]) == 50000.0


def test_create_transaction_duplicate_id(client, staff_token):
    payload = {
        "transaction_id":   "TXN-TEST-DUP",
        "account_number":   "ACC-001",
        "holder_name":      "Holder",
        "transaction_type": "deposit",
        "amount":           1000,
    }
    client.post("/transactions/", json=payload, cookies={"branchiq_token": staff_token})
    resp = client.post("/transactions/", json=payload, cookies={"branchiq_token": staff_token})
    assert resp.status_code == 400


def test_soft_delete_transaction(client, staff_token, manager_token):
    # Create
    payload = {
        "transaction_id":   "TXN-TEST-DEL",
        "account_number":   "ACC-001",
        "holder_name":      "Holder",
        "transaction_type": "withdrawal",
        "amount":           10000,
    }
    client.post("/transactions/", json=payload, cookies={"branchiq_token": staff_token})

    # Delete (manager only)
    resp = client.delete("/transactions/TXN-TEST-DEL", cookies={"branchiq_token": manager_token})
    assert resp.status_code == 200

    # Should not appear in list
    list_resp = client.get("/transactions/", cookies={"branchiq_token": staff_token})
    ids = [t["transaction_id"] for t in list_resp.json()]
    assert "TXN-TEST-DEL" not in ids


def test_staff_cannot_delete_transaction(client, staff_token):
    payload = {
        "transaction_id":   "TXN-NODELETE",
        "account_number":   "ACC-001",
        "holder_name":      "Holder",
        "transaction_type": "deposit",
        "amount":           5000,
    }
    client.post("/transactions/", json=payload, cookies={"branchiq_token": staff_token})
    resp = client.delete("/transactions/TXN-NODELETE", cookies={"branchiq_token": staff_token})
    assert resp.status_code == 403


def test_transaction_negative_amount_rejected(client, staff_token):
    payload = {
        "transaction_id":   "TXN-NEG",
        "account_number":   "ACC-001",
        "holder_name":      "Holder",
        "transaction_type": "deposit",
        "amount":           -500,
    }
    resp = client.post("/transactions/", json=payload, cookies={"branchiq_token": staff_token})
    assert resp.status_code == 422  # Pydantic validation error


def test_transfer_type_accepted(client, staff_token):
    payload = {
        "transaction_id":   "TXN-TRANSFER",
        "account_number":   "ACC-001",
        "holder_name":      "Holder",
        "transaction_type": "transfer",
        "amount":           25000,
    }
    resp = client.post("/transactions/", json=payload, cookies={"branchiq_token": staff_token})
    assert resp.status_code == 201
    assert resp.json()["transaction_type"] == "transfer"


def test_loan_repayment_type_accepted(client, staff_token):
    payload = {
        "transaction_id":   "TXN-REPAY",
        "account_number":   "ACC-001",
        "holder_name":      "Holder",
        "transaction_type": "loan_repayment",
        "amount":           10000,
    }
    resp = client.post("/transactions/", json=payload, cookies={"branchiq_token": staff_token})
    assert resp.status_code == 201
    assert resp.json()["transaction_type"] == "loan_repayment"


def test_invalid_transaction_type_rejected(client, staff_token):
    payload = {
        "transaction_id":   "TXN-BADTYPE",
        "account_number":   "ACC-001",
        "holder_name":      "Holder",
        "transaction_type": "gambling",
        "amount":           5000,
    }
    resp = client.post("/transactions/", json=payload, cookies={"branchiq_token": staff_token})
    assert resp.status_code == 422
