from __future__ import annotations

from fastapi import Depends, FastAPI
from sqlalchemy.orm import Session

from ..config_store import config_float, get_config
from ..db import get_db
from ..models import Facility, SystemConfig

DEFAULT_FACILITY = 1


def get_facility(session: Session) -> int:
    stored = int(config_float(get_config(session), "app.active_facility_id", 0.0))
    if stored and session.get(Facility, stored):
        return stored
    facility = session.query(Facility).order_by(Facility.id).first()
    return facility.id if facility else DEFAULT_FACILITY


def set_active_facility(session: Session, facility_id: int) -> None:
    row = session.query(SystemConfig).filter(SystemConfig.key == "app.active_facility_id").first()
    if row:
        row.value_float = float(facility_id)
        row.value_str = None
    else:
        session.add(
            SystemConfig(
                key="app.active_facility_id",
                value_float=float(facility_id),
                value_str=None,
                description="Facility currently shown in the UI",
            )
        )


def include_routers(app: FastAPI) -> None:
    from . import agents, alerts, assets, copilot, dashboards, energy, facilities, settings, work_orders

    for module in (dashboards, agents, alerts, work_orders, assets, settings, copilot, facilities, energy):
        app.include_router(module.router)


def db_dep() -> Session:
    return Depends(get_db)
