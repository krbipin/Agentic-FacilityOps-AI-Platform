"""Occupancy Agent: space utilization, capacity forecasting.

Zone counts come from the latest live snapshots; forecast is a linear
extrapolation of each zone's noon history with a residual band. Accuracy is the
model-vs-actual MAPE. The heatmap is aggregated in SQL (only ~168 rows cross the
wire) rather than pulling every minute record.
"""
from __future__ import annotations

from datetime import datetime, timedelta

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sqlalchemy import func, tuple_
from sqlalchemy.orm import Session

from ..cache import cached
from ..config_store import config_float, get_config
from ..impact import estimate as estimate_impact
from ..models import MeetingRoom, OccupancyRecord, Recommendation, Visitor

DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


def _latest_by_zone(session: Session, facility_id: int, now: datetime) -> dict[str, object]:
    pairs = (
        session.query(OccupancyRecord.zone, func.max(OccupancyRecord.timestamp))
        .filter(OccupancyRecord.facility_id == facility_id, OccupancyRecord.timestamp >= now - timedelta(days=8))
        .group_by(OccupancyRecord.zone)
        .all()
    )
    if not pairs:
        return {}
    rows = (
        session.query(OccupancyRecord)
        .filter(
            OccupancyRecord.facility_id == facility_id,
            tuple_(OccupancyRecord.zone, OccupancyRecord.timestamp).in_(pairs),
        )
        .all()
    )
    return {r.zone: r for r in rows}


def _heatmap_sql(session: Session, facility_id: int, now: datetime) -> list[dict]:
    cutoff = now - timedelta(days=7)
    rows = (
        session.query(
            func.extract("dow", OccupancyRecord.timestamp).label("d"),
            func.extract("hour", OccupancyRecord.timestamp).label("h"),
            func.coalesce(func.sum(OccupancyRecord.occupancy_count), 0.0),
            func.coalesce(func.sum(OccupancyRecord.capacity), 0.0),
        )
        .filter(
            OccupancyRecord.facility_id == facility_id,
            OccupancyRecord.timestamp >= cutoff,
            func.extract("minute", OccupancyRecord.timestamp) != 0,
        )
        .group_by(func.extract("dow", OccupancyRecord.timestamp), func.extract("hour", OccupancyRecord.timestamp))
        .all()
    )
    out = []
    for d, h, cnt, cap in rows:
        if not cap:
            continue
        weekday = (int(d) + 6) % 7  # Postgres dow (Sun=0) -> Python weekday (Mon=0)
        out.append({"day": DAY_LABELS[weekday], "hour": int(h), "density": round(float(cnt / cap), 2)})
    return out


def _compute(session: Session, facility_id: int) -> dict:
    cfg = get_config(session)
    comfort = config_float(cfg, "occupancy.comfort_threshold_pct", 90.0)
    now = datetime.utcnow()
    today = now.date()

    noon_rows = (
        session.query(OccupancyRecord)
        .filter(
            OccupancyRecord.facility_id == facility_id,
            func.extract("hour", OccupancyRecord.timestamp) == 12,
        )
        .order_by(OccupancyRecord.timestamp)
        .all()
    )
    noon = pd.DataFrame(
        [{"zone": r.zone, "ts": r.timestamp, "count": r.occupancy_count, "capacity": r.capacity} for r in noon_rows]
    )

    latest = _latest_by_zone(session, facility_id, now)

    zones, forecast_bands, crowding = [], [], []
    total_count = total_capacity = 0
    forecast_acc = []
    for zone in sorted(latest):
        r = latest[zone]
        count = int(r.occupancy_count)
        capacity = int(r.capacity)
        total_count += count
        total_capacity += capacity

        hist = noon[noon["zone"] == zone] if not noon.empty else pd.DataFrame()
        hist = hist[hist["ts"].dt.date < today] if not hist.empty else hist
        forecast_count, band = count, 1.0
        if len(hist) >= 7:
            h = hist.copy()
            h["t"] = (h["ts"] - h["ts"].min()).dt.days
            model = LinearRegression().fit(h[["t"]].to_numpy(), h["count"].to_numpy())
            pred = float(model.predict([[h["t"].max() + 1]])[0])
            resid = float(np.std(h["count"].to_numpy() - model.predict(h[["t"]].to_numpy())))
            band = max(1.0, round(resid, 1))
            forecast_count = round(pred)

        util = count / capacity * 100 if capacity else 0.0
        zones.append(
            {
                "zone": zone,
                "count": count,
                "capacity": capacity,
                "utilization_pct": round(util, 1),
                "forecast_count": forecast_count,
                "forecast_band": band,
            }
        )
        forecast_bands.append(
            {
                "zone": zone,
                "date": today.isoformat(),
                "low": round(forecast_count - band),
                "high": round(forecast_count + band),
            }
        )
        if count > 0:
            forecast_acc.append(max(0.0, 100.0 - abs(forecast_count - count) / count * 100.0))
        if util > comfort:
            crowding.append({"zone": zone, "utilization_pct": round(util, 1)})

    occupancy_rate = total_count / total_capacity * 100 if total_capacity else 0.0
    forecast_accuracy = round(float(np.mean(forecast_acc))) if forecast_acc else 0

    active_visitors = (
        session.query(Visitor)
        .filter(Visitor.facility_id == facility_id, Visitor.status.in_(["Checked in", "On site"]))
        .count()
    )

    heatmap = _heatmap_sql(session, facility_id, now)
    zone_timestamp = (
        latest[max(latest, key=lambda z: latest[z].timestamp)].timestamp.strftime("%H:%M") if latest else now.strftime("%H:%M")
    )

    daily = noon.groupby(noon["ts"].dt.normalize())["count"].sum() if not noon.empty else pd.Series(dtype=float)
    today_total = int(daily.iloc[-1]) if len(daily) else total_count
    delta_vs_yesterday_pct = (
        round((float(daily.iloc[-1]) - float(daily.iloc[-2])) / float(daily.iloc[-2]) * 100, 1)
        if len(daily) >= 2
        else 0.0
    )

    meeting_rooms = [
        {
            "name": r.name,
            "capacity": r.capacity,
            "utilization_pct": r.utilization_pct,
            "status": r.status,
            "booked_at": r.booked_at,
        }
        for r in session.query(MeetingRoom).filter(MeetingRoom.facility_id == facility_id).all()
    ]
    space_optimizations = [
        {
            "title": r.title,
            "impact": estimate_impact(session, facility_id, r.agent, r.title),
            "status": r.status,
        }
        for r in session.query(Recommendation)
        .filter(Recommendation.agent == "Occupancy Agent")
        .order_by(Recommendation.date)
        .all()
    ]

    return {
        "agent": "Occupancy Agent",
        "occupancy_rate_pct": round(occupancy_rate, 1),
        "active_visitors": int(active_visitors),
        "zones": zones,
        "forecast_bands": forecast_bands,
        "forecast_accuracy_pct": int(forecast_accuracy),
        "zone_timestamp": zone_timestamp,
        "delta_vs_yesterday_pct": delta_vs_yesterday_pct,
        "crowding_alerts": crowding,
        "heatmap": heatmap,
        "meeting_rooms": meeting_rooms,
        "space_optimizations": space_optimizations,
        "today_total": today_total,
    }


def run(session: Session, facility_id: int) -> dict:
    return cached(f"occupancy:{facility_id}", 45.0, lambda: _compute(session, facility_id))
