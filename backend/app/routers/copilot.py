"""AI Copilot: deterministic agent-collaboration chat + live status."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..agents import cost as cost_agent
from ..agents import energy as energy_agent
from ..agents import intelligence as intelligence_agent
from ..agents import maintenance as maintenance_agent
from ..agents import occupancy as occupancy_agent
from ..agents import security as security_agent
from ..db import get_db
from ..live import advance
from . import get_facility

router = APIRouter(prefix="/api/copilot", tags=["copilot"])


class ChatMessage(BaseModel):
    message: str


def advance_live(session: Session = Depends(get_db)):
    advance(session, get_facility(session))
    return session


def _agent_factoids(session: Session, fid: int) -> list[str]:
    energy = energy_agent.run(session, fid)
    maint = maintenance_agent.run(session, fid)
    occ = occupancy_agent.run(session, fid)
    sec = security_agent.run(session, fid)
    cost = cost_agent.run(session, fid)
    intel = intelligence_agent.run(session, fid)
    return [
        f"Energy: {energy['total_today_mwh']:.2f} MWh today, Tuesday peak {energy['peak_day']['electricity_kwh']/1000:.2f} MWh.",
        f"Maintenance: {maint['predicted_failures']} predicted failures, top risk {maint['predicted'][0]['name']} at {maint['predicted'][0]['risk']:.0f}%.",
        f"Occupancy: {occ['occupancy_rate_pct']}% occupancy across {len(occ['zones'])} zones.",
        f"Security: {sec['events_today']} events today, {sec['unauthorized_access']} unauthorized attempts.",
        f"Cost: {cost['cost_reduction_pct']}% cost reduction, ROI {cost['roi_generated']/1e6:.1f}M.",
        f"Facility health {intel['facility_health']}/100; energy-occupancy correlation r={intel['correlations'][0]['r']:.2f}.",
    ]


def _agent_reasoning(session: Session, fid: int, question: str) -> list[dict]:
    energy = energy_agent.run(session, fid)
    maint = maintenance_agent.run(session, fid)
    occ = occupancy_agent.run(session, fid)
    sec = security_agent.run(session, fid)
    cost = cost_agent.run(session, fid)
    intel = intelligence_agent.run(session, fid)
    steps = [
        {"agent": "Facility Intelligence Engine", "step": "Dispatching query across agent mesh", "detail": f"'{question}' → energy, maintenance, occupancy, security, cost"},
        {"agent": "Energy Agent", "step": "Querying ENERGY_USAGE", "detail": f"{energy['total_today_mwh']:.2f} MWh today, {energy['anomaly_count_today']} anomalies"},
        {"agent": "Maintenance Agent", "step": "Scoring assets", "detail": f"{maint['predicted_failures']} predicted failures, top risk {maint['predicted'][0]['name']} at {maint['predicted'][0]['risk']:.0f}%"},
        {"agent": "Occupancy Agent", "step": "Evaluating zone utilization", "detail": f"{occ['occupancy_rate_pct']}% occupancy across {len(occ['zones'])} zones"},
        {"agent": "Security Agent", "step": "Verifying perimeter logs", "detail": f"{sec['events_today']} events, {sec['unauthorized_access']} unauthorized attempts"},
        {"agent": "Cost Optimization Agent", "step": "Estimating avoidable spend", "detail": f"{cost['cost_reduction_pct']}% reduction, {cost['optimizations']} optimizations live"},
    ]
    return steps


def _compose_reply(question: str, factoids: list[str], facility_health: int) -> str:
    q = question.lower()
    if "health" in q or "score" in q:
        return f"Facility Health is {facility_health}/100.\n\n" + "\n".join(factoids)
    if "energy" in q:
        return f"Energy overview:\n\n" + factoids[0] + "\n\nAnomalies are flagged in real time by the Energy Agent (IsolationForest)."
    if "maintenance" in q or "fail" in q or "asset" in q:
        return f"Predictive maintenance:\n\n" + factoids[1]
    if "occupancy" in q or "space" in q:
        return f"Occupancy intelligence:\n\n" + factoids[2]
    if "security" in q or "access" in q:
        return f"Security posture:\n\n" + factoids[3]
    if "cost" in q or "save" in q or "roi" in q:
        return f"Cost optimization:\n\n" + factoids[4] + "\n\nOptimizations live in the Cost dashboard."
    return (
        "I've cross-checked all six facility agents. Summary:\n\n"
        + "\n".join(factoids)
        + "\n\nAsk me about energy, maintenance, occupancy, security, or cost for a focused briefing."
    )


@router.post("/chat")
def chat(body: ChatMessage, session: Session = Depends(get_db), _: Session = Depends(advance_live)):
    fid = get_facility(session)
    factoids = _agent_factoids(session, fid)
    reasoning = _agent_reasoning(session, fid, body.message)
    intel = intelligence_agent.run(session, fid)
    return {
        "reply": _compose_reply(body.message, factoids, intel["facility_health"]),
        "agents_collaborated": len(reasoning),
        "reasoning": reasoning,
    }


@router.get("/agents")
def agent_collaboration(session: Session = Depends(get_db), _: Session = Depends(advance_live)):
    fid = get_facility(session)
    energy = energy_agent.run(session, fid)
    maint = maintenance_agent.run(session, fid)
    occ = occupancy_agent.run(session, fid)
    sec = security_agent.run(session, fid)
    cost = cost_agent.run(session, fid)
    intel = intelligence_agent.run(session, fid)
    return {
        "agents": [
            {"name": "Energy Agent", "status": "active", "insight": f"HVAC {energy['split']['hvac']}% · peak {energy['peak_day']['electricity_kwh']/1000:.2f} MWh"},
            {"name": "Maintenance Agent", "status": "active", "insight": f"{maint['predicted_failures']} predicted failures"},
            {"name": "Occupancy Agent", "status": "active", "insight": f"Space utilization {occ['occupancy_rate_pct']}%"},
            {"name": "Security Agent", "status": "active", "insight": f"{sec['unauthorized_access']} unauthorized attempts"},
            {"name": "Cost Optimization Agent", "status": "active", "insight": f"{cost['optimizations']} optimizations live"},
            {"name": "Facility Intelligence Engine", "status": "coordinating", "insight": f"r={intel['correlations'][0]['r']:.2f} energy-occupancy"},
        ],
        "facility_health": intel["facility_health"],
        "correlations": intel["correlations"],
    }
