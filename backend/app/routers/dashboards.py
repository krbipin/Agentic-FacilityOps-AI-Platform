"""Dashboard payload router: one endpoint per page, composed from agent runs.

Each route first advances the live simulator so payloads reflect data up to
"now". All numbers come from agent computations over the database.
"""
from __future__ import annotations

import json
from datetime import date, datetime, timedelta

import numpy as np
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..agents import cost as cost_agent
from ..agents import energy as energy_agent
from ..agents import intelligence as intelligence_agent
from ..agents import maintenance as maintenance_agent
from ..agents import occupancy as occupancy_agent
from ..agents import security as security_agent
from ..config_store import config_float, config_str, get_config
from ..db import get_db
from ..live import advance
from ..models import Alert, Asset, EnergyUsage, Facility, WorkOrder
from . import get_facility

router = APIRouter(prefix="/api/dashboards", tags=["dashboards"])

AGENT_HEALTH_KEYS = {
    "Energy Agent": "energy",
    "Maintenance Agent": "maintenance",
    "Occupancy Agent": "occupancy",
    "Security Agent": "security",
    "Cost Optimization Agent": "cost",
}


def advance_live(session: Session = Depends(get_db)):
    advance(session, get_facility(session))
    return session


def _facility(session: Session, facility_id: int) -> dict:
    f = session.get(Facility, facility_id)
    return {"name": f.name, "facility_type": f.facility_type, "location": f.location}


def _open_alerts(session: Session, facility_id: int) -> list[dict]:
    rows = (
        session.query(Alert)
        .filter(Alert.facility_id == facility_id, Alert.status == "Open")
        .order_by(Alert.created_at.desc())
        .all()
    )
    return [
        {
            "id": a.id,
            "severity": a.severity,
            "title": a.title,
            "agent": a.agent,
            "created_at": a.created_at.isoformat(),
        }
        for a in rows
    ]


def _escalation_policy(session: Session) -> list[dict]:
    policy = []
    for key in ("alerts.escalation_l1", "alerts.escalation_l2", "alerts.escalation_l3"):
        raw = config_str(get_config(session), key, "")
        if raw:
            try:
                policy.append(json.loads(raw))
            except ValueError:
                continue
    return policy


@router.get("/overview")
def overview(session: Session = Depends(get_db), _: Session = Depends(advance_live)):
    fid = get_facility(session)
    energy = energy_agent.run(session, fid)
    maint = maintenance_agent.run(session, fid)
    occ = occupancy_agent.run(session, fid)
    sec = security_agent.run(session, fid)
    cost = cost_agent.run(session, fid)
    intel = intelligence_agent.run(session, fid)
    alerts = _open_alerts(session, fid)
    intel["kpis"] = {
        "cost_reduction_pct": cost["cost_reduction_pct"],
        "roi_generated": cost["roi_generated"],
        "facility_health": intel["facility_health"],
        "optimizations": intel["optimizations"],
    }
    return {
        "facility": _facility(session, fid),
        "kpis": {
            "energy_mwh": energy["total_today_mwh"],
            "cost_savings": energy["cost_savings"],
            "facility_health": intel["facility_health"],
            "active_alerts": len(alerts),
        },
        "energy": energy,
        "maintenance": maint,
        "occupancy": occ,
        "security": sec,
        "intelligence": intel,
        "alerts": alerts,
    }


@router.get("/energy")
def energy(session: Session = Depends(get_db), _: Session = Depends(advance_live)):
    fid = get_facility(session)
    return {"facility": _facility(session, fid), **energy_agent.run(session, fid)}


@router.get("/maintenance")
def maintenance(session: Session = Depends(get_db), _: Session = Depends(advance_live)):
    fid = get_facility(session)
    maint = maintenance_agent.run(session, fid)
    assets = session.query(Asset).filter(Asset.facility_id == fid).count()
    return {"facility": _facility(session, fid), "asset_count": assets, **maint}


@router.get("/occupancy")
def occupancy(session: Session = Depends(get_db), _: Session = Depends(advance_live)):
    fid = get_facility(session)
    return {"facility": _facility(session, fid), **occupancy_agent.run(session, fid)}


@router.get("/security")
def security(session: Session = Depends(get_db), _: Session = Depends(advance_live)):
    fid = get_facility(session)
    return {"facility": _facility(session, fid), **security_agent.run(session, fid)}


@router.get("/cost")
def cost(session: Session = Depends(get_db), _: Session = Depends(advance_live)):
    fid = get_facility(session)
    payload = cost_agent.run(session, fid)
    payload["facility_health"] = intelligence_agent.run(session, fid)["facility_health"]
    return {"facility": _facility(session, fid), **payload}


@router.get("/intelligence")
def intelligence(session: Session = Depends(get_db), _: Session = Depends(advance_live)):
    fid = get_facility(session)
    base = intelligence_agent.run(session, fid)
    energy = energy_agent.run(session, fid)
    occ = occupancy_agent.run(session, fid)
    maint = maintenance_agent.run(session, fid)
    cost = cost_agent.run(session, fid)

    peak = max(energy["forecast"], key=lambda p: p["electricity_kwh"]) if energy["forecast"] else None
    peak_occ = max(occ["zones"], key=lambda z: z["forecast_count"]) if occ["zones"] else None
    conf_pct = (
        round(np.std([p["electricity_kwh"] for p in energy["forecast"]]) / (np.mean([p["electricity_kwh"] for p in energy["forecast"]]) or 1) * 100)
        if energy["forecast"]
        else 6
    )
    forecasts = [
        {
            "domain": "Energy",
            "horizon": "Next 7 days",
            "headline": f"Peak {peak['electricity_kwh']:,.1f} kWh {peak['weekday']}" if peak else "Forecast pending",
            "confidence": f"±{conf_pct}%",
            "series": [{"label": p["weekday"], "value": round(p["electricity_kwh"], 1)} for p in energy["forecast"]],
        },
        {
            "domain": "Occupancy",
            "horizon": "Next 7 days",
            "headline": f"{peak_occ['forecast_count']:,} peak in {peak_occ['zone']}" if peak_occ else "Forecast pending",
            "confidence": f"{occ['forecast_accuracy_pct']}% accuracy",
            "series": [{"label": z["zone"].replace(" ", ""), "value": z["forecast_count"]} for z in occ["zones"]],
        },
        {
            "domain": "Maintenance",
            "horizon": "Next 30 days",
            "headline": f"{maint['predicted_failures']} predicted failures",
            "confidence": "Risk model",
            "series": [{"label": p["name"], "value": round(p["risk"], 1)} for p in maint["predicted"][:12]],
        },
    ]
    return {
        "facility": _facility(session, fid),
        **base,
        "kpis": {
            "cost_reduction_pct": cost["cost_reduction_pct"],
            "roi_generated": cost["roi_generated"],
            "facility_health": base["facility_health"],
            "optimizations": base["optimizations"],
        },
        "forecasts": forecasts,
    }


@router.get("/alerts")
def alerts(session: Session = Depends(get_db), _: Session = Depends(advance_live)):
    fid = get_facility(session)
    rows = session.query(Alert).filter(Alert.facility_id == fid).order_by(Alert.created_at.desc()).all()
    summary = {
        "total": len(rows),
        "open": sum(1 for a in rows if a.status == "Open"),
        "acknowledged": sum(1 for a in rows if a.status == "Acknowledged"),
        "resolved": sum(1 for a in rows if a.status == "Resolved"),
    }
    items = [
        {
            "id": a.id,
            "alert_type": a.alert_type,
            "severity": a.severity,
            "title": a.title,
            "message": a.message,
            "agent": a.agent,
            "status": a.status,
            "channels": a.channels,
            "created_at": a.created_at.isoformat(),
        }
        for a in rows
    ]
    return {"facility": _facility(session, fid), "summary": summary, "alerts": items, "escalation_policy": _escalation_policy(session)}


@router.get("/reports")
def reports(session: Session = Depends(get_db), _: Session = Depends(advance_live)):
    fid = get_facility(session)
    energy = energy_agent.run(session, fid)
    maint = maintenance_agent.run(session, fid)
    occ = occupancy_agent.run(session, fid)
    sec = security_agent.run(session, fid)
    cost = cost_agent.run(session, fid)
    intel = intelligence_agent.run(session, fid)
    cfg = get_config(session)

    spend = cost["total_spend"]
    budget = cost["total_budget"]
    prior_year = round(spend / (1 - cost["cost_reduction_pct"] / 100) / 1000) * 1000 if cost["cost_reduction_pct"] < 100 else spend

    emission = config_float(cfg, "energy.emission_factor_kg_per_kwh", 0.6)
    co2 = [
        {"date": r.timestamp.date().isoformat(), "co2_kg": round(r.electricity_kwh * emission, 1)}
        for r in session.query(EnergyUsage)
        .filter(EnergyUsage.facility_id == fid, EnergyUsage.is_forecast.is_(False))
        .order_by(EnergyUsage.timestamp.desc())
        .all()
        if r.timestamp.hour == 12 and r.timestamp.minute == 0
    ][-7:][::-1]

    today = date.today()
    quarter = f"Q{(today.month - 1) // 3 + 1}"
    now = datetime.now()
    top_recommendations = [{"title": r["title"], "impact": r["impact"], "agent": r["agent"]} for r in intel["recommendations"][:3]]

    health = intel["agent_health"]
    scorecards = [
        {"domain": "Energy", "score": health["energy"], "note": f"{energy['efficiency_score']:.0f}% efficiency"},
        {"domain": "Maintenance", "score": health["maintenance"], "note": f"{maint['downtime_reduction_pct']}% less downtime"},
        {"domain": "Occupancy", "score": health["occupancy"], "note": f"{occ['occupancy_rate_pct']:.0f}% utilization"},
        {"domain": "Security", "score": health["security"], "note": f"{sec['unauthorized_access']} unauthorized attempts today"},
        {"domain": "Cost", "score": health["cost"], "note": f"{cost['cost_reduction_pct']}% cost reduction"},
    ]
    agent_performance = [
        {"agent": "Energy Agent", "health": health["energy"], "cost_reduction": f"{energy['carbon_reduction_pct']:.0f}%", "roi": f"${energy['cost_savings']:.2f}/day", "downtime": "—"},
        {"agent": "Maintenance Agent", "health": health["maintenance"], "cost_reduction": "—", "roi": "—", "downtime": f"{maint['downtime_reduction_pct']}% less"},
        {"agent": "Occupancy Agent", "health": health["occupancy"], "cost_reduction": "—", "roi": "—", "downtime": "—"},
        {"agent": "Security Agent", "health": health["security"], "cost_reduction": "—", "roi": "—", "downtime": "—"},
        {"agent": "Cost Optimization Agent", "health": health["cost"], "cost_reduction": f"{cost['cost_reduction_pct']}%", "roi": f"${cost['roi_generated'] / 1e6:.1f}M", "downtime": "—"},
    ]

    return {
        "facility": _facility(session, fid),
        "period": f"{quarter} · {today.year}",
        "generated_at": now.isoformat(timespec="seconds"),
        "data_through": (today - timedelta(days=1)).isoformat(),
        "narrative": (
            f"Operational cost down {cost['cost_reduction_pct']}% month-over-month. AI optimization agents "
            f"generated ${cost['roi_generated'] / 1e6:.1f}M in value and cut energy {energy['carbon_reduction_pct']:.0f}%. "
            f"Facility health at {intel['facility_health']}/100 — all systems nominal."
        ),
        "kpis": {
            "cost_reduction_pct": cost["cost_reduction_pct"],
            "roi_generated": cost["roi_generated"],
            "facility_health": intel["facility_health"],
            "optimizations": cost["optimizations"],
        },
        "spend_trend": {"this_quarter": spend, "budget": budget, "prior_year": prior_year},
        "scorecards": scorecards,
        "sustainability": {
            "carbon_reduction_pct": energy["carbon_reduction_pct"],
            "renewables_pct": config_float(cfg, "sustainability.renewables_pct", 32.0),
            "co2_trend": co2,
        },
        "insights": [f"{r['agent']}: {r['title']} — {r['impact']}" for r in top_recommendations],
        "agent_performance": agent_performance,
        "energy": energy,
        "maintenance": maint,
        "occupancy": occ,
        "security": sec,
        "cost": cost,
        "intelligence": intel,
    }


@router.get("/assets")
def assets(session: Session = Depends(get_db), _: Session = Depends(advance_live)):
    fid = get_facility(session)
    statuses = dict(
        session.query(Asset.status, func.count()).filter(Asset.facility_id == fid).group_by(Asset.status).all()
    )
    total = sum(statuses.values())
    asset_types = [
        t[0]
        for t in session.query(Asset.asset_type).filter(Asset.facility_id == fid).distinct().order_by(Asset.asset_type).all()
    ]
    return {
        "facility": _facility(session, fid),
        "total": total,
        "statuses": {k: statuses.get(k, 0) for k in ("Excellent", "Good", "Warning", "Critical")},
        "distribution_pct": {k: round(statuses.get(k, 0) / total * 100) if total else 0 for k in ("Excellent", "Good", "Warning", "Critical")},
        "asset_types": asset_types,
    }


@router.get("/work-orders")
def work_orders(session: Session = Depends(get_db), _: Session = Depends(advance_live)):
    fid = get_facility(session)
    base = session.query(WorkOrder).join(Asset, WorkOrder.asset_id == Asset.id).filter(Asset.facility_id == fid)
    statuses = dict(base.with_entities(WorkOrder.status, func.count()).group_by(WorkOrder.status).all())
    total = sum(statuses.values())
    ai_count = (
        session.query(func.count())
        .filter(WorkOrder.source == "AI-predicted", WorkOrder.asset_id.in_(session.query(Asset.id).filter(Asset.facility_id == fid)))
        .scalar()
        or 0
    )
    return {
        "facility": _facility(session, fid),
        "total": total,
        "ai_predicted": ai_count,
        "statuses": {k: statuses.get(k, 0) for k in ("Open", "In Progress", "Scheduled", "Completed")},
    }
