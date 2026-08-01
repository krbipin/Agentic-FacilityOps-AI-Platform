"""Agent registry + per-agent run endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..agents import cost, energy, intelligence, maintenance, occupancy, security
from ..db import get_db
from . import get_facility

router = APIRouter(prefix="/api/agents", tags=["agents"])

REGISTRY = {
    "energy": {
        "name": "Energy Agent",
        "module": "Energy Monitoring",
        "run": energy.run,
    },
    "maintenance": {
        "name": "Maintenance Agent",
        "module": "Predictive Maintenance",
        "run": maintenance.run,
    },
    "occupancy": {
        "name": "Occupancy Agent",
        "module": "Space Utilization",
        "run": occupancy.run,
    },
    "security": {
        "name": "Security Agent",
        "module": "Access & CCTV Monitoring",
        "run": security.run,
    },
    "cost": {
        "name": "Cost Optimization Agent",
        "module": "Opex Analysis",
        "run": cost.run,
    },
    "intelligence": {
        "name": "Facility Intelligence Engine",
        "module": "Aggregation & Correlation",
        "run": intelligence.run,
    },
}


@router.get("")
def list_agents(session: Session = Depends(get_db)):
    fid = get_facility(session)
    intel = intelligence.run(session, fid)
    health = intel.get("agent_health", {})
    return [
        {
            "id": key,
            "name": info["name"],
            "module": info["module"],
            "status": "Running",
            "health": health.get(key, 100),
        }
        for key, info in REGISTRY.items()
    ]


@router.get("/{agent_id}/run")
def run_agent(agent_id: str, session: Session = Depends(get_db)):
    agent = REGISTRY.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Unknown agent: {agent_id}")
    fid = get_facility(session)
    return agent["run"](session, fid)
