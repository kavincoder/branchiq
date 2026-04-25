import os
import joblib
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List

import numpy as np
from sklearn.ensemble import IsolationForest
from sqlalchemy.orm import Session

from app.models.transaction import Transaction

MODEL_PATH = os.path.join(os.path.dirname(__file__), "anomaly_model.pkl")
_cached_model = None
_cached_txn_count = 0


# ── Anomaly reason generator ──────────────────────────────────────────────────

def _anomaly_reason(amount: float, hour: int, avg_amount: float) -> str:
    reasons = []
    if amount > avg_amount * 5:
        reasons.append("unusually large amount")
    if hour < 6 or hour >= 22:
        reasons.append("transaction at unusual hour")
    if amount > 500_000:
        reasons.append("amount exceeds ₹5,00,000")
    return ", ".join(reasons) if reasons else "statistical outlier detected"


def _load_model():
    """Load cached model from disk if it exists."""
    global _cached_model
    if _cached_model is None and os.path.exists(MODEL_PATH):
        try:
            _cached_model = joblib.load(MODEL_PATH)
        except Exception:
            _cached_model = None
    return _cached_model


def _save_model(model):
    """Persist model to disk and update in-memory cache."""
    global _cached_model
    _cached_model = model
    try:
        joblib.dump(model, MODEL_PATH)
    except Exception:
        pass  # saving is best-effort — analysis still completes


# ── Main analysis function ────────────────────────────────────────────────────

def run_analysis(db: Session) -> Dict[str, Any]:
    global _cached_txn_count

    transactions = (
        db.query(Transaction)
        .filter(Transaction.is_deleted == False)
        .all()
    )

    if len(transactions) < 10:
        return {
            "transactions_scanned": len(transactions),
            "anomalies_found": 0,
            "message": "Not enough data — need at least 10 transactions",
        }

    amounts    = np.array([float(t.amount) for t in transactions], dtype=float)
    avg_amount = float(amounts.mean())

    features = []
    for t in transactions:
        hour = t.created_at.astimezone(timezone.utc).hour if t.created_at else 12
        features.append([float(t.amount), hour])

    X = np.array(features, dtype=float)

    current_count = len(transactions)
    model = _load_model()

    # Retrain only when the transaction count has changed since last training
    if model is None or current_count != _cached_txn_count:
        model = IsolationForest(contamination=0.08, random_state=42)
        model.fit(X)
        _cached_txn_count = current_count
        _save_model(model)

    raw_scores = model.predict(X)
    decision   = model.decision_function(X)

    # Normalise decision scores to 0.0–1.0 (higher = more anomalous)
    d_min, d_max = decision.min(), decision.max()
    if d_max - d_min == 0 or np.isnan(d_max) or np.isnan(d_min):
        normalised = np.zeros(len(decision))
    else:
        normalised = 1.0 - (decision - d_min) / (d_max - d_min)
        normalised = np.clip(normalised, 0.0, 1.0)

    anomalies_found = 0
    for i, txn in enumerate(transactions):
        score = round(float(normalised[i]), 4)
        txn.anomaly_score = score

        if raw_scores[i] == -1:
            hour = features[i][1]
            txn.anomaly_reason = _anomaly_reason(txn.amount, hour, avg_amount)
            anomalies_found += 1
        else:
            txn.anomaly_reason = None

    db.commit()

    return {
        "transactions_scanned": len(transactions),
        "anomalies_found": anomalies_found,
        "avg_amount": round(avg_amount, 2),
    }


# ── Dormant accounts ──────────────────────────────────────────────────────────

def get_dormant_accounts(db: Session, days: int = 30) -> List[Dict[str, Any]]:
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    active_txns = (
        db.query(Transaction.account_number, Transaction.holder_name)
        .filter(
            Transaction.is_deleted == False,
            Transaction.created_at >= cutoff,
        )
        .distinct()
        .all()
    )
    active_accounts = {row.account_number for row in active_txns}

    all_accounts = (
        db.query(Transaction.account_number, Transaction.holder_name)
        .filter(Transaction.is_deleted == False)
        .distinct()
        .all()
    )

    dormant = []
    for row in all_accounts:
        if row.account_number not in active_accounts:
            last_txn = (
                db.query(Transaction)
                .filter(
                    Transaction.account_number == row.account_number,
                    Transaction.is_deleted == False,
                )
                .order_by(Transaction.created_at.desc())
                .first()
            )
            if last_txn and last_txn.created_at:
                last_dt = last_txn.created_at.astimezone(timezone.utc)
                days_dormant = (datetime.now(timezone.utc) - last_dt).days
            else:
                days_dormant = days

            dormant.append({
                "account_number": row.account_number,
                "holder_name":    row.holder_name,
                "days_dormant":   days_dormant,
            })

    return sorted(dormant, key=lambda x: x["days_dormant"], reverse=True)
