"""AI Copilot: live agent-collaboration chat + status.

Chat is LLM-backed when a Groq API key is configured (config.GROQ_API_KEY),
otherwise it falls back to a deterministic keyword composer. All endpoint
payloads are safe on empty facilities (zeroed agent output).
"""
from __future__ import annotations

import os

from fastapi import APIRouter, Depends
from groq import Groq
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..agents import cost as cost_agent
from ..agents import energy as energy_agent
from ..agents import intelligence as intelligence_agent
from ..agents import maintenance as maintenance_agent
from ..agents import occupancy as occupancy_agent
from ..agents import security as security_agent
from ..config import GROQ_API_KEY
from ..db import get_db
from ..live import advance
from . import get_facility

router = APIRouter(prefix="/api/copilot", tags=["copilot"])

GROQ_MODEL = "llama-3.3-70b-versatile"


class ChatMessage(BaseModel):
    message: str


def advance_live(session: Session = Depends(get_db)):
    advance(session, get_facility(session))
    return session


def _peak_mwh(energy: dict) -> float:
    peak = energy.get("peak_day") or {}
    return float(peak.get("electricity_kwh") or 0) / 1000


def _top_risk(maint: dict) -> tuple[str, float]:
    pred = maint.get("predicted") or []
    if not pred:
        return "none", 0.0
    top = pred[0]
    return str(top.get("name") or "—"), float(top.get("risk") or 0)


def _correlation_r(intel: dict) -> float:
    corr = intel.get("correlations") or []
    if not corr:
        return 0.0
    return float(corr[0].get("r") or 0)


def _agent_factoids(session: Session, fid: int) -> list[str]:
    energy = energy_agent.run(session, fid)
    maint = maintenance_agent.run(session, fid)
    occ = occupancy_agent.run(session, fid)
    sec = security_agent.run(session, fid)
    cost = cost_agent.run(session, fid)
    intel = intelligence_agent.run(session, fid)
    top_name, top_risk = _top_risk(maint)
    return [
        f"Energy: {energy['total_today_mwh']:.2f} MWh today, peak {_peak_mwh(energy):.2f} MWh.",
        f"Maintenance: {maint['predicted_failures']} predicted failures, top risk {top_name} at {top_risk:.0f}%.",
        f"Occupancy: {occ['occupancy_rate_pct']}% occupancy across {len(occ['zones'])} zones.",
        f"Security: {sec['events_today']} events today, {sec['unauthorized_access']} unauthorized attempts.",
        f"Cost: {cost['cost_reduction_pct']}% cost reduction, ROI {cost['roi_generated']/1e6:.1f}M.",
        f"Facility health {intel['facility_health']}/100; energy-occupancy correlation r={_correlation_r(intel):.2f}.",
    ]


def _agent_reasoning(session: Session, fid: int, question: str) -> list[dict]:
    energy = energy_agent.run(session, fid)
    maint = maintenance_agent.run(session, fid)
    occ = occupancy_agent.run(session, fid)
    sec = security_agent.run(session, fid)
    cost = cost_agent.run(session, fid)
    top_name, top_risk = _top_risk(maint)
    steps = [
        {"agent": "Facility Intelligence Engine", "step": "Dispatching query across agent mesh", "detail": f"'{question}' → energy, maintenance, occupancy, security, cost"},
        {"agent": "Energy Agent", "step": "Querying ENERGY_USAGE", "detail": f"{energy['total_today_mwh']:.2f} MWh today, {energy['anomaly_count_today']} anomalies"},
        {"agent": "Maintenance Agent", "step": "Scoring assets", "detail": f"{maint['predicted_failures']} predicted failures, top risk {top_name} at {top_risk:.0f}%"},
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


def _llm_reply(question: str, factoids: list[str], facility_health: int) -> str | None:
    """Groq-backed answer. Returns None when no key is set or the call fails,
    so the deterministic composer always has a working fallback."""
    if not GROQ_API_KEY:
        return None
    try:
        client = Groq(api_key=GROQ_API_KEY)
        system = (
            "You are the Facility Copilot for an AI-powered building operations platform. "
            "Answer the operator's question with a concise plain-language briefing (2-5 sentences). "
            "Ground every figure ONLY in the live facility data provided below; never invent "
            "numbers, asset names, or dates. If the data does not answer the question, say so "
            f"and summarize the available facts. Facility health is {facility_health}/100."
        )
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system},
                {
                    "role": "user",
                    "content": f"Live facility data:\n" + "\n".join(factoids) + f"\n\nOperator question: {question}",
                },
            ],
            temperature=0.3,
            max_tokens=300,
        )
        return completion.choices[0].message.content
    except Exception:
        return None


@router.post("/chat")
def chat(body: ChatMessage, session: Session = Depends(get_db), _: Session = Depends(advance_live)):
    fid = get_facility(session)
    factoids = _agent_factoids(session, fid)
    reasoning = _agent_reasoning(session, fid, body.message)
    intel = intelligence_agent.run(session, fid)
    reply = _llm_reply(body.message, factoids, intel["facility_health"])
    if not reply:
        reply = _compose_reply(body.message, factoids, intel["facility_health"])
    return {
        "reply": reply,
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
            {"name": "Energy Agent", "status": "active", "insight": f"HVAC {energy['split']['hvac']}% · peak {_peak_mwh(energy):.2f} MWh"},
            {"name": "Maintenance Agent", "status": "active", "insight": f"{maint['predicted_failures']} predicted failures"},
            {"name": "Occupancy Agent", "status": "active", "insight": f"Space utilization {occ['occupancy_rate_pct']}%"},
            {"name": "Security Agent", "status": "active", "insight": f"{sec['unauthorized_access']} unauthorized attempts"},
            {"name": "Cost Optimization Agent", "status": "active", "insight": f"{cost['optimizations']} optimizations live"},
            {"name": "Facility Intelligence Engine", "status": "coordinating", "insight": f"r={_correlation_r(intel):.2f} energy-occupancy"},
        ],
        "facility_health": intel["facility_health"],
        "correlations": intel["correlations"],
    }
