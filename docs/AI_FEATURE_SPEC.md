# AI Feature Specification Document
## BranchIQ — AI-Powered Branch Banking Management System

**Version:** 1.0 | **Date:** 2026-04-19 | **Status:** Draft

---

## DOCUMENT PURPOSE

This document defines every AI feature in BranchIQ — how each algorithm works, what data it uses, how results are stored and displayed, and how the frontend and backend connect. This is the implementation blueprint for the AI module. Any developer reading this should be able to build every AI feature from scratch using only this document.

---

## AI FEATURES OVERVIEW

| Feature | Algorithm | Trigger | Who Can Use |
|---|---|---|---|
| Anomaly Detection | Isolation Forest + Rule-Based | Manual (Run Analysis button) | All staff |
| Loan Default Risk Scoring | Weighted Heuristic Model | Auto on every analysis run | All staff (view) |
| Spending Insights | pandas aggregations | Auto on every analysis run | All staff |
| Monthly Comparison | Percentage change calculations | Auto on every analysis run | All staff |
| Year-over-Year Comparison | pandas groupby + date logic | Auto on every analysis run | All staff |
| Peak Transaction Hours | pandas groupby hour | Auto on every analysis run | All staff |
| Busiest Day of Week | pandas groupby weekday | Auto on every analysis run | All staff |
| Dormant Account Detection | Date comparison filter | Auto on every analysis run | All staff |
| Trend Alerts | Rule-based threshold checks | Auto on every analysis run | All staff |
| Analysis History | Database storage | Saved automatically | All staff (view), Manager (dismiss flags) |

---

# PART 1 — ANOMALY DETECTION

---

## 1.1 Overview

Anomaly detection identifies transactions that are statistically unusual compared to the branch's historical patterns. It combines two approaches:

1. **Machine Learning (Isolation Forest)** — learns what "normal" looks like from historical data and scores each transaction
2. **Rule-Based Checks** — hard-coded rules that flag transactions regardless of ML score

A transaction is flagged if **either** the ML score exceeds the threshold **OR** any rule is triggered.

---

## 1.2 Algorithm — Isolation Forest

**Library:** `sklearn.ensemble.IsolationForest`  
**Why Isolation Forest:** Designed specifically for anomaly detection. Works on unlabeled data (no need for pre-labeled "bad" transactions). Efficient on small-to-medium datasets.

### Input Features (columns fed to the model)

| Feature | How it's calculated | Why it matters |
|---|---|---|
| `amount` | Raw transaction amount in INR | Large or tiny amounts are unusual |
| `hour_of_day` | Hour extracted from transaction_date (0–23) | 2am transactions are suspicious |
| `day_of_week` | Day extracted from transaction_date (0=Mon, 6=Sun) | Weekend transactions may be unusual |
| `amount_vs_account_avg` | amount / mean(amount) for that account | 10x above an account's own average |
| `amount_vs_global_avg` | amount / mean(amount) for all transactions | Compared to entire branch baseline |
| `transactions_in_30min` | Count of transactions on same account within 30 mins before this one | Rapid-fire detection |

### Model Configuration
```python
from sklearn.ensemble import IsolationForest

model = IsolationForest(
    n_estimators=100,       # 100 trees — good balance of accuracy vs speed
    contamination=0.05,     # Expect ~5% of transactions to be anomalies
    random_state=42,        # Reproducible results
    max_samples='auto'
)
```

### Scoring Logic
```python
# IsolationForest returns -1 (anomaly) or 1 (normal)
# We convert to a 0–1 score for display purposes

raw_scores = model.decision_function(X)  # lower = more anomalous
anomaly_scores = 1 - (raw_scores - raw_scores.min()) / (raw_scores.max() - raw_scores.min())
# anomaly_scores: 0.0 = perfectly normal, 1.0 = maximum anomaly

THRESHOLD = 0.60  # Flag if score >= 0.60
```

### Score Colour Coding (UI)
| Score Range | Colour | Label |
|---|---|---|
| 0.00 – 0.49 | Gray | Normal |
| 0.50 – 0.69 | Amber `#F59E0B` | Suspicious |
| 0.70 – 0.89 | Orange `#EA580C` | Likely Anomaly |
| 0.90 – 1.00 | Red `#DC2626` | High Risk Anomaly |

---

## 1.3 Rule-Based Hard Checks

These rules run independently of the ML model. If any rule matches, the transaction is flagged **regardless of anomaly score**.

### Active Rules (3 rules selected)

**Rule 1 — Large Amount**
```python
LARGE_AMOUNT_THRESHOLD = 500000  # ₹5,00,000

def rule_large_amount(transaction):
    if transaction['amount'] >= LARGE_AMOUNT_THRESHOLD:
        return True, "Transaction amount exceeds ₹5,00,000 threshold"
    return False, None
```

**Rule 2 — Rapid Fire**
```python
RAPID_FIRE_COUNT = 3       # 3 or more transactions
RAPID_FIRE_WINDOW = 30     # within 30 minutes

def rule_rapid_fire(transaction, all_transactions):
    same_account = all_transactions[
        all_transactions['account_number'] == transaction['account_number']
    ]
    window_start = transaction['transaction_date'] - timedelta(minutes=RAPID_FIRE_WINDOW)
    recent = same_account[same_account['transaction_date'] >= window_start]
    if len(recent) >= RAPID_FIRE_COUNT:
        return True, f"3+ transactions on same account within 30 minutes"
    return False, None
```

**Rule 3 — Suspicious Round Number**
```python
ROUND_NUMBER_AMOUNTS = [100000, 200000, 300000, 400000, 500000,
                         600000, 700000, 800000, 900000, 1000000]
# ₹1L, ₹2L, ₹3L ... ₹10L exactly

def rule_round_number(transaction):
    if transaction['amount'] in ROUND_NUMBER_AMOUNTS:
        return True, f"Exact round number amount (₹{transaction['amount']:,.0f}) — common in structured transactions"
    return False, None
```

---

## 1.4 Combined Detection Logic

```python
def run_anomaly_detection(transactions_df):
    results = []

    # Step 1: Prepare features
    X = prepare_features(transactions_df)  # returns feature matrix

    # Step 2: Train Isolation Forest on historical data
    model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
    model.fit(X)

    # Step 3: Score all transactions
    raw_scores = model.decision_function(X)
    anomaly_scores = normalise_scores(raw_scores)

    for i, txn in transactions_df.iterrows():
        is_anomaly = False
        reasons = []
        score = float(anomaly_scores[i])

        # ML check
        if score >= 0.60:
            is_anomaly = True
            reasons.append(f"Statistical anomaly detected (score: {score:.2f})")

        # Rule checks
        triggered, reason = rule_large_amount(txn)
        if triggered:
            is_anomaly = True
            reasons.append(reason)

        triggered, reason = rule_rapid_fire(txn, transactions_df)
        if triggered:
            is_anomaly = True
            reasons.append(reason)

        triggered, reason = rule_round_number(txn)
        if triggered:
            is_anomaly = True
            reasons.append(reason)

        results.append({
            'transaction_id': txn['transaction_id'],
            'is_anomaly': is_anomaly,
            'anomaly_score': score,
            'anomaly_reason_plain': ' | '.join(reasons),  # shown to staff
            'anomaly_reason_technical': f"IF Score: {score:.4f}, Rules triggered: {len([r for r in [rule_large_amount(txn), rule_rapid_fire(txn, transactions_df), rule_round_number(txn)] if r[0]])}"
        })

    return results
```

---

## 1.5 Minimum Data Threshold

```python
MINIMUM_TRANSACTIONS = 50

def check_data_sufficiency(transaction_count):
    if transaction_count < MINIMUM_TRANSACTIONS:
        return {
            "sufficient": False,
            "warning": f"Only {transaction_count} transactions found. "
                       f"Analysis will run but results may not be accurate until "
                       f"at least {MINIMUM_TRANSACTIONS} transactions are recorded.",
            "warning_type": "low_data"
        }
    return {"sufficient": True, "warning": None}
```

**Frontend behaviour:** Show yellow warning banner above results:  
*"⚠ Low data warning — Only 23 transactions analysed. Results may not be accurate yet. Accuracy improves with more data."*

---

## 1.6 Anomaly Dismissal (Manager Only)

When a manager reviews a flagged transaction and decides it is legitimate:

**API Call:** `PATCH /api/v1/transactions/{transaction_id}/dismiss-anomaly`  
**Access:** Manager only

```json
Request body:
{
  "dismissed": true
}

Response:
{
  "success": true,
  "message": "Anomaly flag dismissed",
  "data": {
    "transaction_id": "TXN-2026-0138",
    "anomaly_dismissed": true,
    "dismissed_by": "USR-2026-0001",
    "dismissed_at": "2026-04-19T14:30:00"
  }
}
```

**Database fields added to `transactions` table:**

| Column | Type | Description |
|---|---|---|
| `is_anomaly` | BOOLEAN DEFAULT FALSE | Set by AI analysis |
| `anomaly_score` | NUMERIC(5,4) NULLABLE | 0.0 – 1.0 score |
| `anomaly_reason_plain` | TEXT NULLABLE | Plain English for staff |
| `anomaly_reason_technical` | TEXT NULLABLE | Technical details for manager |
| `anomaly_dismissed` | BOOLEAN DEFAULT FALSE | True = manager reviewed + cleared |
| `dismissed_by` | VARCHAR(20) FK → users | Manager who dismissed |
| `dismissed_at` | TIMESTAMP NULLABLE | When dismissed |

**UI Behaviour:**
- Dismissed transactions: removed from anomaly list, row returns to normal white (no red highlight)
- Manager sees a "Dismissed" filter tab to view previously cleared flags
- Dismissal is logged in `audit_logs`

---

# PART 2 — LOAN DEFAULT RISK SCORING

---

## 2.1 Overview

Every active loan gets a risk score from 0–100 after each analysis run. This is a weighted heuristic model — not pure ML — because with a small single-branch dataset, a trained classifier would not have enough labeled examples to be reliable.

**Score meaning:**
- 0–30: Low risk (green) — payments on track
- 31–60: Medium risk (amber) — some irregularity, watch this loan
- 61–100: High risk (red) — strong default indicators

---

## 2.2 Scoring Formula

```python
def calculate_loan_risk_score(loan, repayments_df):
    score = 0

    # Factor 1 — Days since last payment (30% weight, max 30 points)
    days_since_payment = (today - last_payment_date).days
    if days_since_payment <= 30:
        score += 0
    elif days_since_payment <= 60:
        score += 10
    elif days_since_payment <= 90:
        score += 20
    else:
        score += 30  # 90+ days overdue = max risk on this factor

    # Factor 2 — Payment consistency (25% weight, max 25 points)
    # How regular are payments? Calculate std deviation of payment intervals
    payment_intervals = calculate_intervals(repayments_df)
    consistency_cv = std(payment_intervals) / mean(payment_intervals)  # coefficient of variation
    score += min(25, int(consistency_cv * 25))

    # Factor 3 — Outstanding balance ratio (25% weight, max 25 points)
    # How much of the loan is still unpaid relative to elapsed time
    elapsed_ratio = days_elapsed / total_loan_days
    paid_ratio = total_paid / (principal * expected_at_elapsed_time)
    if paid_ratio >= elapsed_ratio:
        score += 0   # paying ahead of schedule
    else:
        deficit = elapsed_ratio - paid_ratio
        score += min(25, int(deficit * 100))

    # Factor 4 — Missed payments count (20% weight, max 20 points)
    expected_payments = int(days_elapsed / 30)  # one per month expected
    actual_payments = len(repayments_df)
    missed = max(0, expected_payments - actual_payments)
    score += min(20, missed * 5)

    return min(100, score)
```

---

## 2.3 Risk Display in UI

**On Loans Page:** Add a "Risk Score" column to the loans table
- 0–30: green badge "Low Risk"
- 31–60: amber badge "Medium Risk"  
- 61–100: red badge "High Risk"

**On Loan Detail Page:** Show the risk score prominently with a breakdown of which factors contributed

**On AI Insights Page:** Show top 3 highest-risk loans in a dedicated card with their scores and primary risk reason

---

# PART 3 — SPENDING INSIGHTS

---

## 3.1 Monthly Comparison (Month-over-Month)

```python
def monthly_comparison_mom(transactions_df, target_month, target_year):
    this_month = transactions_df[
        (transactions_df['month'] == target_month) &
        (transactions_df['year'] == target_year)
    ]
    last_month_date = target_month - 1 if target_month > 1 else 12
    last_month_year = target_year if target_month > 1 else target_year - 1
    last_month = transactions_df[
        (transactions_df['month'] == last_month_date) &
        (transactions_df['year'] == last_month_year)
    ]

    categories = ['deposit', 'withdrawal', 'loan_repayment', 'transfer']
    result = {}
    for cat in categories:
        this = this_month[this_month['type'] == cat]['amount'].sum()
        prev = last_month[last_month['type'] == cat]['amount'].sum()
        change_pct = ((this - prev) / prev * 100) if prev > 0 else 0
        result[cat] = {
            'this_month': float(this),
            'last_month': float(prev),
            'change_pct': round(change_pct, 1),
            'direction': 'up' if change_pct > 0 else 'down'
        }
    return result
```

---

## 3.2 Year-over-Year Comparison

```python
def monthly_comparison_yoy(transactions_df, target_month, target_year):
    this_month = transactions_df[
        (transactions_df['month'] == target_month) &
        (transactions_df['year'] == target_year)
    ]
    same_month_last_year = transactions_df[
        (transactions_df['month'] == target_month) &
        (transactions_df['year'] == target_year - 1)
    ]
    # Same structure as MoM but comparing to same month last year
    # Returns "Not enough data" if last year data doesn't exist
```

**UI Note:** If year-over-year data doesn't exist yet (system < 1 year old), show:  
*"Year-over-year comparison will be available after 12 months of data"*

---

## 3.3 Trend Alerts (Auto-Generated Text)

```python
TREND_THRESHOLD = 15.0  # % change that triggers an alert

def generate_trend_alerts(comparison_data):
    alerts = []

    for category, data in comparison_data.items():
        change = data['change_pct']
        label = category.replace('_', ' ').title()

        if abs(change) >= TREND_THRESHOLD:
            direction = "increased" if change > 0 else "decreased"
            severity = "⚠" if abs(change) >= 30 else "ℹ"
            alerts.append({
                "text": f"{severity} {label} {direction} {abs(change):.1f}% compared to last month",
                "severity": "warning" if abs(change) >= 30 else "info",
                "category": category,
                "change_pct": change
            })

    return sorted(alerts, key=lambda x: abs(x['change_pct']), reverse=True)
```

---

## 3.4 Peak Transaction Hours

```python
def peak_transaction_hours(transactions_df):
    transactions_df['hour'] = transactions_df['transaction_date'].dt.hour
    hourly = transactions_df.groupby('hour').size().reset_index(name='count')
    peak_hour = hourly.loc[hourly['count'].idxmax(), 'hour']

    return {
        "hourly_data": hourly.to_dict('records'),  # for bar chart
        "peak_hour": peak_hour,
        "peak_hour_label": f"{peak_hour:02d}:00 – {peak_hour+1:02d}:00",
        "peak_count": int(hourly['count'].max())
    }
```

**Display:** Horizontal bar chart — 24 hours on Y axis, transaction count on X axis. Highlight peak hour bar in navy.

---

## 3.5 Busiest Day of Week

```python
def busiest_day_of_week(transactions_df):
    day_names = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
    transactions_df['weekday'] = transactions_df['transaction_date'].dt.weekday
    daily = transactions_df.groupby('weekday').size().reset_index(name='count')
    daily['day_name'] = daily['weekday'].map(lambda x: day_names[x])
    busiest = daily.loc[daily['count'].idxmax(), 'day_name']

    return {
        "daily_data": daily[['day_name','count']].to_dict('records'),
        "busiest_day": busiest,
        "busiest_count": int(daily['count'].max())
    }
```

**Display:** Bar chart — 7 bars (Mon–Sun), highlight busiest bar in navy.

---

## 3.6 Dormant Account Detection

```python
DORMANT_DAYS = 30  # No activity in 30+ days

def detect_dormant_accounts(transactions_df, loan_accounts_df):
    today = pd.Timestamp.now()
    last_activity = transactions_df.groupby('account_number')['transaction_date'].max()

    dormant = []
    for _, account in loan_accounts_df.iterrows():
        acc_no = account['account_number']
        if acc_no not in last_activity.index:
            days_dormant = (today - account['created_at']).days
        else:
            days_dormant = (today - last_activity[acc_no]).days

        if days_dormant >= DORMANT_DAYS and account['is_active']:
            dormant.append({
                'account_number': acc_no,
                'holder_name': account['holder_name'],
                'days_dormant': int(days_dormant),
                'last_activity': str(last_activity.get(acc_no, 'Never'))
            })

    return sorted(dormant, key=lambda x: x['days_dormant'], reverse=True)
```

**Display:** Table on AI Insights page — Account No. | Holder Name | Days Dormant | Last Activity.  
Amber badge if 30–60 days, red badge if 60+ days.

---

# PART 4 — ANALYSIS HISTORY

---

## 4.1 Storage

Each time analysis is run, a record is saved to a new table `ai_analysis_runs`.

**New table: `ai_analysis_runs`**

| Column | Type | Description |
|---|---|---|
| `id` | SERIAL PRIMARY KEY | Internal ID |
| `run_id` | VARCHAR(20) | Formatted: `AI-2026-0001` |
| `run_by` | VARCHAR(20) FK → users | Who triggered the run |
| `run_at` | TIMESTAMP DEFAULT NOW() | When it ran |
| `transactions_scanned` | INTEGER | Total transactions analysed |
| `anomalies_found` | INTEGER | Count of flagged transactions |
| `loans_scored` | INTEGER | Count of loans risk-scored |
| `dormant_accounts` | INTEGER | Count of dormant accounts found |
| `low_data_warning` | BOOLEAN DEFAULT FALSE | True if < 50 transactions |
| `summary_json` | JSONB | Full insights snapshot for this run |

**Retention:** Last 10 runs kept. When 11th run is saved, oldest is deleted automatically.

---

## 4.2 History Display (AI Insights Page)

**"Analysis History" section** at bottom of AI Insights page:

| Run | Date & Time | By | Transactions | Anomalies | Status |
|---|---|---|---|---|---|
| AI-2026-0008 | 19 Apr 2026 14:30 | Priya S. | 512 | 3 | ✅ Complete |
| AI-2026-0007 | 18 Apr 2026 09:15 | Arjun M. | 508 | 1 | ✅ Complete |

Clicking a row expands it to show the full snapshot of insights from that run.

---

# PART 5 — DATA FLOW (End to End)

---

## 5.1 Analysis Trigger Flow

```
User clicks "Run Analysis"
    ↓
POST /api/v1/ai/run-analysis
    ↓
Backend: fetch all non-deleted transactions from PostgreSQL
    ↓
Backend: fetch all active loan accounts
    ↓
Backend: fetch all active loans + repayment history
    ↓
pandas DataFrame created from raw data
    ↓
check_data_sufficiency() → set warning flag if needed
    ↓
run_anomaly_detection() → scores + rule flags for each transaction
    ↓
calculate_loan_risk_score() → risk score for each active loan
    ↓
monthly_comparison_mom() + monthly_comparison_yoy()
    ↓
generate_trend_alerts()
    ↓
peak_transaction_hours() + busiest_day_of_week()
    ↓
detect_dormant_accounts()
    ↓
All results written back to PostgreSQL:
  - transactions.is_anomaly, anomaly_score, anomaly_reason_*
  - loans.risk_score, risk_label
  - New row in ai_analysis_runs
    ↓
Response sent to frontend with full results
    ↓
Frontend: page refreshes, banner appears if anomalies found
```

---

## 5.2 Python Dependencies

```
scikit-learn>=1.3.0    # IsolationForest
pandas>=2.0.0          # Data manipulation
numpy>=1.24.0          # Numerical operations
scipy>=1.11.0          # Statistical functions
```

---

## 5.3 Performance Expectations

| Data Size | Expected Run Time |
|---|---|
| < 500 transactions | < 2 seconds |
| 500 – 2,000 transactions | 2 – 5 seconds |
| 2,000 – 10,000 transactions | 5 – 10 seconds |
| > 10,000 transactions | May need background job (future v2) |

For v1 (single branch, < 1 year of data): expect < 5 seconds consistently.

---

# PART 6 — API ENDPOINTS (AI Module)

---

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | /api/v1/ai/run-analysis | ALL | Trigger full analysis run |
| GET | /api/v1/ai/anomalies | ALL | Get flagged transactions (latest run) |
| GET | /api/v1/ai/insights | ALL | Get all spending insights (latest run) |
| GET | /api/v1/ai/risk-scores | ALL | Get loan risk scores |
| GET | /api/v1/ai/history | ALL | Get last 10 analysis run summaries |
| GET | /api/v1/ai/history/{run_id} | ALL | Get full snapshot of a specific run |
| PATCH | /api/v1/transactions/{id}/dismiss-anomaly | MGR | Dismiss a flagged transaction |

---

# PART 7 — ACCURACY & LIMITATIONS

---

| Limitation | Impact | Mitigation |
|---|---|---|
| Small dataset (< 50 transactions) | Low accuracy, many false positives | Low data warning shown |
| No labeled training data | Can't train supervised classifier | Isolation Forest + rules work without labels |
| No historical baseline (new system) | Year-over-year unavailable | Show "insufficient data" message |
| Single branch = small volume | Model may not generalise | Contamination parameter tuned conservatively (5%) |
| Round number rule | Legitimate transactions may be flagged | Manager can dismiss with one click |

---

*End of AI Feature Specification v1.0*
