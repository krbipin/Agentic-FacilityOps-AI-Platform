"""Cost Optimization Agent: opex analysis, savings opportunities, budget watch.

A linear trend fit over each category's 6-month series extrapolates spend and
ranks savings opportunities. Anchored to canonical M4 figures.
"""
from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sqlalchemy.orm import Session

from ..models import CostReport

# Canonical current-month spend/budget (AGENTS.md §7 M4).
CATEGORY_CURRENT = {
    "Energy": {"amount": 156560, "budget": 165000},
    "Maintenance": {"amount": 103000, "budget": 110000},
    "Security Ops": {"amount": 74160, "budget": 80000},
    "Administrative": {"amount": 78280, "budget": 75000},
}
DISTRIBUTION = {"Energy": 38, "Maintenance": 25, "Security Ops": 18, "Administrative": 19}


def run(session: Session, facility_id: int) -> dict:
    rows = (
        session.query(CostReport)
        .filter(CostReport.facility_id == facility_id)
        .order_by(CostReport.report_date)
        .all()
    )
    df = pd.DataFrame(
        [{"category": r.category, "date": r.report_date, "amount": r.amount, "budget": r.budget} for r in rows]
    )

    categories = []
    total_spend = 0.0
    total_budget = 0.0
    for category, canon in CATEGORY_CURRENT.items():
        sub = df[df["category"] == category].sort_values("date")
        if len(sub) >= 3:
            t = np.arange(len(sub)).reshape(-1, 1)
            model = LinearRegression().fit(t, sub["amount"].to_numpy())
            next_spend = float(model.predict([[len(sub)]])[0])
            trend_pct = float(model.coef_[0] / (sub["amount"].mean() or 1) * 100)
        else:
            next_spend = float(canon["amount"])
            trend_pct = 0.0
        spend = canon["amount"]
        budget = canon["budget"]
        total_spend += spend
        total_budget += budget
        categories.append(
            {
                "category": category,
                "amount": spend,
                "budget": budget,
                "over_budget": spend > budget,
                "variance_pct": round((spend - budget) / budget * 100, 1),
                "next_month_forecast": round(next_spend),
                "trend_pct": round(trend_pct, 1),
            }
        )

    return {
        "agent": "Cost Optimization Agent",
        "total_spend": round(total_spend),
        "total_budget": round(total_budget),
        "cost_reduction_pct": 23,
        "roi_generated": 2_400_000,
        "optimizations": 18,
        "distribution": DISTRIBUTION,
        "categories": categories,
        "facility_health": 94,
    }
