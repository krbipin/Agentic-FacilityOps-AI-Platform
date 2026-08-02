"""Maintenance Agent: asset health monitoring + predictive failure risk.

RandomForest scores failure risk per asset from health_score, useful_life_pct,
days-since-maintenance and asset type. Risk is normalized to 0-99 from the raw
model output (no anchor). Downtime reduction is derived from work-order cycle
comparisons.
"""
from __future__ import annotations

from datetime import datetime, timedelta

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sqlalchemy.orm import Session

from ..cache import cached
from ..config_store import config_float, get_config
from ..models import Asset, MaintenanceRecord, WorkOrder
from .base import SEED


def _compute(session: Session, facility_id: int) -> dict:
    cfg = get_config(session)
    rate = config_float(cfg, "cost.hourly_rate", 160.0)

    rows = (
        session.query(
            Asset.id,
            Asset.name,
            Asset.asset_type,
            Asset.status,
            Asset.health_score,
            Asset.useful_life_pct,
            Asset.last_maintenance,
        )
        .filter(Asset.facility_id == facility_id)
        .all()
    )
    df = pd.DataFrame(
        [
            {
                "id": r.id,
                "name": r.name,
                "asset_type": r.asset_type,
                "status": r.status,
                "health_score": r.health_score,
                "useful_life_pct": r.useful_life_pct,
                "days_since": (datetime.utcnow().date() - (r.last_maintenance or datetime.utcnow().date())).days,
            }
            for r in rows
        ]
    )

    if df.empty:
        return {
            "agent": "Maintenance Agent",
            "assets_monitored": 0,
            "maintenance_tickets": 0,
            "predicted_failures": 0,
            "downtime_reduction_pct": 0,
            "health_distribution": {"Excellent": 0, "Good": 0, "Warning": 0, "Critical": 0},
            "predicted": [],
            "spend_mtd": 0,
            "cost_avoided": 0,
            "mttr_hours": 0.0,
            "asset_classes": 0,
            "new_this_week": 0,
            "backlog": 0,
            "attention": 0,
            "improved": False,
        }

    types = sorted(df["asset_type"].unique())
    X = pd.get_dummies(df[["health_score", "useful_life_pct", "days_since"]], columns=[])
    for t in types:
        X[f"type_{t}"] = (df["asset_type"] == t).astype(int)

    y = 100.0 - df["health_score"]
    model = RandomForestRegressor(n_estimators=120, max_depth=6, random_state=SEED, n_jobs=-1)
    model.fit(X, y)
    raw = model.predict(X)
    peak = float(np.max(raw)) if len(raw) else 1.0
    risk = np.clip(raw / (peak or 1.0) * 99.0, 0.0, 99.0)
    df["risk"] = np.round(risk, 1)
    ranked = df.sort_values("risk", ascending=False)

    def days_to_failure(r) -> int:
        if r["status"] == "Critical":
            return 2
        if r["status"] == "Warning":
            return int(round(r["risk"] / 8)) or 4
        return int(round(r["risk"] / 3)) or 10

    predicted = [
        {
            "asset_id": r["id"],
            "name": r["name"],
            "asset_type": r["asset_type"],
            "risk": float(r["risk"]),
            "status": r["status"],
            "health_score": int(r["health_score"]),
            "days_to_failure": days_to_failure(r),
        }
        for _, r in ranked.head(12).iterrows()
    ]

    dist = {"Excellent": 0, "Good": 0, "Warning": 0, "Critical": 0}
    for status, count in df["status"].value_counts().items():
        dist[status] = int(round(count / len(df) * 100))

    now = datetime.utcnow()
    today = now.date()
    week_ago = today - timedelta(days=7)
    month_start = today.replace(day=1)

    asset_ids = session.query(Asset.id).filter(Asset.facility_id == facility_id)
    work_orders = session.query(WorkOrder).filter(WorkOrder.asset_id.in_(asset_ids)).all()
    spend_mtd = round(
        sum(
            r.cost or 0
            for r in session.query(MaintenanceRecord.cost)
            .join(Asset, MaintenanceRecord.asset_id == Asset.id)
            .filter(Asset.facility_id == facility_id, MaintenanceRecord.maintenance_date >= month_start)
            .all()
        )
    )
    ai_hours = [wo.estimated_hours or 0 for wo in work_orders if wo.source == "AI-predicted"]
    cost_avoided = round(sum(ai_hours) * rate)

    completed = [wo for wo in work_orders if wo.status == "Completed"]
    open_wos = [wo for wo in work_orders if wo.status in ("Open", "Scheduled", "In Progress")]
    avg_done = float(np.mean([wo.estimated_hours or 0 for wo in completed])) if completed else 0.0
    avg_open = float(np.mean([wo.estimated_hours or 0 for wo in open_wos])) if open_wos else avg_done
    downtime_reduction = round((avg_open - avg_done) / avg_open * 100) if avg_open else 0
    improved = downtime_reduction >= 0

    mttr_hours = round(avg_done, 1)
    new_this_week = sum(1 for wo in work_orders if (wo.created_at or now).date() >= week_ago)
    backlog = sum(1 for wo in work_orders if wo.status == "Open")
    attention = sum(1 for a in df.itertuples(index=False) if a.status in ("Critical", "Warning"))
    asset_classes = int(df["asset_type"].nunique())

    return {
        "agent": "Maintenance Agent",
        "assets_monitored": len(df),
        "maintenance_tickets": int(len(work_orders)),
        "predicted_failures": len(predicted),
        "downtime_reduction_pct": int(downtime_reduction),
        "health_distribution": dist,
        "predicted": predicted,
        "spend_mtd": spend_mtd,
        "cost_avoided": cost_avoided,
        "mttr_hours": mttr_hours,
        "asset_classes": asset_classes,
        "new_this_week": new_this_week,
        "backlog": backlog,
        "attention": attention,
        "improved": bool(improved),
    }


def run(session: Session, facility_id: int) -> dict:
    return cached(f"maintenance:{facility_id}", 45.0, lambda: _compute(session, facility_id))
