"""Energy Agent: live consumption monitoring, anomaly detection, demand forecast.

All values are computed from the energy time-series in the database. Heavy
aggregations (today's totals, per-hour series, hour baselines, daily slices)
are pushed into SQL so only small result sets cross the (bandwidth-limited)
Neon connection. No KPI is pinned to a demo constant.
"""
from __future__ import annotations

from datetime import datetime, timedelta

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.linear_model import LinearRegression
from sqlalchemy import Date, and_, func, or_
from sqlalchemy.orm import Session

from ..cache import cached
from ..config_store import config_float, get_config
from ..impact import estimate as estimate_impact
from ..models import EnergyUsage, Recommendation
from .base import SEED

_NOON = and_(func.extract("hour", EnergyUsage.timestamp) == 12, func.extract("minute", EnergyUsage.timestamp) == 0)


def _daily_df(session: Session, facility_id: int) -> pd.DataFrame:
    rows = (
        session.query(EnergyUsage.timestamp, EnergyUsage.electricity_kwh)
        .filter(EnergyUsage.facility_id == facility_id, EnergyUsage.is_forecast.is_(False), _NOON)
        .order_by(EnergyUsage.timestamp)
        .all()
    )
    df = pd.DataFrame([{"ts": r[0], "electricity_kwh": r[1]} for r in rows])
    if df.empty:
        return df
    df["day"] = (df["ts"] - df["ts"].min()).dt.days
    df["weekday"] = df["ts"].dt.weekday
    df["weekend"] = (df["ts"].dt.weekday >= 5).astype(int)
    df["sin"] = np.sin(df["day"] / 7.0 * 2 * np.pi)
    df["cos"] = np.cos(df["day"] / 7.0 * 2 * np.pi)
    return df


def _forecast_7d(daily: pd.DataFrame) -> list[dict]:
    if len(daily) < 30:
        return []
    model = LinearRegression()
    X = daily[["day", "weekend", "sin", "cos"]].to_numpy()
    model.fit(X, daily["electricity_kwh"].to_numpy())
    start_day = int(daily["day"].max()) + 1
    future = pd.DataFrame(
        {
            "day": range(start_day, start_day + 7),
            "weekend": [0, 0, 0, 0, 0, 1, 1],
            "sin": [np.sin((start_day + i) / 7.0 * 2 * np.pi) for i in range(7)],
            "cos": [np.cos((start_day + i) / 7.0 * 2 * np.pi) for i in range(7)],
        }
    )
    raw = model.predict(future[["day", "weekend", "sin", "cos"]].to_numpy())
    days = pd.date_range(daily["ts"].max().normalize() + pd.Timedelta(days=1), periods=7)
    out = [
        {
            "date": d.date().isoformat(),
            "weekday": d.strftime("%a"),
            "electricity_kwh": round(float(v), 1),
            "is_peak": False,
        }
        for d, v in zip(days, raw)
    ]
    if out:
        out[max(range(len(out)), key=lambda i: out[i]["electricity_kwh"])]["is_peak"] = True
    return out


def _day_slices_sql(session: Session, facility_id: int, now: datetime) -> dict:
    """Per-day kWh sums (electricity/hvac/lighting/equipment) for the trailing 8 days,
    each limited to now's time-of-day window. One grouped query."""
    day_win = or_(
        func.extract("hour", EnergyUsage.timestamp) < now.hour,
        and_(
            func.extract("hour", EnergyUsage.timestamp) == now.hour,
            func.extract("minute", EnergyUsage.timestamp) <= now.minute,
        ),
    )
    start = datetime.combine(now.date() - timedelta(days=7), datetime.min.time())
    end = datetime.combine(now.date(), datetime.min.time()) + timedelta(days=1)
    rows = (
        session.query(
            func.cast(EnergyUsage.timestamp, Date).label("day"),
            func.coalesce(func.sum(EnergyUsage.electricity_kwh), 0.0),
            func.coalesce(func.sum(EnergyUsage.hvac_kwh), 0.0),
            func.coalesce(func.sum(EnergyUsage.lighting_kwh), 0.0),
            func.coalesce(func.sum(EnergyUsage.equipment_kwh), 0.0),
        )
        .filter(
            EnergyUsage.facility_id == facility_id,
            EnergyUsage.is_forecast.is_(False),
            EnergyUsage.timestamp >= start,
            EnergyUsage.timestamp < end,
            ~_NOON,
            day_win,
        )
        .group_by(func.cast(EnergyUsage.timestamp, Date))
        .all()
    )
    return {r[0]: (float(r[1]), float(r[2]), float(r[3]), float(r[4])) for r in rows}


def _hourly_sql(session: Session, facility_id: int, now: datetime) -> list[dict]:
    cutoff = now - timedelta(hours=24)
    rows = (
        session.query(
            func.extract("hour", EnergyUsage.timestamp).label("h"),
            func.coalesce(func.sum(EnergyUsage.electricity_kwh), 0.0),
            func.coalesce(func.sum(EnergyUsage.hvac_kwh), 0.0),
            func.coalesce(func.sum(EnergyUsage.lighting_kwh), 0.0),
            func.coalesce(func.sum(EnergyUsage.equipment_kwh), 0.0),
            func.coalesce(func.sum(EnergyUsage.water_l), 0.0),
        )
        .filter(
            EnergyUsage.facility_id == facility_id,
            EnergyUsage.is_forecast.is_(False),
            EnergyUsage.timestamp >= cutoff,
            ~_NOON,
        )
        .group_by(func.extract("hour", EnergyUsage.timestamp))
        .all()
    )
    out = []
    for h, e, hv, li, eq, w in rows:
        out.append(
            {
                "hour": int(h),
                "label": f"{int(h):02d}:00",
                "electricity_kwh": round(float(e), 1),
                "hvac_kwh": round(float(hv), 1),
                "lighting_kwh": round(float(li), 1),
                "equipment_kwh": round(float(eq), 1),
                "water_l": round(float(w), 1),
            }
        )
    return out


def _hour_baselines_sql(session: Session, facility_id: int) -> dict[int, float]:
    """Median kWh per hour-of-day from the trailing 3 days (one grouped query)."""
    cutoff = datetime.utcnow() - timedelta(days=3)
    rows = (
        session.query(
            func.extract("hour", EnergyUsage.timestamp).label("h"),
            func.percentile_cont(0.5).within_group(EnergyUsage.electricity_kwh),
        )
        .filter(
            EnergyUsage.facility_id == facility_id,
            EnergyUsage.is_forecast.is_(False),
            EnergyUsage.timestamp >= cutoff,
            ~_NOON,
        )
        .group_by(func.extract("hour", EnergyUsage.timestamp))
        .all()
    )
    return {int(h): float(v) for h, v in rows}


def _detect_anomalies(hourly: list[dict], baselines: dict, now: datetime) -> list[dict]:
    if len(hourly) < 8:
        return []
    vals = [p["electricity_kwh"] for p in hourly]
    feats = np.column_stack([np.arange(len(hours := [p["hour"] for p in hourly])), vals])
    iso = IsolationForest(n_estimators=80, contamination=0.1, random_state=SEED)
    flags = iso.fit_predict(feats)
    anomalies = []
    for i, flag in enumerate(flags):
        h = hours[i]
        if flag == -1 and h in baselines and baselines[h] > 0:
            lift = min(999.0, (vals[i] - baselines[h]) / baselines[h] * 100)
            anomalies.append(
                {
                    "timestamp": (now.replace(hour=int(h), minute=0, second=0, microsecond=0)).isoformat(),
                    "electricity_kwh": round(vals[i], 1),
                    "hvac_kwh": round(hourly[i]["hvac_kwh"], 1),
                    "lift_pct": round(float(lift), 1),
                }
            )
    return anomalies


def _compute(session: Session, facility_id: int) -> dict:
    cfg = get_config(session)
    tariff = config_float(cfg, "energy.tariff_per_kwh", 0.12)
    emission = config_float(cfg, "energy.emission_factor_kg_per_kwh", 0.6)
    target = config_float(cfg, "energy.efficiency_target", 85.0)
    setpoint = config_float(cfg, "energy.hvac_setpoint_c", 22.5)
    threshold_pct = config_float(cfg, "energy.anomaly_threshold_pct", 12.0)

    now = datetime.utcnow()
    today = now.date()

    slices = _day_slices_sql(session, facility_id, now)
    today_kwh, hvac_today, lighting_today, equipment_today = slices.get(today, (0.0, 0.0, 0.0, 0.0))

    prev_days = [today - timedelta(days=i) for i in range(1, 8)]
    prev_slices = [slices[d][0] for d in prev_days if d in slices and slices[d][0] > 0]
    if prev_slices:
        mx = max(prev_slices)
        prev_slices = [v for v in prev_slices if v >= 0.6 * mx]
    baseline_kwh = float(np.mean(prev_slices)) if prev_slices else (today_kwh or 1.0)
    prev_partial = prev_slices[0] if prev_slices else 0.0

    change_prev = (today_kwh - prev_partial) / prev_partial * 100 if prev_partial else 0.0
    change_base = (today_kwh - baseline_kwh) / baseline_kwh * 100 if baseline_kwh else 0.0

    efficiency = float(np.clip(100.0 - abs(change_base), 0.0, 100.0))
    saved_kwh = max(0.0, baseline_kwh - today_kwh)
    cost_savings = saved_kwh * tariff
    co2_saved_kg = saved_kwh * emission
    carbon_pct = saved_kwh / baseline_kwh * 100 if baseline_kwh else 0.0

    hvac_slices = [slices[d][1] for d in prev_days if d in slices and slices[d][1] > 0]
    if hvac_slices:
        mx = max(hvac_slices)
        hvac_slices = [v for v in hvac_slices if v >= 0.6 * mx]
    hvac_base = float(np.mean(hvac_slices)) if hvac_slices else hvac_today or 1.0
    hvac_efficiency = float(np.clip(100.0 - abs(hvac_today - hvac_base) / hvac_base * 100, 0.0, 100.0)) if hvac_base else 100.0
    hvac_minutes = (
        session.query(func.count())
        .filter(
            EnergyUsage.facility_id == facility_id,
            EnergyUsage.is_forecast.is_(False),
            EnergyUsage.timestamp >= datetime.combine(today, datetime.min.time()),
            EnergyUsage.timestamp < datetime.combine(today, datetime.min.time()) + timedelta(days=1),
            ~_NOON,
            EnergyUsage.hvac_kwh > 0.05,
        )
        .scalar()
        or 0
    )
    hvac_run_hours = hvac_minutes / 60.0
    hvac_avg_temp_c = round(setpoint + (100.0 - hvac_efficiency) / 100.0 * 2.0, 1)

    split_raw = {"hvac": hvac_today, "lighting": lighting_today, "equipment": equipment_today}
    if today_kwh > 0:
        pcts = {k: v / today_kwh * 100.0 for k, v in split_raw.items()}
        pcts["other"] = max(0.0, 100.0 - sum(pcts.values()))
    else:
        pcts = {"hvac": 0.0, "lighting": 0.0, "equipment": 0.0, "other": 100.0}
    split = {k: int(round(v)) for k, v in pcts.items()}
    split["other"] = max(0, 100 - split["hvac"] - split["lighting"] - split["equipment"])

    baselines = _hour_baselines_sql(session, facility_id)
    hourly = _hourly_sql(session, facility_id, now)
    anomalies = _detect_anomalies(hourly, baselines, now)
    anomaly_count_today = sum(1 for a in anomalies if a["timestamp"].startswith(today.isoformat()))

    daily = _daily_df(session, facility_id)
    forecast = _forecast_7d(daily)
    peak_day = next((f for f in forecast if f["is_peak"]), None)

    wastage = [
        {"title": r.title, "impact": estimate_impact(session, facility_id, r.agent, r.title), "status": r.status}
        for r in session.query(Recommendation)
        .filter(Recommendation.agent.in_(["Energy Agent", "Cost Optimization Agent"]))
        .order_by(Recommendation.date)
        .all()
    ]

    return {
        "agent": "Energy Agent",
        "total_today_kwh": round(today_kwh, 1),
        "total_today_mwh": round(today_kwh / 1000.0, 3),
        "cost_savings": round(cost_savings, 2),
        "efficiency_score": round(efficiency, 1),
        "efficiency_target": target,
        "carbon_reduction_pct": round(carbon_pct, 1),
        "hvac_efficiency_pct": round(hvac_efficiency, 1),
        "hvac_setpoint_c": setpoint,
        "hvac_avg_temp_c": hvac_avg_temp_c,
        "hvac_run_hours": round(hvac_run_hours, 1),
        "co2_saved_kg": round(co2_saved_kg, 1),
        "split": split,
        "wastage_insights": wastage,
        "change_vs_prev_pct": round(change_prev, 1),
        "change_vs_baseline_pct": round(change_base, 1),
        "anomalies": anomalies,
        "anomaly_count_today": anomaly_count_today,
        "anomaly_threshold_pct": threshold_pct,
        "forecast": forecast,
        "peak_day": peak_day,
        "hourly": hourly,
    }


def run(session: Session, facility_id: int) -> dict:
    return cached(f"energy:{facility_id}", 45.0, lambda: _compute(session, facility_id))
