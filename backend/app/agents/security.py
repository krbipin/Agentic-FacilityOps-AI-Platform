"""Security Agent: access monitoring, incident detection.

Event counts and severities are computed from the security_events table
(populated live). Door count / camera uptime come from system config; active
visitors come from the visitors table.
"""
from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sqlalchemy.orm import Session

from ..cache import cached
from ..config_store import config_float, get_config
from ..impact import estimate as estimate_impact
from ..models import Recommendation, SecurityEvent, Visitor
from .base import SEED


def _compute(session: Session, facility_id: int) -> dict:
    cfg = get_config(session)
    doors = int(config_float(cfg, "security.controlled_doors", 142.0))
    camera_uptime = config_float(cfg, "security.camera_uptime_pct", 99.98)

    today = pd.Timestamp.utcnow().date()
    rows = (
        session.query(SecurityEvent)
        .filter(SecurityEvent.facility_id == facility_id, SecurityEvent.timestamp >= pd.Timestamp(today))
        .order_by(SecurityEvent.timestamp)
        .all()
    )
    events = [
        {
            "id": r.id,
            "event_type": r.event_type,
            "severity": r.severity,
            "title": r.title,
            "location": r.location,
            "timestamp": r.timestamp.isoformat(),
            "status": r.status,
        }
        for r in rows
    ]

    burst_hours = []
    if events:
        hourly = pd.Series([pd.Timestamp(e["timestamp"]).hour for e in events]).value_counts().reindex(range(24), fill_value=0)
        feats = np.column_stack([np.arange(24), hourly.to_numpy()])
        iso = IsolationForest(n_estimators=100, contamination=0.1, random_state=SEED)
        flags = iso.fit_predict(feats)
        burst_hours = [int(h) for h, f in zip(range(24), flags) if f == -1]

    unauthorized = [e for e in events if e["severity"] == "Red"]
    counts = {"Red": 0, "Amber": 0, "Blue": 0}
    for e in events:
        counts[e["severity"]] += 1

    cctv_events = [e for e in events if any(k in e["event_type"].lower() for k in ("cctv", "motion", "loiter"))]
    visitors = [
        {"name": v.name, "company": v.company, "purpose": v.purpose, "status": v.status}
        for v in session.query(Visitor).filter(Visitor.facility_id == facility_id).all()
    ]
    active_visitors = sum(1 for v in visitors if v["status"] in ("Checked in", "On site"))
    security_recommendations = [
        {
            "title": r.title,
            "impact": estimate_impact(session, facility_id, r.agent, r.title),
            "status": r.status,
        }
        for r in session.query(Recommendation)
        .filter(Recommendation.agent == "Security Agent")
        .order_by(Recommendation.date)
        .all()
    ]

    return {
        "agent": "Security Agent",
        "events_today": len(events),
        "unauthorized_access": len(unauthorized),
        "active_visitors": active_visitors,
        "severity_counts": counts,
        "doors": {"controlled_doors": doors, "monitored_zones": doors},
        "burst_hours": burst_hours,
        "events": events,
        "camera_uptime_pct": camera_uptime,
        "cctv_events": cctv_events,
        "visitors": visitors,
        "security_recommendations": security_recommendations,
    }


def run(session: Session, facility_id: int) -> dict:
    return cached(f"security:{facility_id}", 45.0, lambda: _compute(session, facility_id))
