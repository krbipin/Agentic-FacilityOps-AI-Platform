from __future__ import annotations

from fastapi import Depends, FastAPI
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Facility

DEFAULT_FACILITY = 1


def get_facility(session: Session) -> int:
    facility = session.query(Facility).order_by(Facility.id).first()
    return facility.id if facility else DEFAULT_FACILITY


def include_routers(app: FastAPI) -> None:
    from . import agents, alerts, assets, copilot, dashboards, settings, work_orders

    for module in (dashboards, agents, alerts, work_orders, assets, settings, copilot):
        app.include_router(module.router)


def db_dep() -> Session:
    return Depends(get_db)
