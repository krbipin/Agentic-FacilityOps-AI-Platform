from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func

from .config import CORS_ORIGINS
from .db import SessionLocal, init_db
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


@app.get("/api/health")
def health():
    session = SessionLocal()
    try:
        return {
            "status": "ok",
            "facility": session.query(Facility).first().name if _count(session, Facility) else None,
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
