"""Alerts CRUD + escalation."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Alert
from . import get_facility

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


class AlertUpdate(BaseModel):
    status: str  # Open / Acknowledged / Resolved


@router.get("")
def list_alerts(status: str | None = None, limit: int = 100, session: Session = Depends(get_db)):
    fid = get_facility(session)
    q = session.query(Alert).filter(Alert.facility_id == fid)
    if status:
        q = q.filter(Alert.status == status)
    rows = q.order_by(Alert.created_at.desc()).limit(limit).all()
    return [
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


@router.patch("/{alert_id}")
def update_alert(alert_id: int, body: AlertUpdate, session: Session = Depends(get_db)):
    alert = session.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    if body.status not in {"Open", "Acknowledged", "Resolved"}:
        raise HTTPException(status_code=400, detail="Invalid status")
    alert.status = body.status
    session.commit()
    return {"id": alert.id, "status": alert.status}
