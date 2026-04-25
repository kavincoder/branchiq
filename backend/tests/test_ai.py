"""
Tests for /ai/ endpoints.
Covers: summary, daily-snapshot, monthly-trend, anomalies, insights, run analysis.
"""


def test_summary_returns_expected_keys(client, staff_token):
    resp = client.get("/ai/summary", cookies={"branchiq_token": staff_token})
    assert resp.status_code == 200
    body = resp.json()
    for key in ("total_deposits", "total_withdrawals", "active_loans", "loans_new",
                "deposits_change", "withdrawals_change", "total_loan_amount", "total_investments"):
        assert key in body, f"Missing key: {key}"


def test_summary_zero_on_empty_db(client, staff_token):
    resp = client.get("/ai/summary", cookies={"branchiq_token": staff_token})
    assert resp.status_code == 200
    body = resp.json()
    assert body["total_deposits"] == 0
    assert body["active_loans"] == 0


def test_daily_snapshot_returns_expected_keys(client, staff_token):
    resp = client.get("/ai/daily-snapshot", cookies={"branchiq_token": staff_token})
    assert resp.status_code == 200
    body = resp.json()
    assert "deposits_today" in body
    assert "withdrawals_today" in body
    assert "total_today" in body
    assert "top_accounts" in body
    assert isinstance(body["top_accounts"], list)


def test_daily_snapshot_counts_todays_transactions(client, staff_token):
    # Create a deposit
    payload = {
        "transaction_id":   "TXN-AI-TEST-001",
        "account_number":   "ACC-AI-001",
        "holder_name":      "AI Tester",
        "transaction_type": "deposit",
        "amount":           50000,
    }
    client.post("/transactions/", json=payload, cookies={"branchiq_token": staff_token})

    resp = client.get("/ai/daily-snapshot", cookies={"branchiq_token": staff_token})
    assert resp.status_code == 200
    body = resp.json()
    assert body["deposits_today"]["count"] >= 1
    assert body["deposits_today"]["amount"] >= 50000
    assert body["total_today"] >= 1


def test_monthly_trend_returns_6_months(client, staff_token):
    resp = client.get("/ai/monthly-trend", cookies={"branchiq_token": staff_token})
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 6
    for row in data:
        assert "month" in row
        assert "deposits" in row
        assert "withdrawals" in row
        assert "loan_repayments" in row


def test_anomalies_empty_on_clean_db(client, staff_token):
    resp = client.get("/ai/anomalies", cookies={"branchiq_token": staff_token})
    assert resp.status_code == 200
    assert resp.json() == []


def test_run_analysis_requires_auth(client):
    resp = client.post("/ai/run")
    assert resp.status_code == 401


def test_run_analysis_succeeds(client, staff_token):
    # Seed a transaction so analysis has data
    payload = {
        "transaction_id":   "TXN-AI-RUN-001",
        "account_number":   "ACC-AI-001",
        "holder_name":      "AI Tester",
        "transaction_type": "deposit",
        "amount":           45000,
    }
    client.post("/transactions/", json=payload, cookies={"branchiq_token": staff_token})
    resp = client.post("/ai/run", cookies={"branchiq_token": staff_token})
    assert resp.status_code == 200
    body = resp.json()
    assert "transactions_scanned" in body
    assert "anomalies_found" in body


def test_insights_returns_expected_structure(client, staff_token):
    resp = client.get("/ai/insights", cookies={"branchiq_token": staff_token})
    assert resp.status_code == 200
    body = resp.json()
    assert "loan_performance" in body
    assert "monthly_comparison" in body
    assert "dormant_accounts" in body


def test_overdue_count_endpoint(client, staff_token):
    resp = client.get("/loans/overdue-count", cookies={"branchiq_token": staff_token})
    assert resp.status_code == 200
    assert "count" in resp.json()
    assert isinstance(resp.json()["count"], int)
