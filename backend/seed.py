"""
BranchIQ Seed File
Run once from the backend folder:  python3 seed.py
"""

import sys
import os
from datetime import date, datetime, timezone
from decimal import Decimal

sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine
from app.models.user        import User
from app.models.transaction import Transaction
from app.models.loan        import Loan
from app.models.deposit     import Deposit
from app.models.investment  import Investment
from app.models.audit_log   import AuditLog
from app.utils.security     import hash_password


def seed():
    db = SessionLocal()

    try:
        # ── Wipe existing data (safe for dev) ────────────────────────────────
        print("🗑   Clearing existing data...")
        db.query(AuditLog).delete()
        db.query(Transaction).delete()
        db.query(Loan).delete()
        db.query(Deposit).delete()
        db.query(Investment).delete()
        db.query(User).delete()
        db.commit()

        # ── 1. STAFF ACCOUNTS ────────────────────────────────────────────────
        print("👤  Seeding staff accounts...")

        # Override via SEED_PASSWORD env var for custom deployments
        default_password = os.environ.get("SEED_PASSWORD", "branchiq123")
        pw = hash_password(default_password)

        staff = [
            User(user_id="USR-2026-0001", full_name="Arjun Sharma",    username="arjun.manager", hashed_password=pw, role="manager", is_active=True),
            User(user_id="USR-2026-0002", full_name="Priya Singh",     username="priya.staff",   hashed_password=pw, role="staff",   is_active=True),
            User(user_id="USR-2026-0003", full_name="Rahul Verma",     username="rahul.staff",   hashed_password=pw, role="staff",   is_active=True),
            User(user_id="USR-2026-0004", full_name="Sneha Patel",     username="sneha.staff",   hashed_password=pw, role="staff",   is_active=True),
            User(user_id="USR-2026-0005", full_name="Mohammed Farhan", username="farhan.staff",  hashed_password=pw, role="staff",   is_active=True),
        ]
        db.add_all(staff)
        db.commit()
        print(f"    ✅ {len(staff)} staff accounts created")

        # ── 2. CUSTOMERS (account holders) ───────────────────────────────────
        customers = [
            ("Kavin Kumar",       "ACC-10001"),
            ("Janakesh Rajan",    "ACC-10002"),
            ("Prakash Sundaram",  "ACC-10003"),
            ("Giftson David",     "ACC-10004"),
            ("Raj Patel",         "ACC-10005"),
            ("Chatrapathi Reddy", "ACC-10006"),
            ("Tharun Kumar",      "ACC-10007"),
            ("Jossiah Thomas",    "ACC-10008"),
            ("Mohammed Zarif",    "ACC-10009"),
            ("Naveendh Krishnan", "ACC-10010"),
            ("Arjun Mehta",       "ACC-10011"),
            ("Sneha Iyer",        "ACC-10012"),
            ("Vikram Nair",       "ACC-10013"),
            ("Deepa Krishnan",    "ACC-10014"),
            ("Rohan Pillai",      "ACC-10015"),
            ("Ananya Sharma",     "ACC-10016"),
            ("Suresh Babu",       "ACC-10017"),
        ]

        # ── 3. TRANSACTIONS ───────────────────────────────────────────────────
        print("💸  Seeding transactions...")

        transactions_data = [
            # (txn_id, acc_num, holder, type, amount, anomaly_score, note)
            ("TXN-2026-0001", "ACC-10001", "Kavin Kumar",       "deposit",    Decimal("45000.00"),  0.05, "Monthly salary credit"),
            ("TXN-2026-0002", "ACC-10001", "Kavin Kumar",       "withdrawal", Decimal("12000.00"),  0.08, "Rent payment"),
            ("TXN-2026-0003", "ACC-10001", "Kavin Kumar",       "withdrawal", Decimal("980000.00"), 0.92, "Large cash withdrawal"),
            ("TXN-2026-0004", "ACC-10002", "Janakesh Rajan",    "deposit",    Decimal("75000.00"),  0.06, "Business income"),
            ("TXN-2026-0005", "ACC-10002", "Janakesh Rajan",    "withdrawal", Decimal("30000.00"),  0.10, "Equipment purchase"),
            ("TXN-2026-0006", "ACC-10003", "Prakash Sundaram",  "deposit",    Decimal("55000.00"),  0.04, "Salary"),
            ("TXN-2026-0007", "ACC-10003", "Prakash Sundaram",  "withdrawal", Decimal("850000.00"), 0.88, "Unusual night withdrawal"),
            ("TXN-2026-0008", "ACC-10004", "Giftson David",     "deposit",    Decimal("40000.00"),  0.03, "Salary credit"),
            ("TXN-2026-0009", "ACC-10004", "Giftson David",     "withdrawal", Decimal("15000.00"),  0.07, "Grocery and bills"),
            ("TXN-2026-0010", "ACC-10005", "Raj Patel",         "deposit",    Decimal("120000.00"), 0.12, "Freelance payment"),
            ("TXN-2026-0011", "ACC-10005", "Raj Patel",         "withdrawal", Decimal("25000.00"),  0.09, "Car EMI"),
            ("TXN-2026-0012", "ACC-10006", "Chatrapathi Reddy", "deposit",    Decimal("65000.00"),  0.05, "Monthly salary"),
            ("TXN-2026-0013", "ACC-10006", "Chatrapathi Reddy", "withdrawal", Decimal("720000.00"), 0.85, "Suspicious large amount"),
            ("TXN-2026-0014", "ACC-10007", "Tharun Kumar",      "deposit",    Decimal("38000.00"),  0.04, "Salary"),
            ("TXN-2026-0015", "ACC-10007", "Tharun Kumar",      "withdrawal", Decimal("10000.00"),  0.06, "Monthly expenses"),
            ("TXN-2026-0016", "ACC-10008", "Jossiah Thomas",    "deposit",    Decimal("90000.00"),  0.08, "Project payment"),
            ("TXN-2026-0017", "ACC-10008", "Jossiah Thomas",    "withdrawal", Decimal("45000.00"),  0.11, "Home loan EMI"),
            ("TXN-2026-0018", "ACC-10009", "Mohammed Zarif",    "deposit",    Decimal("50000.00"),  0.05, "Salary"),
            ("TXN-2026-0019", "ACC-10009", "Mohammed Zarif",    "withdrawal", Decimal("20000.00"),  0.07, "Utilities and bills"),
            ("TXN-2026-0020", "ACC-10010", "Naveendh Krishnan", "deposit",    Decimal("62000.00"),  0.04, "Monthly income"),
            ("TXN-2026-0021", "ACC-10010", "Naveendh Krishnan", "withdrawal", Decimal("890000.00"), 0.91, "Very large withdrawal at 2am"),
            ("TXN-2026-0022", "ACC-10011", "Arjun Mehta",       "deposit",    Decimal("85000.00"),  0.06, "Consulting fee"),
            ("TXN-2026-0023", "ACC-10011", "Arjun Mehta",       "withdrawal", Decimal("35000.00"),  0.08, "Credit card payment"),
            ("TXN-2026-0024", "ACC-10012", "Sneha Iyer",        "deposit",    Decimal("48000.00"),  0.05, "Salary credit"),
            ("TXN-2026-0025", "ACC-10012", "Sneha Iyer",        "withdrawal", Decimal("18000.00"),  0.07, "Shopping"),
            ("TXN-2026-0026", "ACC-10013", "Vikram Nair",       "deposit",    Decimal("110000.00"), 0.09, "Business revenue"),
            ("TXN-2026-0027", "ACC-10013", "Vikram Nair",       "withdrawal", Decimal("55000.00"),  0.10, "Office rent"),
            ("TXN-2026-0028", "ACC-10014", "Deepa Krishnan",    "deposit",    Decimal("42000.00"),  0.04, "Salary"),
            ("TXN-2026-0029", "ACC-10014", "Deepa Krishnan",    "withdrawal", Decimal("660000.00"), 0.83, "Flagged large transfer"),
            ("TXN-2026-0030", "ACC-10015", "Rohan Pillai",      "deposit",    Decimal("73000.00"),  0.06, "Monthly salary"),
            ("TXN-2026-0031", "ACC-10015", "Rohan Pillai",      "withdrawal", Decimal("28000.00"),  0.08, "Loan repayment"),
            ("TXN-2026-0032", "ACC-10016", "Ananya Sharma",     "deposit",    Decimal("56000.00"),  0.05, "Salary"),
            ("TXN-2026-0033", "ACC-10016", "Ananya Sharma",     "withdrawal", Decimal("22000.00"),  0.07, "Online purchases"),
            ("TXN-2026-0034", "ACC-10017", "Suresh Babu",       "deposit",    Decimal("95000.00"),  0.08, "Business payment"),
            ("TXN-2026-0035", "ACC-10017", "Suresh Babu",       "withdrawal", Decimal("40000.00"),  0.09, "Supplier payment"),
        ]

        anomaly_reasons = {
            "TXN-2026-0003": "unusually large amount, amount exceeds ₹5,00,000",
            "TXN-2026-0007": "unusually large amount, transaction at unusual hour",
            "TXN-2026-0013": "unusually large amount, amount exceeds ₹5,00,000",
            "TXN-2026-0021": "unusually large amount, transaction at unusual hour, amount exceeds ₹5,00,000",
            "TXN-2026-0029": "unusually large amount, statistical outlier detected",
        }

        for t in transactions_data:
            txn_id, acc, holder, txn_type, amount, score, note = t
            txn = Transaction(
                transaction_id=txn_id,
                account_number=acc,
                holder_name=holder,
                transaction_type=txn_type,
                amount=amount,
                note=note,
                anomaly_score=score,
                anomaly_reason=anomaly_reasons.get(txn_id),
                anomaly_dismissed=False,
                is_deleted=False,
                created_by="USR-2026-0002",
            )
            db.add(txn)

        db.commit()
        print(f"    ✅ {len(transactions_data)} transactions created  (5 flagged as anomalies)")

        # ── 4. LOANS ──────────────────────────────────────────────────────────
        print("🏦  Seeding loans...")

        loans_data = [
            ("LN-2026-0001", "ACC-10001", "Kavin Kumar",       350000.00, 10.5, 32, "active",    date(2024, 4, 1),  date(2027, 4, 1)),
            ("LN-2026-0002", "ACC-10002", "Janakesh Rajan",    500000.00, 11.0, 45, "active",    date(2024, 6, 1),  date(2028, 6, 1)),
            ("LN-2026-0003", "ACC-10003", "Prakash Sundaram",  200000.00, 9.5,  28, "active",    date(2025, 1, 15), date(2027, 1, 15)),
            ("LN-2026-0004", "ACC-10004", "Giftson David",     750000.00, 12.0, 88, "defaulted", date(2023, 8, 1),  date(2026, 8, 1)),
            ("LN-2026-0005", "ACC-10005", "Raj Patel",         150000.00, 8.5,  18, "closed",    date(2022, 3, 1),  date(2025, 3, 1)),
            ("LN-2026-0006", "ACC-10006", "Chatrapathi Reddy", 900000.00, 13.0, 72, "active",    date(2024, 11, 1), date(2029, 11, 1)),
            ("LN-2026-0007", "ACC-10007", "Tharun Kumar",      300000.00, 10.0, 35, "active",    date(2025, 2, 1),  date(2028, 2, 1)),
            ("LN-2026-0008", "ACC-10008", "Jossiah Thomas",    450000.00, 11.5, 55, "active",    date(2024, 9, 1),  date(2028, 9, 1)),
            ("LN-2026-0009", "ACC-10009", "Mohammed Zarif",    250000.00, 9.0,  22, "active",    date(2025, 3, 1),  date(2027, 3, 1)),
            ("LN-2026-0010", "ACC-10010", "Naveendh Krishnan", 600000.00, 12.5, 78, "defaulted", date(2023, 5, 1),  date(2026, 5, 1)),
            ("LN-2026-0011", "ACC-10011", "Arjun Mehta",       180000.00, 8.0,  15, "closed",    date(2022, 1, 1),  date(2025, 1, 1)),
            ("LN-2026-0012", "ACC-10012", "Sneha Iyer",        420000.00, 10.8, 42, "active",    date(2025, 1, 1),  date(2028, 1, 1)),
        ]

        for l in loans_data:
            loan_id, acc, holder, principal, rate, risk, status, start, end = l
            loan = Loan(
                loan_id=loan_id,
                account_number=acc,
                holder_name=holder,
                principal_amount=Decimal(str(principal)),
                interest_rate=Decimal(str(rate)),
                risk_score=Decimal(str(risk)),
                status=status,
                start_date=start,
                end_date=end,
                is_deleted=False,
                created_by="USR-2026-0001",
            )
            db.add(loan)

        db.commit()
        print(f"    ✅ {len(loans_data)} loans created  (7 active, 2 defaulted, 3 closed)")

        # ── 5. DEPOSITS ───────────────────────────────────────────────────────
        print("💰  Seeding deposits...")

        deposits_data = [
            ("DEP-2026-0001", "ACC-10001", "Kavin Kumar",       "fixed",   100000.00, 7.0,  "active",    date(2025, 1, 1),  date(2026, 1, 1)),
            ("DEP-2026-0002", "ACC-10002", "Janakesh Rajan",    "savings", 250000.00, 4.5,  "active",    date(2024, 6, 1),  None),
            ("DEP-2026-0003", "ACC-10003", "Prakash Sundaram",  "fixed",   500000.00, 7.5,  "matured",   date(2023, 3, 1),  date(2025, 3, 1)),
            ("DEP-2026-0004", "ACC-10004", "Giftson David",     "savings", 75000.00,  4.0,  "active",    date(2025, 2, 1),  None),
            ("DEP-2026-0005", "ACC-10005", "Raj Patel",         "fixed",   200000.00, 7.2,  "active",    date(2025, 4, 1),  date(2027, 4, 1)),
            ("DEP-2026-0006", "ACC-10006", "Chatrapathi Reddy", "fixed",   350000.00, 7.8,  "active",    date(2024, 8, 1),  date(2026, 8, 1)),
            ("DEP-2026-0007", "ACC-10007", "Tharun Kumar",      "savings", 120000.00, 4.5,  "active",    date(2024, 11, 1), None),
            ("DEP-2026-0008", "ACC-10008", "Jossiah Thomas",    "fixed",   450000.00, 7.5,  "withdrawn", date(2022, 5, 1),  date(2024, 5, 1)),
            ("DEP-2026-0009", "ACC-10009", "Mohammed Zarif",    "savings", 180000.00, 4.0,  "active",    date(2025, 1, 15), None),
            ("DEP-2026-0010", "ACC-10010", "Naveendh Krishnan", "fixed",   300000.00, 7.3,  "active",    date(2025, 3, 1),  date(2027, 3, 1)),
            ("DEP-2026-0011", "ACC-10011", "Arjun Mehta",       "fixed",   150000.00, 6.8,  "matured",   date(2023, 1, 1),  date(2025, 1, 1)),
            ("DEP-2026-0012", "ACC-10012", "Sneha Iyer",        "savings", 95000.00,  4.5,  "active",    date(2024, 7, 1),  None),
        ]

        for d in deposits_data:
            dep_id, acc, holder, dep_type, principal, rate, status, start, maturity = d
            deposit = Deposit(
                deposit_id=dep_id,
                account_number=acc,
                holder_name=holder,
                deposit_type=dep_type,
                principal=Decimal(str(principal)),
                interest_rate=Decimal(str(rate)),
                status=status,
                start_date=start,
                maturity_date=maturity,
                is_deleted=False,
                created_by="USR-2026-0003",
            )
            db.add(deposit)

        db.commit()
        print(f"    ✅ {len(deposits_data)} deposits created  (7 fixed, 5 savings)")

        # ── 6. INVESTMENTS ────────────────────────────────────────────────────
        print("📈  Seeding investments...")

        investments_data = [
            ("INV-2026-0001", "ACC-10001", "Kavin Kumar",       "govt_bond",      200000.00, 6.5,  "active",    date(2025, 1, 1),  date(2030, 1, 1)),
            ("INV-2026-0002", "ACC-10002", "Janakesh Rajan",    "mutual_fund",    150000.00, 12.0, "active",    date(2024, 6, 1),  date(2027, 6, 1)),
            ("INV-2026-0003", "ACC-10003", "Prakash Sundaram",  "fixed_deposit",  300000.00, 7.5,  "active",    date(2025, 2, 1),  date(2027, 2, 1)),
            ("INV-2026-0004", "ACC-10005", "Raj Patel",         "govt_bond",      500000.00, 7.0,  "active",    date(2024, 4, 1),  date(2034, 4, 1)),
            ("INV-2026-0005", "ACC-10006", "Chatrapathi Reddy", "mutual_fund",    250000.00, 14.0, "active",    date(2025, 3, 1),  date(2028, 3, 1)),
            ("INV-2026-0006", "ACC-10008", "Jossiah Thomas",    "fixed_deposit",  180000.00, 7.2,  "matured",   date(2023, 1, 1),  date(2025, 1, 1)),
            ("INV-2026-0007", "ACC-10010", "Naveendh Krishnan", "mutual_fund",    400000.00, 11.5, "active",    date(2024, 9, 1),  date(2027, 9, 1)),
            ("INV-2026-0008", "ACC-10011", "Arjun Mehta",       "govt_bond",      350000.00, 6.8,  "active",    date(2025, 1, 15), date(2032, 1, 15)),
            ("INV-2026-0009", "ACC-10013", "Vikram Nair",       "mutual_fund",    120000.00, 13.0, "liquidated",date(2022, 6, 1),  date(2024, 6, 1)),
            ("INV-2026-0010", "ACC-10015", "Rohan Pillai",      "fixed_deposit",  220000.00, 7.4,  "active",    date(2025, 4, 1),  date(2027, 4, 1)),
        ]

        for i in investments_data:
            inv_id, acc, holder, inv_type, amount, rate, status, start, end = i
            investment = Investment(
                investment_id=inv_id,
                account_number=acc,
                holder_name=holder,
                investment_type=inv_type,
                amount=Decimal(str(amount)),
                interest_rate=Decimal(str(rate)),
                status=status,
                start_date=start,
                end_date=end,
                is_deleted=False,
                created_by="USR-2026-0004",
            )
            db.add(investment)

        db.commit()
        print(f"    ✅ {len(investments_data)} investments created  (7 active, 1 matured, 1 liquidated)")

        # ── 7. AUDIT LOGS ─────────────────────────────────────────────────────
        print("📋  Seeding audit logs...")

        audit_entries = [
            AuditLog(table_name="users",        record_id="USR-2026-0001", action="create", performed_by="USR-2026-0001", performed_by_name="Arjun Sharma",    ip_address="192.168.1.1"),
            AuditLog(table_name="users",        record_id="USR-2026-0002", action="create", performed_by="USR-2026-0001", performed_by_name="Arjun Sharma",    ip_address="192.168.1.1"),
            AuditLog(table_name="users",        record_id="USR-2026-0003", action="create", performed_by="USR-2026-0001", performed_by_name="Arjun Sharma",    ip_address="192.168.1.1"),
            AuditLog(table_name="users",        record_id="USR-2026-0004", action="create", performed_by="USR-2026-0001", performed_by_name="Arjun Sharma",    ip_address="192.168.1.1"),
            AuditLog(table_name="users",        record_id="USR-2026-0005", action="create", performed_by="USR-2026-0001", performed_by_name="Arjun Sharma",    ip_address="192.168.1.1"),
            AuditLog(table_name="users",        record_id="USR-2026-0001", action="login",  performed_by="USR-2026-0001", performed_by_name="Arjun Sharma",    ip_address="192.168.1.1"),
            AuditLog(table_name="transactions", record_id="TXN-2026-0001", action="create", performed_by="USR-2026-0002", performed_by_name="Priya Singh",     ip_address="192.168.1.2"),
            AuditLog(table_name="transactions", record_id="TXN-2026-0007", action="create", performed_by="USR-2026-0003", performed_by_name="Rahul Verma",     ip_address="192.168.1.3"),
            AuditLog(table_name="transactions", record_id="TXN-2026-0013", action="create", performed_by="USR-2026-0002", performed_by_name="Priya Singh",     ip_address="192.168.1.2"),
            AuditLog(table_name="loans",        record_id="LN-2026-0001",  action="create", performed_by="USR-2026-0001", performed_by_name="Arjun Sharma",    ip_address="192.168.1.1"),
            AuditLog(table_name="loans",        record_id="LN-2026-0004",  action="update", performed_by="USR-2026-0001", performed_by_name="Arjun Sharma",    ip_address="192.168.1.1"),
            AuditLog(table_name="deposits",     record_id="DEP-2026-0001", action="create", performed_by="USR-2026-0003", performed_by_name="Rahul Verma",     ip_address="192.168.1.3"),
            AuditLog(table_name="investments",  record_id="INV-2026-0001", action="create", performed_by="USR-2026-0004", performed_by_name="Sneha Patel",     ip_address="192.168.1.4"),
            AuditLog(table_name="users",        record_id="USR-2026-0002", action="login",  performed_by="USR-2026-0002", performed_by_name="Priya Singh",     ip_address="192.168.1.2"),
            AuditLog(table_name="users",        record_id="USR-2026-0005", action="login",  performed_by="USR-2026-0005", performed_by_name="Mohammed Farhan", ip_address="192.168.1.5"),
        ]

        db.add_all(audit_entries)
        db.commit()
        print(f"    ✅ {len(audit_entries)} audit log entries created")

        # ── Done ──────────────────────────────────────────────────────────────
        print()
        print("=" * 50)
        print("✅  SEED COMPLETE — BranchIQ database is ready")
        print("=" * 50)
        print()
        print("  Login credentials:")
        print("  ┌─────────────────────┬──────────────┬──────────────┐")
        print("  │ Full Name           │ Username     │ Password     │")
        print("  ├─────────────────────┼──────────────┼──────────────┤")
        print(f"  │ Arjun Sharma        │ arjun.manager│ {default_password:<12} │")
        print(f"  │ Priya Singh         │ priya.staff  │ {default_password:<12} │")
        print(f"  │ Rahul Verma         │ rahul.staff  │ {default_password:<12} │")
        print(f"  │ Sneha Patel         │ sneha.staff  │ {default_password:<12} │")
        print(f"  │ Mohammed Farhan     │ farhan.staff │ {default_password:<12} │")
        print("  └─────────────────────┴──────────────┴──────────────┘")
        print()

    except Exception as e:
        db.rollback()
        print(f"\n❌  Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
