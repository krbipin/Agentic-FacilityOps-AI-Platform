"""Assets list/detail + user-entered asset creation."""
from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..agents import maintenance as maintenance_agent
from ..cache import invalidate
from ..db import get_db
from ..models import Asset, MaintenanceRecord
from . import get_facility

router = APIRouter(prefix="/api/assets", tags=["assets"])


def _next_asset_id(session: Session, facility_id: int) -> str:
    base = facility_id * 10000
    n = 1
    while session.get(Asset, f"AST-{base + n}"):
        n += 1
    return f"AST-{base + n}"


def _predictions(session: Session, facility_id: int) -> list[dict]:
    return maintenance_agent.run(session, facility_id)["predicted"]


def _serialize(asset: Asset) -> dict:
    return {
        "id": asset.id,
        "name": asset.name,
        "asset_type": asset.asset_type,
        "location": asset.location,
        "status": asset.status,
        "health_score": asset.health_score,
        "install_date": asset.install_date.isoformat(),
        "manufacturer": asset.manufacturer,
        "useful_life_pct": asset.useful_life_pct,
        "last_maintenance": asset.last_maintenance.isoformat(),
        "next_due": asset.next_due.isoformat() if asset.next_due else None,
    }


@router.get("")
def list_assets(
    status: str | None = None,
    asset_type: str | None = None,
    search: str | None = None,
    limit: int = 200,
    offset: int = 0,
    session: Session = Depends(get_db),
):
    q = session.query(Asset)
    if status:
        q = q.filter(Asset.status == status)
    if asset_type:
        q = q.filter(Asset.asset_type == asset_type)
    if search:
        like = f"%{search}%"
        q = q.filter(Asset.name.ilike(like) | Asset.id.ilike(like))
    total = q.count()
    rows = q.order_by(Asset.health_score).offset(offset).limit(limit).all()
    return {"total": total, "items": [_serialize(a) for a in rows]}


class AssetCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    asset_type: str = Field(min_length=1, max_length=40)
    location: str = Field(min_length=1, max_length=80)
    status: str = Field(default="Good", pattern="^(Excellent|Good|Warning|Critical)$")
    health_score: int = Field(default=80, ge=0, le=100)
    manufacturer: str = Field(default="Unknown", max_length=60)
    useful_life_pct: float = Field(default=100.0, ge=0, le=100)
    install_date: date = Field(default_factory=date.today)
    last_maintenance: date = Field(default_factory=date.today)
    next_due: date | None = None


@router.post("", status_code=201)
def create_asset(body: AssetCreate, session: Session = Depends(get_db)):
    fid = get_facility(session)
    asset = Asset(
        id=_next_asset_id(session, fid),
        facility_id=fid,
        name=body.name.strip(),
        asset_type=body.asset_type.strip(),
        location=body.location.strip(),
        status=body.status,
        health_score=body.health_score,
        install_date=body.install_date,
        manufacturer=body.manufacturer.strip() or "Unknown",
        useful_life_pct=body.useful_life_pct,
        last_maintenance=body.last_maintenance,
        next_due=body.next_due,
    )
    session.add(asset)
    session.commit()
    invalidate(f"maintenance:{fid}")
    invalidate(f"cost:{fid}")
    return _serialize(asset)


@router.get("/{asset_id}")
def get_asset(asset_id: str, session: Session = Depends(get_db)):
    asset = session.get(Asset, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    history = (
        session.query(MaintenanceRecord)
        .filter(MaintenanceRecord.asset_id == asset_id)
        .order_by(MaintenanceRecord.maintenance_date.desc())
        .all()
    )
    item = _serialize(asset)
    item["maintenance_history"] = [
        {
            "issue_type": m.issue_type,
            "maintenance_date": m.maintenance_date.isoformat(),
            "cost": m.cost,
            "technician": m.technician,
            "status": m.status,
        }
        for m in history
    ]
    pred = next(
        (p for p in _predictions(session, asset.facility_id) if p["asset_id"] == asset.id),
        None,
    )
    item["days_to_failure"] = pred["days_to_failure"] if pred else None
    item["predicted_risk"] = pred["risk"] if pred else None
    return item
