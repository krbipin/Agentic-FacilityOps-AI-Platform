"""Cost Optimization Agent: opex analysis, savings opportunities, budget watch.

Category spend comes from the latest CostReport rows; the trend is a linear
extrapolation of each category's 6-month series. Savings / ROI are computed
from live energy savings, maintenance cost-avoidance and the configured ROI
multiple.
"""
from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sqlalchemy.orm import Session

from ..cache import cached
from ..config_store import config_float, get_config
from ..impact import estimate as estimate_impact
from ..models import CostReport, Recommendation, Vendor, WorkOrder
from . import energy as energy_agent
from . import maintenance as maintenance_agent


def _compute(session: Session, facility_id: int) -> dict:
    cfg = get_config(session)
    roi_multiple = config_float(cfg, "cost.roi_multiple", 6.2)

    rows = (
        session.query(CostReport)
        .filter(CostReport.facility_id == facility_id)
        .order_by(CostReport.report_date)
        .all()
    )
    df = pd.DataFrame(
        [{"category": r.category, "date": pd.to_datetime(r.report_date), "amount": r.amount, "budget": r.budget} for r in rows]
    )

    categories, forecast_list = [], []
    total_spend = total_budget = 0.0
    if not df.empty:
        grouped = {cat: grp.sort_values("date") for cat, grp in df.groupby("category")}
        latest = {cat: grp.iloc[-1] for cat, grp in grouped.items()}
        prior = {cat: grp.iloc[-2] for cat, grp in grouped.items() if len(grp) >= 2}
        for category in sorted(latest):
            sub = grouped[category]
            spend = float(latest[category]["amount"])
            budget = float(latest[category]["budget"])
            total_spend += spend
            total_budget += budget

            next_spend, trend_pct = spend, 0.0
            if len(sub) >= 3:
                t = np.arange(len(sub)).reshape(-1, 1)
                model = LinearRegression().fit(t, sub["amount"].to_numpy())
                next_spend = float(model.predict([[len(sub)]])[0])
                trend_pct = float(model.coef_[0] / (sub["amount"].mean() or 1) * 100)
            categories.append(
                {
                    "category": category,
                    "amount": round(spend),
                    "budget": round(budget),
                    "over_budget": spend > budget,
                    "variance_pct": round((spend - budget) / budget * 100, 1) if budget else 0.0,
                    "next_month_forecast": round(next_spend),
                    "trend_pct": round(trend_pct, 1),
                }
            )
            if category in prior:
                forecast_list.append({"category": category, "prev": float(prior[category]["amount"]), "curr": spend})

        monthly = df.groupby(df["date"].dt.to_period("M"))["amount"].sum().sort_index()
        monthly_trend = [{"month": str(p), "amount": round(float(v))} for p, v in monthly.items()]
    else:
        monthly_trend = []

    pcts = {c["category"]: c["amount"] / total_spend * 100 if total_spend else 0.0 for c in categories}
    dist = {k: int(round(v)) for k, v in pcts.items()}
    if dist:
        diff = 100 - sum(dist.values())
        dist[max(dist, key=dist.get)] += diff

    cost_reduction_pct = 0.0
    if forecast_list:
        prev_total = sum(f["prev"] for f in forecast_list)
        if prev_total:
            cost_reduction_pct = (prev_total - total_spend) / prev_total * 100

    energy = energy_agent.run(session, facility_id)
    maint = maintenance_agent.run(session, facility_id)
    realized_savings = energy["cost_savings"] * 30 + maint["cost_avoided"]

    recs = session.query(Recommendation).order_by(Recommendation.date).all()
    optimizations = (
        sum(1 for r in recs if r.status != "Dismissed")
        + session.query(WorkOrder).filter(WorkOrder.source == "AI-predicted").count()
    )
    savings = [
        {"title": r.title, "impact": estimate_impact(session, facility_id, r.agent, r.title), "status": r.status}
        for r in recs
        if r.agent == "Cost Optimization Agent"
    ]
    vendor_spend = [
        {"name": v.name, "category": v.category, "spend": round(float(v.spend)), "trend_pct": round(float(v.trend_pct), 1)}
        for v in session.query(Vendor).filter(Vendor.facility_id == facility_id).all()
    ]

    return {
        "agent": "Cost Optimization Agent",
        "total_spend": round(total_spend),
        "total_budget": round(total_budget),
        "cost_reduction_pct": round(cost_reduction_pct, 1),
        "roi_generated": round(realized_savings * roi_multiple),
        "optimizations": int(optimizations),
        "distribution": dist,
        "categories": categories,
        "savings": savings,
        "monthly_trend": monthly_trend,
        "vendor_spend": vendor_spend,
        "realized_savings": round(realized_savings),
        "roi_multiple": roi_multiple,
    }


def run(session: Session, facility_id: int) -> dict:
    return cached(f"cost:{facility_id}", 45.0, lambda: _compute(session, facility_id))
