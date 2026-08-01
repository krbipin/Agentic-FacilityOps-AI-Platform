"""Computed impact estimates for recommendations.

Recommendation rows are qualitative ("Optimize HVAC schedule"); their displayed
`impact` is *estimated at runtime* from live data (energy budgets, vendor spend,
open AI work orders) rather than stored dummy amounts.
"""
from __future__ import annotations

import time
from typing import Callable, TypeVar

from sqlalchemy.orm import Session

from .config_store import config_float, get_config
from .models import CostReport, Vendor, WorkOrder

T = TypeVar("T")

_impact_store: dict[str, tuple[float, str]] = {}


def _cached(key: str, ttl: float, fn: Callable[[], T]) -> T:
    now = time.monotonic()
    hit = _impact_store.get(key)
    if hit and now - hit[0] < ttl:
        return hit[1]
    value = fn()
    _impact_store[key] = (now, value)
    return value


def estimate(session: Session, facility_id: int, agent: str, title: str) -> str:
    return _cached(f"impact:{agent}:{title}", 120.0, lambda: _estimate(session, facility_id, agent, title))


def _estimate(session: Session, facility_id: int, agent: str, title: str) -> str:
    cfg = get_config(session)
    rate = config_float(cfg, "cost.hourly_rate", 160.0)
    t = title.lower()

    if any(k in t for k in ("energy", "hvac", "light", "off-peak", "schedule")):
        budget = _category_budget(session, facility_id, "Energy")
        return f"${budget * 0.05:,.0f}/mo"  # ~5% energy saving

    if any(k in t for k in ("vendor", "contract", "janitorial", "renegotiate")):
        spend = sum(v.spend for v in session.query(Vendor).filter(Vendor.facility_id == facility_id).all()) or 0.0
        return f"${spend * 0.04:,.0f}/mo"  # ~4% vendor spend

    if any(k in t for k in ("maintenance", "ahu", "replace", "consolidate", "service")):
        hours = _open_ai_hours(session, facility_id)
        return f"{hours:,.0f} h saved" if hours else "downtime saved"

    if any(k in t for k in ("floor", "desk", "pod", "booking", "space")):
        return f"${_space_value(session, facility_id):,.0f}/mo"

    return "risk reduced"  # security posture items (qualitative)


def _category_budget(session: Session, facility_id: int, category: str) -> float:
    row = (
        session.query(CostReport)
        .filter(CostReport.facility_id == facility_id, CostReport.category == category)
        .order_by(CostReport.report_date.desc())
        .first()
    )
    return float(row.amount) if row else 0.0


def _open_ai_hours(session: Session, facility_id: int) -> int:
    from .models import Asset

    asset_ids = session.query(Asset.id).filter(Asset.facility_id == facility_id)
    hours = [
        wo.estimated_hours or 0.0
        for wo in session.query(WorkOrder)
        .filter(WorkOrder.source == "AI-predicted", WorkOrder.status.in_(["Open", "Scheduled", "In Progress"]), WorkOrder.asset_id.in_(asset_ids))
        .all()
    ]
    return int(sum(hours)) or 0


def _space_value(session: Session, facility_id: int) -> int:
    from .models import OccupancyRecord

    row = (
        session.query(OccupancyRecord)
        .filter(OccupancyRecord.facility_id == facility_id, OccupancyRecord.zone == "Office Floors")
        .order_by(OccupancyRecord.timestamp.desc())
        .first()
    )
    admin = _category_budget(session, facility_id, "Administrative")
    if not row or not row.capacity:
        return 0
    underused = max(0.0, 1.0 - row.occupancy_count / row.capacity)
    return int(admin * 0.1 * underused)
