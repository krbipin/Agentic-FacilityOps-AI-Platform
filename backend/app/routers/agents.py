"""Agent registry + per-agent run endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..agents import cost, energy, intelligence, maintenance, occupancy, security
from ..agents.base import health_scores
from ..db import get_db
from . import get_facility

router = APIRouter(prefix="/api/agents", tags=["agents"])

REGISTRY = {
    "energy": {
        "name": "Energy Agent",
        "module": "Energy Monitoring",
        "status": "Running",
        "last_run": "2 min ago",
        "run": energy.run,
    },
    "maintenance": {
        "name": "Maintenance Agent",
        "module": "Predictive Maintenance",
        "status": "Running",
        "last_run": "1 min ago",
        "run": maintenance.run,
    },
    "occupancy": {
        "name": "Occupancy Agent",
        "module": "Space Utilization",
        "status": "Running",
        "last_run": "3 min ago",
        "run": occupancy.run,
    },
    "security": {
        "name": "Security Agent",
        "module": "Access & CCTV Monitoring",
        "status": "Running",
        "last_run": "just now",
        "run": security.run,
    },
    "cost": {
        "name": "Cost Optimization Agent",
        "module": "Opex Analysis",
        "status": "Running",
        "last_run": "5 min ago",
        "run": cost.run,
    },
    "intelligence": {
        "name": "Facility Intelligence Engine",
        "module": "Aggregation & Correlation",
        "status": "Running",
        "last_run": "just now",
        "run": intelligence.run,
    },
}


@router.get("")
def list_agents():
    return [
        {"id": key, "name": info["name"], "module": info["module"], "status": info["status"], "last_run": info["last_run"],
         "health": health_scores().get(key, 90)}
        for key, info in REGISTRY.items()
    ]


@router.get("/{agent_id}/run")
def run_agent(agent_id: str, session: Session = Depends(get_db)):
    agent = REGISTRY.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Unknown agent: {agent_id}")
    fid = get_facility(session)
    return agent["run"](session, fid)
