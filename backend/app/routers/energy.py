"""User-entered energy telemetry."""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..cache import invalidate
from ..db import get_db
from ..models import EnergyUsage
from . import get_facility

router = APIRouter(prefix="/api/energy", tags=["energy"])


class EnergyReadingCreate(BaseModel):
    timestamp: datetime | None = None
    electricity_kwh: float = Field(gt=0, le=100_000)
    hvac_kwh: float = Field(default=0, ge=0)
    lighting_kwh: float = Field(default=0, ge=0)
    equipment_kwh: float = Field(default=0, ge=0)
    water_l: float = Field(default=0, ge=0)


@router.post("", status_code=201)
def create_energy_reading(body: EnergyReadingCreate, session: Session = Depends(get_db)):
    fid = get_facility(session)
    ts = body.timestamp or datetime.utcnow()
    row = EnergyUsage(
        facility_id=fid,
        timestamp=ts.replace(second=0, microsecond=0),
        electricity_kwh=round(body.electricity_kwh, 2),
        water_l=round(body.water_l, 1),
        hvac_kwh=round(body.hvac_kwh, 2),
        lighting_kwh=round(body.lighting_kwh, 2),
        equipment_kwh=round(body.equipment_kwh, 2),
        is_forecast=False,
    )
    session.add(row)
    session.commit()
    invalidate(f"energy:{fid}")
    invalidate(f"cost:{fid}")
    return {"id": row.id, "timestamp": row.timestamp.isoformat(), "electricity_kwh": row.electricity_kwh}
