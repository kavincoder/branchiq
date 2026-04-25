# Data Model Document
## BranchIQ — AI-Powered Branch Banking Management System

**Version:** 1.0  
**Date:** 2026-04-19  
**Status:** Draft

---

## Overview

This document defines every table in the PostgreSQL database, all fields, data types, relationships, and business rules. This is the single source of truth for how data is structured.

---

## Formatted ID Convention

Every major record uses a human-readable formatted ID instead of plain numbers.

| Entity | Format | Example |
|---|---|---|
| User | `USR-YYYY-NNNN` | `USR-2026-0001` |
| Loan Account | `ACC-YYYY-NNNN` | `ACC-2026-0001` |
| Transaction | `TXN-YYYY-NNNN` | `TXN-2026-0001` |
| Loan | `LN-YYYY-NNNN` | `LN-2026-0001` |
| Deposit | `DEP-YYYY-NNNN` | `DEP-2026-0001` |
| Investment | `INV-YYYY-NNNN` | `INV-2026-0001` |

`YYYY` = year of creation. `NNNN` = auto-incrementing 4-digit number, resets each year.

---

## Tables

---

### 1. `users`
Stores all staff and manager accounts. No self-registration — manager creates all accounts.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | SERIAL | PRIMARY KEY | Internal auto-increment ID |
| `user_id` | VARCHAR(20) | UNIQUE, NOT NULL | Formatted ID e.g. USR-2026-0001 |
| `full_name` | VARCHAR(100) | NOT NULL | Staff member's full name |
| `username` | VARCHAR(50) | UNIQUE, NOT NULL | Login username |
| `password_hash` | VARCHAR(255) | NOT NULL | bcrypt hashed password — never plain text |
| `role` | ENUM | NOT NULL | `manager` or `staff` |
| `is_active` | BOOLEAN | DEFAULT TRUE | False = deactivated account, cannot login |
| `created_by` | VARCHAR(20) | FK → users.user_id | Which manager created this account |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Account creation timestamp |
| `updated_at` | TIMESTAMP | AUTO | Last update timestamp |

**Rules:**
- Only one `manager` role allowed per branch
- Deactivated users cannot login but their records stay (for audit history)
- Password must be hashed before insert — never store plain text

---

### 2. `login_logs`
Records every login event for security and auditing.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | SERIAL | PRIMARY KEY | Internal ID |
| `user_id` | VARCHAR(20) | FK → users.user_id | Who logged in |
| `login_time` | TIMESTAMP | NOT NULL | Exact time of login |
| `logout_time` | TIMESTAMP | NULLABLE | Exact time of logout or session expiry |
| `ip_address` | VARCHAR(45) | NOT NULL | IP address of device used (supports IPv6) |
| `status` | ENUM | NOT NULL | `success` or `failed` |
| `failed_attempts` | INTEGER | DEFAULT 0 | Number of failed attempts before this event |
| `session_duration_mins` | INTEGER | NULLABLE | Calculated on logout: (logout - login) in minutes |

**Rules:**
- Every login attempt is logged — success or failure
- `logout_time` is set when user clicks logout OR when JWT token expires (8 hours)
- `failed_attempts` resets to 0 on successful login
- These records are never deleted — permanent audit trail

---

### 3. `loan_accounts`
Stores individual borrower profiles and their loan account details.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | SERIAL | PRIMARY KEY | Internal ID |
| `account_number` | VARCHAR(20) | UNIQUE, NOT NULL | Formatted ID e.g. ACC-2026-0001 |
| `holder_name` | VARCHAR(100) | NOT NULL | Full name of borrower |
| `phone` | VARCHAR(15) | NOT NULL | Contact number |
| `address` | TEXT | NOT NULL | Residential address |
| `id_proof_type` | VARCHAR(50) | NOT NULL | Aadhaar / PAN / Voter ID |
| `id_proof_number` | VARCHAR(50) | NOT NULL | ID document number |
| `is_active` | BOOLEAN | DEFAULT TRUE | False = account closed |
| `created_by` | VARCHAR(20) | FK → users.user_id | Staff who created the account |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Account opening date |
| `updated_at` | TIMESTAMP | AUTO | Last update timestamp |

**Rules:**
- One person can have multiple loan accounts (multiple loans)
- `id_proof_number` must be unique per account

---

### 4. `loans`
The main loan portfolio table. Each loan is tied to a loan account.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | SERIAL | PRIMARY KEY | Internal ID |
| `loan_id` | VARCHAR(20) | UNIQUE, NOT NULL | Formatted ID e.g. LN-2026-0001 |
| `account_number` | VARCHAR(20) | FK → loan_accounts.account_number | Which account this loan belongs to |
| `principal_amount` | NUMERIC(15,2) | NOT NULL | Original loan amount in INR |
| `interest_rate` | NUMERIC(5,2) | NOT NULL | Annual interest rate as percentage e.g. 12.50 |
| `compound_frequency` | ENUM | DEFAULT 'quarterly' | Always `quarterly` for now |
| `start_date` | DATE | NOT NULL | Loan disbursement date |
| `end_date` | DATE | NOT NULL | Loan maturity/due date |
| `outstanding_balance` | NUMERIC(15,2) | NOT NULL | Auto-calculated: compound interest applied |
| `total_paid` | NUMERIC(15,2) | DEFAULT 0 | Sum of all repayments made |
| `status` | ENUM | NOT NULL | `active`, `closed`, `defaulted` |
| `purpose` | TEXT | NULLABLE | What the loan is for |
| `created_by` | VARCHAR(20) | FK → users.user_id | Staff who created the loan record |
| `created_at` | TIMESTAMP | DEFAULT NOW() | When loan was entered |
| `updated_at` | TIMESTAMP | AUTO | Last update timestamp |

**Interest Calculation (Compound Quarterly):**
```
A = P × (1 + r/4)^(4t)

Where:
  P = principal_amount
  r = interest_rate / 100
  t = years elapsed since start_date
  A = total amount owed (outstanding_balance)
```
`outstanding_balance` is recalculated automatically every time a repayment is made or the dashboard loads.

---

### 5. `transactions`
Records every financial event in the branch — deposits, withdrawals, transfers, loan repayments.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | SERIAL | PRIMARY KEY | Internal ID |
| `transaction_id` | VARCHAR(20) | UNIQUE, NOT NULL | Formatted ID e.g. TXN-2026-0001 |
| `account_number` | VARCHAR(20) | FK → loan_accounts.account_number | Which account this belongs to |
| `type` | ENUM | NOT NULL | `deposit`, `withdrawal`, `transfer`, `loan_repayment` |
| `amount` | NUMERIC(15,2) | NOT NULL | Transaction amount in INR |
| `from_account` | VARCHAR(20) | NULLABLE | For transfers: source account |
| `to_account` | VARCHAR(20) | NULLABLE | For transfers: destination account |
| `loan_id` | VARCHAR(20) | FK → loans.loan_id, NULLABLE | For loan repayments only |
| `transaction_date` | TIMESTAMP | DEFAULT NOW() | When transaction occurred |
| `notes` | TEXT | NULLABLE | Optional staff notes |
| `created_by` | VARCHAR(20) | FK → users.user_id | Staff who logged the transaction |
| `is_deleted` | BOOLEAN | DEFAULT FALSE | Soft delete flag |
| `deleted_at` | TIMESTAMP | NULLABLE | When deletion was requested |
| `deleted_by` | VARCHAR(20) | FK → users.user_id, NULLABLE | Which manager deleted it |
| `permanent_delete_at` | TIMESTAMP | NULLABLE | Auto-set to deleted_at + 15 days |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation time |

**Soft Delete Rules:**
- Only Branch Manager can delete transactions
- On delete: `is_deleted = TRUE`, `deleted_at = NOW()`, `permanent_delete_at = NOW() + 15 days`
- Deleted transactions hidden from all views but stay in database
- A background job runs daily — permanently removes records where `NOW() > permanent_delete_at`
- Deletion event is always written to `audit_logs` before removal

**Transfer Rules:**
- `from_account` and `to_account` must both be filled for type = `transfer`
- `account_number` = `from_account` for transfers (primary reference)

---

### 6. `deposits`
Branch deposit portfolio — tracks all customer deposits held by the branch.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | SERIAL | PRIMARY KEY | Internal ID |
| `deposit_id` | VARCHAR(20) | UNIQUE, NOT NULL | Formatted ID e.g. DEP-2026-0001 |
| `holder_name` | VARCHAR(100) | NOT NULL | Name of depositor |
| `phone` | VARCHAR(15) | NOT NULL | Contact number |
| `deposit_amount` | NUMERIC(15,2) | NOT NULL | Amount deposited in INR |
| `interest_rate` | NUMERIC(5,2) | NOT NULL | Annual interest rate as percentage |
| `deposit_type` | ENUM | NOT NULL | `fixed` or `savings` |
| `start_date` | DATE | NOT NULL | Date deposit was made |
| `maturity_date` | DATE | NULLABLE | For fixed deposits |
| `maturity_amount` | NUMERIC(15,2) | NULLABLE | Auto-calculated on save |
| `status` | ENUM | NOT NULL | `active`, `matured`, `withdrawn` |
| `created_by` | VARCHAR(20) | FK → users.user_id | Staff who created the record |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMP | AUTO | Last update |

---

### 7. `investments`
Tracks investments made by the branch itself (Govt Bonds, Mutual Funds, FDs).

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | SERIAL | PRIMARY KEY | Internal ID |
| `investment_id` | VARCHAR(20) | UNIQUE, NOT NULL | Formatted ID e.g. INV-2026-0001 |
| `investment_type` | ENUM | NOT NULL | `govt_bond`, `mutual_fund`, `fixed_deposit` |
| `amount` | NUMERIC(15,2) | NOT NULL | Amount invested in INR |
| `investment_date` | DATE | NOT NULL | Date of investment |
| `expected_return_rate` | NUMERIC(5,2) | NOT NULL | Expected annual return % |
| `expected_maturity_amount` | NUMERIC(15,2) | NULLABLE | Auto-calculated on save |
| `maturity_date` | DATE | NOT NULL | When investment matures |
| `status` | ENUM | NOT NULL | `active`, `matured`, `liquidated` |
| `notes` | TEXT | NULLABLE | Additional details |
| `created_by` | VARCHAR(20) | FK → users.user_id | Staff who entered the record |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMP | AUTO | Last update |

---

### 8. `audit_logs`
Permanent record of every significant action in the system. Never deleted.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | SERIAL | PRIMARY KEY | Internal ID |
| `action` | ENUM | NOT NULL | `create`, `update`, `delete`, `login`, `export` |
| `table_name` | VARCHAR(50) | NOT NULL | Which table was affected |
| `record_id` | VARCHAR(20) | NOT NULL | The formatted ID of the affected record |
| `performed_by` | VARCHAR(20) | FK → users.user_id | Who did the action |
| `performed_at` | TIMESTAMP | DEFAULT NOW() | Exact time of action |
| `old_data` | JSONB | NULLABLE | Snapshot of data before change |
| `new_data` | JSONB | NULLABLE | Snapshot of data after change |
| `ip_address` | VARCHAR(45) | NOT NULL | IP address of the device |
| `notes` | TEXT | NULLABLE | Extra context if needed |

**Rules:**
- Written automatically by the backend on every create/update/delete
- Never editable or deletable — read-only table
- `old_data` and `new_data` stored as JSON snapshots for full history

---

## Relationships Summary

```
users
  ├── creates → loan_accounts
  ├── creates → loans
  ├── creates → transactions
  ├── creates → deposits
  ├── creates → investments
  ├── logs → login_logs
  └── logs → audit_logs

loan_accounts
  ├── has many → loans
  └── has many → transactions

loans
  └── has many → transactions (type: loan_repayment)
```

---

## Business Rules Summary

| Rule | Detail |
|---|---|
| Interest type | Compound, quarterly: A = P(1 + r/4)^(4t) |
| Soft delete window | 15 days — then permanently purged |
| Password storage | bcrypt hash only — no plain text ever |
| Balance calculation | Auto-derived from transactions — no manual entry |
| Formatted IDs | All major entities use formatted codes |
| Audit logs | Permanent — never deleted |
| Login logs | Permanent — track login, logout, IP, failed attempts |
| Currency | INR only, stored as NUMERIC(15,2) for precision |
| Float rule | Never use FLOAT for money — always NUMERIC(15,2) |

---

*End of Data Model v1.0*
