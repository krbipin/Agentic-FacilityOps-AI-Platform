from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func

from .config import CORS_ORIGINS
from .config_store import config_float, config_str, get_config
from .db import SessionLocal, init_db
from .live import advance
from .models import (
    Alert,
    Asset,
    CostReport,
    EnergyUsage,
    Facility,
    MaintenanceRecord,
    OccupancyRecord,
    SecurityEvent,
    WorkOrder,
)
from .routers import include_routers
from .seed import seed


def _count(session, model) -> int:
    return session.query(func.count()).select_from(model).scalar() or 0


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    session = SessionLocal()
    try:
        if _count(session, Facility) == 0:
            seed(session)
    finally:
        session.close()
    yield


app = FastAPI(
    title="FacilityOps AI Backend",
    description="FastAPI + pandas + scikit-learn agents for the Agentic FacilityOps AI Platform",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

include_routers(app)


@app.get("/api/health")
def health():
    session = SessionLocal()
    try:
        from .routers import get_facility

        if _count(session, Facility):
            fid = get_facility(session)
            advance(session, fid)
        else:
            fid = None
        facility = session.get(Facility, fid) if fid else None
        cfg = get_config(session)
        seeded = int(config_float(cfg, "app.seeded_facility_id", 1.0))
        sample_note = config_str(cfg, "app.sample_data_note", "") if fid == seeded else ""
        return {
            "status": "ok",
            "version": app.version,
            "facility": facility.name if facility else None,
            "sample_note": sample_note,
            "counts": {
                "assets": _count(session, Asset),
                "maintenance_records": _count(session, MaintenanceRecord),
                "energy_usage": _count(session, EnergyUsage),
                "occupancy_records": _count(session, OccupancyRecord),
                "security_events": _count(session, SecurityEvent),
                "cost_reports": _count(session, CostReport),
                "alerts": _count(session, Alert),
                "work_orders": _count(session, WorkOrder),
            },
        }
    finally:
        session.close()
