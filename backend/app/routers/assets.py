"""Assets list/detail."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Asset, MaintenanceRecord

router = APIRouter(prefix="/api/assets", tags=["assets"])


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
    return item
