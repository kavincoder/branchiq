# API Design Document
## BranchIQ — AI-Powered Branch Banking Management System

**Version:** 1.0  
**Date:** 2026-04-19  
**Status:** Draft  
**Base URL:** `http://localhost:8000/api/v1`

---

## Global Standards

### Request Headers
Every request (except login) must include:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Standard Success Response
```json
{
  "success": true,
  "message": "Action completed",
  "data": { ... }
}
```

### Standard Error Response
```json
{
  "success": false,
  "error": "Description of what went wrong",
  "code": 400
}
```

### HTTP Status Codes Used
| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created successfully |
| 400 | Bad request — invalid input |
| 401 | Unauthorized — not logged in or token expired |
| 403 | Forbidden — logged in but not allowed (wrong role) |
| 404 | Record not found |
| 409 | Conflict — duplicate record |
| 500 | Server error |

### Pagination
All list endpoints that can return large data use pagination.
- Default page size: **20 records per page** (faster, doesn't load all rows at once)
- Query params: `?page=1&limit=20`
- Response includes:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 145,
    "total_pages": 8
  }
}
```

### Role Access
| Symbol | Meaning |
|---|---|
| ALL | Both manager and staff |
| MGR | Manager only |

---

## 1. Authentication

---

### POST `/api/v1/auth/login`
Log in with username and password.

**Access:** Public (no token required)

**Request Body:**
```json
{
  "username": "john_staff",
  "password": "mypassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR...",
    "expires_in": 28800,
    "user": {
      "user_id": "USR-2026-0001",
      "full_name": "John Doe",
      "role": "staff"
    }
  }
}
```

**Error Responses:**
- `401` — Invalid username or password
- `403` — Account is deactivated

**Side Effects:**
- Logs event to `login_logs` with IP address and status
- Logs to `audit_logs`

---

### POST `/api/v1/auth/logout`
Invalidate the current session token server-side.

**Access:** ALL

**Request Body:** None (token read from Authorization header)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Side Effects:**
- Token added to server-side blocklist (invalidated immediately)
- `logout_time` updated in `login_logs`
- Session duration calculated and saved

---

### GET `/api/v1/auth/me`
Get the currently logged-in user's profile.

**Access:** ALL

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user_id": "USR-2026-0001",
    "full_name": "John Doe",
    "username": "john_staff",
    "role": "staff",
    "created_at": "2026-01-15T10:30:00"
  }
}
```

---

## 2. Dashboard

---

### GET `/api/v1/dashboard`
Returns all dashboard data in a single API call — summary cards, recent transactions, charts, and AI alerts.

**Access:** ALL

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_deposits": 4500000.00,
      "total_withdrawals": 1200000.00,
      "active_loans": 23,
      "total_loan_amount": 8750000.00,
      "total_investments": 2000000.00
    },
    "recent_transactions": [
      {
        "transaction_id": "TXN-2026-0034",
        "type": "deposit",
        "amount": 50000.00,
        "account_number": "ACC-2026-0007",
        "holder_name": "Ravi Kumar",
        "transaction_date": "2026-04-19T09:15:00",
        "created_by": "USR-2026-0002"
      }
    ],
    "monthly_trend": [
      { "month": "Nov 2025", "deposits": 320000, "withdrawals": 95000 },
      { "month": "Dec 2025", "deposits": 410000, "withdrawals": 120000 },
      { "month": "Jan 2026", "deposits": 380000, "withdrawals": 88000 },
      { "month": "Feb 2026", "deposits": 450000, "withdrawals": 110000 },
      { "month": "Mar 2026", "deposits": 500000, "withdrawals": 130000 },
      { "month": "Apr 2026", "deposits": 210000, "withdrawals": 60000 }
    ],
    "portfolio_breakdown": {
      "loans": 8750000.00,
      "deposits": 4500000.00,
      "investments": 2000000.00
    },
    "ai_alert": {
      "has_anomalies": true,
      "anomaly_count": 3,
      "last_run": "2026-04-18T23:00:00"
    }
  }
}
```

---

## 3. Users (Manager Only)

---

### GET `/api/v1/users`
Get all staff accounts.

**Access:** MGR  
**Pagination:** Yes

**Query Params:**
- `?page=1&limit=20`
- `?is_active=true` — filter by active/inactive

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "user_id": "USR-2026-0002",
      "full_name": "Priya Sharma",
      "username": "priya_staff",
      "role": "staff",
      "is_active": true,
      "created_at": "2026-01-20T09:00:00"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 5, "total_pages": 1 }
}
```

---

### POST `/api/v1/users`
Create a new staff account.

**Access:** MGR

**Request Body:**
```json
{
  "full_name": "Priya Sharma",
  "username": "priya_staff",
  "password": "securepassword123",
  "role": "staff"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Staff account created",
  "data": {
    "user_id": "USR-2026-0003",
    "full_name": "Priya Sharma",
    "username": "priya_staff",
    "role": "staff"
  }
}
```

**Error Responses:**
- `409` — Username already exists

---

### PUT `/api/v1/users/{user_id}`
Update a staff account — name, password, or active status.

**Access:** MGR

**Request Body (all fields optional):**
```json
{
  "full_name": "Priya S.",
  "password": "newpassword456",
  "is_active": false
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Account updated",
  "data": { "user_id": "USR-2026-0003", "is_active": false }
}
```

---

### GET `/api/v1/users/{user_id}/activity`
View activity log for a specific staff member — what transactions they added.

**Access:** MGR  
**Pagination:** Yes

---

## 4. Loan Accounts

---

### GET `/api/v1/accounts`
Get all loan accounts.

**Access:** ALL  
**Pagination:** Yes

**Query Params:**
- `?is_active=true`
- `?search=Ravi` — search by holder name or account number

---

### POST `/api/v1/accounts`
Create a new loan account for a borrower.

**Access:** ALL

**Request Body:**
```json
{
  "holder_name": "Ravi Kumar",
  "phone": "9876543210",
  "address": "12, MG Road, Chennai - 600001",
  "id_proof_type": "Aadhaar",
  "id_proof_number": "1234-5678-9012"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Loan account created",
  "data": {
    "account_number": "ACC-2026-0008",
    "holder_name": "Ravi Kumar"
  }
}
```

---

### GET `/api/v1/accounts/{account_number}`
Get full details of one loan account including all linked loans.

**Access:** ALL

---

### PUT `/api/v1/accounts/{account_number}`
Update borrower details (phone, address).

**Access:** ALL

---

## 5. Transactions

---

### GET `/api/v1/transactions`
Get all transactions for the branch.

**Access:** ALL  
**Pagination:** Yes

**Query Params:**
- `?page=1&limit=20`
- `?type=deposit` — filter by type (deposit, withdrawal, transfer, loan_repayment)
- `?account_number=ACC-2026-0007`
- `?from_date=2026-01-01&to_date=2026-04-19`
- `?search=TXN-2026-0034` — search by transaction ID

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "transaction_id": "TXN-2026-0034",
      "type": "deposit",
      "amount": 50000.00,
      "account_number": "ACC-2026-0007",
      "holder_name": "Ravi Kumar",
      "transaction_date": "2026-04-19T09:15:00",
      "notes": "Monthly deposit",
      "created_by_name": "Priya Sharma",
      "is_anomaly": false
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 145, "total_pages": 8 }
}
```

---

### POST `/api/v1/transactions`
Add a new transaction.

**Access:** ALL

**Request Body:**
```json
{
  "account_number": "ACC-2026-0007",
  "type": "deposit",
  "amount": 50000.00,
  "transaction_date": "2026-04-19T09:15:00",
  "notes": "Monthly deposit"
}
```
For transfer, add: `"from_account"` and `"to_account"`  
For loan repayment, add: `"loan_id": "LN-2026-0005"`

**Success Response (201):**
```json
{
  "success": true,
  "message": "Transaction recorded",
  "data": { "transaction_id": "TXN-2026-0035" }
}
```

---

### PUT `/api/v1/transactions/{transaction_id}`
Edit a transaction.

**Access:** MGR only

---

### DELETE `/api/v1/transactions/{transaction_id}`
Soft delete a transaction. Stays in DB for 15 days, then permanently purged.

**Access:** MGR only

**Success Response (200):**
```json
{
  "success": true,
  "message": "Transaction deleted. Will be permanently removed on 2026-05-04."
}
```

---

## 6. Loans

---

### GET `/api/v1/loans`
Get all loans in the portfolio.

**Access:** ALL  
**Pagination:** Yes

**Query Params:**
- `?status=active` — filter by status (active, closed, defaulted)
- `?account_number=ACC-2026-0007`

---

### POST `/api/v1/loans`
Create a new loan record.

**Access:** ALL

**Request Body:**
```json
{
  "account_number": "ACC-2026-0007",
  "principal_amount": 200000.00,
  "interest_rate": 12.50,
  "start_date": "2026-04-19",
  "end_date": "2029-04-19",
  "purpose": "Home renovation"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Loan created",
  "data": {
    "loan_id": "LN-2026-0012",
    "outstanding_balance": 200000.00
  }
}
```

---

### GET `/api/v1/loans/{loan_id}`
Get full loan details including repayment history and current outstanding balance.

**Access:** ALL

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "loan_id": "LN-2026-0012",
    "account_number": "ACC-2026-0007",
    "holder_name": "Ravi Kumar",
    "principal_amount": 200000.00,
    "interest_rate": 12.50,
    "outstanding_balance": 187450.00,
    "total_paid": 25000.00,
    "status": "active",
    "start_date": "2026-04-19",
    "end_date": "2029-04-19",
    "repayment_history": [
      {
        "transaction_id": "TXN-2026-0020",
        "amount": 25000.00,
        "transaction_date": "2026-04-01T10:00:00"
      }
    ]
  }
}
```

---

### PUT `/api/v1/loans/{loan_id}`
Update loan status or details.

**Access:** MGR only

---

## 7. Deposits

---

### GET `/api/v1/deposits`
Get all deposits in the portfolio.

**Access:** ALL  
**Pagination:** Yes

**Query Params:**
- `?status=active`
- `?deposit_type=fixed`

---

### POST `/api/v1/deposits`
Add a new deposit record.

**Access:** ALL

**Request Body:**
```json
{
  "holder_name": "Meena Iyer",
  "phone": "9123456780",
  "deposit_amount": 100000.00,
  "interest_rate": 7.50,
  "deposit_type": "fixed",
  "start_date": "2026-04-19",
  "maturity_date": "2027-04-19"
}
```

---

### GET `/api/v1/deposits/{deposit_id}`
Get full details of one deposit.

**Access:** ALL

---

### PUT `/api/v1/deposits/{deposit_id}`
Update deposit status (e.g. mark as withdrawn or matured).

**Access:** MGR only

---

## 8. Investments

---

### GET `/api/v1/investments`
Get all branch investments.

**Access:** ALL  
**Pagination:** Yes

**Query Params:**
- `?status=active`
- `?investment_type=govt_bond`

---

### POST `/api/v1/investments`
Add a new investment record.

**Access:** ALL

**Request Body:**
```json
{
  "investment_type": "govt_bond",
  "amount": 500000.00,
  "investment_date": "2026-04-19",
  "expected_return_rate": 8.00,
  "maturity_date": "2031-04-19",
  "notes": "RBI Bond Series 2026"
}
```

---

### GET `/api/v1/investments/{investment_id}`
Get full details of one investment.

**Access:** ALL

---

### PUT `/api/v1/investments/{investment_id}`
Update investment status (matured, liquidated).

**Access:** MGR only

---

## 9. AI Analysis

---

### POST `/api/v1/ai/run-analysis`
Trigger AI analysis manually. Any staff member can click "Run Analysis" button.

**Access:** ALL

**Request Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "message": "Analysis complete",
  "data": {
    "anomalies_found": 3,
    "run_at": "2026-04-19T14:30:00",
    "transactions_scanned": 512
  }
}
```

**Note:** This is a synchronous call — waits for analysis to complete before responding. Expected time: under 10 seconds for up to 10,000 transactions.

---

### GET `/api/v1/ai/anomalies`
Get all transactions flagged as anomalies from the last analysis run.

**Access:** ALL  
**Pagination:** Yes

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "transaction_id": "TXN-2026-0089",
      "type": "withdrawal",
      "amount": 750000.00,
      "account_number": "ACC-2026-0003",
      "holder_name": "Suresh Pillai",
      "transaction_date": "2026-04-18T02:14:00",
      "anomaly_reason": "Unusually large withdrawal at odd hours",
      "anomaly_score": 0.94
    }
  ]
}
```

---

### GET `/api/v1/ai/insights`
Get spending insights and trend analysis.

**Access:** ALL

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "last_run": "2026-04-19T14:30:00",
    "monthly_comparison": {
      "deposits": { "this_month": 500000, "last_month": 450000, "change_pct": 11.1 },
      "withdrawals": { "this_month": 130000, "last_month": 110000, "change_pct": 18.2 },
      "loan_repayments": { "this_month": 85000, "last_month": 90000, "change_pct": -5.6 }
    },
    "loan_performance": {
      "on_time_pct": 78.3,
      "defaulted_count": 2,
      "active_count": 23
    },
    "trend_alerts": [
      "Withdrawals increased 18.2% compared to last month",
      "Loan repayments down 5.6% — monitor closely"
    ]
  }
}
```

---

## 10. Export (Excel)

---

### GET `/api/v1/export/transactions`
Download all (or filtered) transactions as an Excel file. Instant browser download.

**Access:** ALL

**Query Params:**
- `?from_date=2026-01-01&to_date=2026-04-19`
- `?type=deposit`

**Response:** Binary `.xlsx` file stream
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="BranchIQ_Transactions_2026-04-19.xlsx"
```

---

### GET `/api/v1/export/loans`
Download loan portfolio as Excel.

**Access:** ALL

**Response:** Binary `.xlsx` file  
**Filename:** `BranchIQ_Loans_2026-04-19.xlsx`

---

### GET `/api/v1/export/deposits`
Download deposit portfolio as Excel.

**Access:** ALL

**Response:** Binary `.xlsx` file  
**Filename:** `BranchIQ_Deposits_2026-04-19.xlsx`

---

### GET `/api/v1/export/investments`
Download investment portfolio as Excel.

**Access:** ALL

**Response:** Binary `.xlsx` file  
**Filename:** `BranchIQ_Investments_2026-04-19.xlsx`

---

## 11. Global Search

---

### GET `/api/v1/search`
Search across transactions, loans, accounts, deposits, and investments in one call.

**Access:** ALL

**Query Params:**
- `?q=Ravi Kumar` — search term (minimum 2 characters)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "accounts": [
      { "account_number": "ACC-2026-0007", "holder_name": "Ravi Kumar", "type": "loan_account" }
    ],
    "transactions": [
      { "transaction_id": "TXN-2026-0034", "amount": 50000.00, "type": "deposit" }
    ],
    "loans": [],
    "deposits": [],
    "investments": []
  }
}
```

---

## 12. Audit Logs

---

### GET `/api/v1/audit-logs`
View full audit trail — who did what and when.

**Access:** MGR only  
**Pagination:** Yes

**Query Params:**
- `?performed_by=USR-2026-0002`
- `?action=delete`
- `?from_date=2026-04-01&to_date=2026-04-19`
- `?table_name=transactions`

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 142,
      "action": "delete",
      "table_name": "transactions",
      "record_id": "TXN-2026-0031",
      "performed_by_name": "Branch Manager",
      "performed_at": "2026-04-18T16:45:00",
      "ip_address": "192.168.1.5"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 310, "total_pages": 16 }
}
```

---

## Full Endpoint Summary

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | /auth/login | Public | Login |
| POST | /auth/logout | ALL | Logout |
| GET | /auth/me | ALL | Get current user |
| GET | /dashboard | ALL | Full dashboard data |
| GET | /users | MGR | List all staff |
| POST | /users | MGR | Create staff account |
| PUT | /users/{user_id} | MGR | Update staff account |
| GET | /users/{user_id}/activity | MGR | Staff activity log |
| GET | /accounts | ALL | List loan accounts |
| POST | /accounts | ALL | Create loan account |
| GET | /accounts/{account_number} | ALL | Account details |
| PUT | /accounts/{account_number} | ALL | Update account |
| GET | /transactions | ALL | List transactions (paginated) |
| POST | /transactions | ALL | Add transaction |
| PUT | /transactions/{id} | MGR | Edit transaction |
| DELETE | /transactions/{id} | MGR | Soft delete transaction |
| GET | /loans | ALL | List loans |
| POST | /loans | ALL | Create loan |
| GET | /loans/{loan_id} | ALL | Loan details + repayments |
| PUT | /loans/{loan_id} | MGR | Update loan |
| GET | /deposits | ALL | List deposits |
| POST | /deposits | ALL | Add deposit |
| GET | /deposits/{deposit_id} | ALL | Deposit details |
| PUT | /deposits/{deposit_id} | MGR | Update deposit |
| GET | /investments | ALL | List investments |
| POST | /investments | ALL | Add investment |
| GET | /investments/{investment_id} | ALL | Investment details |
| PUT | /investments/{investment_id} | MGR | Update investment |
| POST | /ai/run-analysis | ALL | Trigger AI analysis |
| GET | /ai/anomalies | ALL | Get flagged transactions |
| GET | /ai/insights | ALL | Get spending insights |
| GET | /export/transactions | ALL | Download transactions Excel |
| GET | /export/loans | ALL | Download loans Excel |
| GET | /export/deposits | ALL | Download deposits Excel |
| GET | /export/investments | ALL | Download investments Excel |
| GET | /search | ALL | Global search |
| GET | /audit-logs | MGR | View audit trail |

---

*End of API Design v1.0*
