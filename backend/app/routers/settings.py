"""Settings & integrations."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..config_store import config_float, get_config
from ..db import get_db
from ..models import Facility, SystemConfig, User
from . import get_facility

router = APIRouter(prefix="/api/settings", tags=["settings"])

INTEGRATIONS = [
    {"id": "teams", "name": "Microsoft Teams", "kind": "Notifications", "status": "Connected", "detail": "ops-alerts channel"},
    {"id": "slack", "name": "Slack", "kind": "Notifications", "status": "Connected", "detail": "#facility-alerts"},
    {"id": "email", "name": "Email Gateway", "kind": "Notifications", "status": "Connected", "detail": "smtp.facilityops.ai"},
    {"id": "bacnet", "name": "BACnet / BMS", "kind": "Data source", "status": "Connected", "detail": "Tower A gateway"},
    {"id": "cctv", "name": "CCTV Analytics", "kind": "Data source", "status": "Degraded", "detail": "Bldg C stream lagging"},
]


@router.get("/integrations")
def integrations(session: Session = Depends(get_db)):
    doors = int(config_float(get_config(session), "security.controlled_doors", 142.0))
    items = [
        {"id": "access", "name": "Access Control", "kind": "Data source", "status": "Connected", "detail": f"{doors} doors"},
        *INTEGRATIONS,
    ]
    return {"items": items}


@router.get("/config")
def config_list(session: Session = Depends(get_db)):
    rows = session.query(SystemConfig).order_by(SystemConfig.key).all()
    return {
        "items": [
            {
                "key": r.key,
                "value": r.value_float if r.value_float is not None else r.value_str,
                "description": r.description,
                "group": r.key.split(".")[0],
            }
            for r in rows
        ]
    }


@router.get("/agents")
def agent_thresholds(session: Session = Depends(get_db)):
    cfg = get_config(session)
    return {
        "agents": [
            {
                "id": "energy",
                "name": "Energy Agent",
                "module": "Energy Monitoring",
                "threshold": f"≥{config_float(cfg, 'energy.efficiency_target', 85.0):.0f}% efficiency",
            },
            {
                "id": "maintenance",
                "name": "Maintenance Agent",
                "module": "Predictive Maintenance",
                "threshold": "≥85% precision",
            },
            {
                "id": "occupancy",
                "name": "Occupancy Agent",
                "module": "Space Utilization",
                "threshold": f"≥{config_float(cfg, 'occupancy.comfort_threshold_pct', 90.0):.0f}% ceiling",
            },
            {
                "id": "security",
                "name": "Security Agent",
                "module": "Access Monitoring",
                "threshold": f"{config_float(cfg, 'security.camera_uptime_pct', 99.98):.1f}% uptime",
            },
            {
                "id": "cost",
                "name": "Cost Optimization Agent",
                "module": "OPEX Analysis",
                "threshold": f"ROI ×{config_float(cfg, 'cost.roi_multiple', 6.2):.1f}",
            },
        ]
    }


@router.get("/facility")
def facility_settings(session: Session = Depends(get_db)):
    f = session.get(Facility, get_facility(session))
    return {
        "name": f.name if f else "Corporate HQ & IT Park",
        "facility_type": f.facility_type if f else "",
        "location": f.location if f else "",
        "timezone": "Asia/Kolkata",
        "currencies": ["USD"],
    }


@router.get("/team")
def team(session: Session = Depends(get_db)):
    members = [
        {
            "name": u.name,
            "email": u.email,
            "role": u.role,
        }
        for u in session.query(User).order_by(User.id).all()
    ]
    return {"members": members}
