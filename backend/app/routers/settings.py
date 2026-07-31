"""Settings & integrations (status-only for now)."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Facility

router = APIRouter(prefix="/api/settings", tags=["settings"])

INTEGRATIONS = [
    {"id": "teams", "name": "Microsoft Teams", "kind": "Notifications", "status": "Connected", "detail": "ops-alerts channel"},
    {"id": "slack", "name": "Slack", "kind": "Notifications", "status": "Connected", "detail": "#facility-alerts"},
    {"id": "email", "name": "Email Gateway", "kind": "Notifications", "status": "Connected", "detail": "smtp.facilityops.ai"},
    {"id": "bacnet", "name": "BACnet / BMS", "kind": "Data source", "status": "Connected", "detail": "Tower A gateway"},
    {"id": "access", "name": "Access Control", "kind": "Data source", "status": "Connected", "detail": "142 doors"},
    {"id": "cctv", "name": "CCTV Analytics", "kind": "Data source", "status": "Degraded", "detail": "Bldg C stream lagging"},
]


@router.get("/integrations")
def integrations(session: Session = Depends(get_db)):
    return {"items": INTEGRATIONS}


@router.get("/facility")
def facility_settings(session: Session = Depends(get_db)):
    f = session.query(Facility).first()
    return {
        "name": f.name if f else "Corporate HQ & IT Park",
        "facility_type": f.facility_type if f else "",
        "location": f.location if f else "",
        "timezone": "Asia/Kolkata",
        "currencies": ["USD"],
    }
