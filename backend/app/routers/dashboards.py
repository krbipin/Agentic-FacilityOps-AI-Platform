"""Dashboard payload router: one endpoint per page, composed from agent runs."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..agents import cost as cost_agent
from ..agents import energy as energy_agent
from ..agents import intelligence as intelligence_agent
from ..agents import maintenance as maintenance_agent
from ..agents import occupancy as occupancy_agent
from ..agents import security as security_agent
from ..db import get_db
from ..models import Alert, Asset, EnergyUsage, Facility, WorkOrder
from . import get_facility

router = APIRouter(prefix="/api/dashboards", tags=["dashboards"])


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


@router.get("/overview")
def overview(session: Session = Depends(get_db)):
    fid = get_facility(session)
    energy = energy_agent.run(session, fid)
    maint = maintenance_agent.run(session, fid)
    occ = occupancy_agent.run(session, fid)
    sec = security_agent.run(session, fid)
    intel = intelligence_agent.run(session, fid)
    alerts = _open_alerts(session, fid)
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
def energy(session: Session = Depends(get_db)):
    fid = get_facility(session)
    return {"facility": _facility(session, fid), **energy_agent.run(session, fid)}


@router.get("/maintenance")
def maintenance(session: Session = Depends(get_db)):
    fid = get_facility(session)
    maint = maintenance_agent.run(session, fid)
    assets = session.query(Asset).filter(Asset.facility_id == fid).count()
    return {"facility": _facility(session, fid), "asset_count": assets, **maint}


@router.get("/occupancy")
def occupancy(session: Session = Depends(get_db)):
    fid = get_facility(session)
    return {"facility": _facility(session, fid), **occupancy_agent.run(session, fid)}


@router.get("/security")
def security(session: Session = Depends(get_db)):
    fid = get_facility(session)
    return {"facility": _facility(session, fid), **security_agent.run(session, fid)}


@router.get("/cost")
def cost(session: Session = Depends(get_db)):
    fid = get_facility(session)
    return {"facility": _facility(session, fid), **cost_agent.run(session, fid)}


@router.get("/intelligence")
def intelligence(session: Session = Depends(get_db)):
    fid = get_facility(session)
    base = intelligence_agent.run(session, fid)
    energy = energy_agent.run(session, fid)
    maint = maintenance_agent.run(session, fid)
    occ = occupancy_agent.run(session, fid)
    cost = cost_agent.run(session, fid)

    peak = max(energy["forecast"], key=lambda p: p["electricity_kwh"])
    forecasts = [
        {
            "domain": "Energy",
            "horizon": "Next 7 days",
            "headline": f"Peak {peak['electricity_kwh']:,.1f} kWh {peak['weekday']}",
            "confidence": "±6%",
            "series": [
                {"label": p["weekday"], "value": round(p["electricity_kwh"], 1)}
                for p in energy["forecast"]
            ],
        },
        {
            "domain": "Occupancy",
            "horizon": "Next 7 days",
            "headline": "1,075 peak in Office Floors",
            "confidence": f"{occ['forecast_accuracy_pct']}% accuracy",
            "series": [
                {"label": z["zone"].replace(" ", ""), "value": z["forecast_count"]}
                for z in occ["zones"]
            ],
        },
        {
            "domain": "Maintenance",
            "horizon": "Next 30 days",
            "headline": f"{maint['predicted_failures']} predicted failures",
            "confidence": "Risk model",
            "series": [
                {"label": p["name"], "value": round(p["risk"], 1)}
                for p in maint["predicted"][:12]
            ],
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
def alerts(session: Session = Depends(get_db)):
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
    return {"facility": _facility(session, fid), "summary": summary, "alerts": items}


@router.get("/reports")
def reports(session: Session = Depends(get_db)):
    fid = get_facility(session)
    energy = energy_agent.run(session, fid)
    maint = maintenance_agent.run(session, fid)
    occ = occupancy_agent.run(session, fid)
    sec = security_agent.run(session, fid)
    cost = cost_agent.run(session, fid)
    intel = intelligence_agent.run(session, fid)

    spend = cost["total_spend"]
    budget = cost["total_budget"]
    prior_year = round(spend / (1 - cost["cost_reduction_pct"] / 100) / 1000) * 1000

    co2 = [
        {"date": r.timestamp.date().isoformat(), "co2_kg": round(r.electricity_kwh * 0.6, 1)}
        for r in session.query(EnergyUsage)
        .filter(EnergyUsage.facility_id == fid, EnergyUsage.is_forecast == False)  # noqa: E712
        .order_by(EnergyUsage.timestamp.desc())
        .all()
        if r.timestamp.hour == 12 and r.timestamp.minute == 0
    ][-7:][::-1]

    return {
        "facility": _facility(session, fid),
        "narrative": (
            "Operational cost down 23% this quarter. AI optimization agents generated $2.4M "
            "in value and cut energy 15%. Facility health at 94/100 — all systems nominal."
        ),
        "kpis": {
            "cost_reduction_pct": cost["cost_reduction_pct"],
            "roi_generated": cost["roi_generated"],
            "facility_health": intel["facility_health"],
            "optimizations": cost["optimizations"],
        },
        "spend_trend": {
            "this_quarter": spend,
            "budget": budget,
            "prior_year": prior_year,
        },
        "scorecards": [
            {"domain": "Energy", "score": 88, "note": "8% efficiency gain"},
            {"domain": "Maintenance", "score": 91, "note": "34% less downtime"},
            {"domain": "Occupancy", "score": 85, "note": "73% utilization"},
            {"domain": "Security", "score": 79, "note": "4 unauthorized, all resolved"},
            {"domain": "Cost", "score": 93, "note": "23% cost reduction"},
        ],
        "sustainability": {
            "carbon_reduction_pct": energy["carbon_reduction_pct"],
            "renewables_pct": 32,
            "co2_trend": co2,
        },
        "insights": [
            "HVAC optimization saved $4,800/mo — the single largest AI contribution.",
            "Consolidating floors 4–5 could free 22% of space — potential $54k/yr.",
            "Security hardening closed 3 badge-duplication gaps.",
        ],
        "agent_performance": [
            {"agent": "Energy Agent", "health": 88, "cost_reduction": "15%", "roi": "$156.80/day", "downtime": "—"},
            {"agent": "Maintenance Agent", "health": 91, "cost_reduction": "—", "roi": "—", "downtime": "34% less"},
            {"agent": "Occupancy Agent", "health": 85, "cost_reduction": "—", "roi": "—", "downtime": "—"},
            {"agent": "Security Agent", "health": 79, "cost_reduction": "—", "roi": "—", "downtime": "—"},
            {"agent": "Cost Optimization Agent", "health": 93, "cost_reduction": "23%", "roi": "$2.4M", "downtime": "—"},
        ],
        "energy": energy,
        "maintenance": maint,
        "occupancy": occ,
        "security": sec,
        "cost": cost,
        "intelligence": intel,
    }


@router.get("/assets")
def assets(session: Session = Depends(get_db)):
    fid = get_facility(session)
    statuses = dict(
        session.query(Asset.status, func.count()).filter(Asset.facility_id == fid).group_by(Asset.status).all()
    )
    total = sum(statuses.values())
    return {
        "facility": _facility(session, fid),
        "total": total,
        "statuses": {k: statuses.get(k, 0) for k in ("Excellent", "Good", "Warning", "Critical")},
        "distribution_pct": {
            k: round(statuses.get(k, 0) / total * 100) if total else 0
            for k in ("Excellent", "Good", "Warning", "Critical")
        },
    }


@router.get("/work-orders")
def work_orders(session: Session = Depends(get_db)):
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
