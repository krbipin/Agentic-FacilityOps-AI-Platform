"""Work orders CRUD."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..config_store import config_float, get_config
from ..db import get_db
from ..models import Asset, WorkOrder

router = APIRouter(prefix="/api/work-orders", tags=["work-orders"])


class WorkOrderCreate(BaseModel):
    asset_id: str
    title: str
    priority: str = "P2"
    source: str = "Manual"
    due_date: str | None = None


class WorkOrderUpdate(BaseModel):
    status: str | None = None
    assignee: str | None = None


def _serialize(wo: WorkOrder) -> dict:
    return {
        "id": wo.id,
        "asset_id": wo.asset_id,
        "asset_name": wo.asset_id,
        "title": wo.title,
        "priority": wo.priority,
        "source": wo.source,
        "status": wo.status,
        "assignee": wo.assignee,
        "due_date": wo.due_date.isoformat() if wo.due_date else None,
        "estimated_hours": wo.estimated_hours,
        "confidence": wo.confidence,
        "created_at": wo.created_at.isoformat(),
    }


@router.get("")
def list_work_orders(status: str | None = None, limit: int = 100, session: Session = Depends(get_db)):
    q = session.query(WorkOrder)
    if status:
        q = q.filter(WorkOrder.status == status)
    rows = q.order_by(WorkOrder.created_at.desc()).limit(limit).all()
    names = {a.id: a.name for a in session.query(Asset).all()}
    out = []
    for wo in rows:
        item = _serialize(wo)
        item["asset_name"] = names.get(wo.asset_id, wo.asset_id)
        out.append(item)
    return out


@router.get("/technicians")
def list_technicians(session: Session = Depends(get_db)):
    rows = session.query(WorkOrder.assignee).filter(WorkOrder.assignee.isnot(None)).distinct().all()
    names = {r[0] for r in rows}
    return {"technicians": sorted(names)}


@router.get("/{wo_id}")
def get_work_order(wo_id: str, session: Session = Depends(get_db)):
    wo = session.get(WorkOrder, wo_id)
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")
    item = _serialize(wo)
    asset = session.get(Asset, wo.asset_id)
    item["asset_name"] = asset.name if asset else wo.asset_id
    return item


@router.post("", status_code=201)
def create_work_order(body: WorkOrderCreate, session: Session = Depends(get_db)):
    if not session.get(Asset, body.asset_id):
        raise HTTPException(status_code=400, detail="Unknown asset_id")
    from datetime import date, datetime, timedelta

    cfg = get_config(session)
    default_days = int(config_float(cfg, "work_orders.default_due_days", 7.0))
    default_hours = config_float(cfg, "work_orders.default_hours", 2.0)

    next_id = int(session.query(WorkOrder.id).order_by(WorkOrder.id.desc()).first()[0].split("-")[1]) + 1
    due = None
    if body.due_date:
        try:
            due = date.fromisoformat(body.due_date)
        except ValueError:
            due = (datetime.now() + timedelta(days=default_days)).date()
    wo = WorkOrder(
        id=f"WO-{next_id}",
        asset_id=body.asset_id,
        title=body.title,
        issue_type=body.title,
        priority=body.priority,
        source=body.source,
        status="Open",
        due_date=due,
        estimated_hours=default_hours,
    )
    session.add(wo)
    session.commit()
    item = _serialize(wo)
    asset = session.get(Asset, body.asset_id)
    item["asset_name"] = asset.name if asset else body.asset_id
    return item


@router.patch("/{wo_id}")
def update_work_order(wo_id: str, body: WorkOrderUpdate, session: Session = Depends(get_db)):
    wo = session.get(WorkOrder, wo_id)
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")
    if body.status:
        if body.status not in {"Open", "In Progress", "Scheduled", "Completed"}:
            raise HTTPException(status_code=400, detail="Invalid status")
        wo.status = body.status
    if body.assignee is not None:
        wo.assignee = body.assignee or None
    session.commit()
    return _serialize(wo)
