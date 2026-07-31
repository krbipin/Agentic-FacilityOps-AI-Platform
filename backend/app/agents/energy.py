"""Energy Agent: consumption monitoring, anomaly detection, demand forecast.

- IsolationForest flags the injected AHU-4 anomaly (18% above baseline at 14:00).
- LinearRegression forecasts the next 7 days; output is scaled so the Tuesday
  peak lands exactly on the canonical 1.34 MWh.
"""
from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.linear_model import LinearRegression
from sqlalchemy.orm import Session

from ..models import EnergyUsage
from .base import SEED

# Canonical anchor values (UI-UX-Specs/03 + AGENTS.md §7).
TOTAL_TODAY_KWH = 1280.0
TUESDAY_PEAK_KWH = 1340.0  # 1.34 MWh forecast peak


def _hourly_df(session: Session, facility_id: int) -> pd.DataFrame:
    rows = (
        session.query(EnergyUsage)
        .filter(EnergyUsage.facility_id == facility_id, EnergyUsage.is_forecast == False)  # noqa: E712
        .order_by(EnergyUsage.timestamp.desc())
        .limit(240)
        .all()
    )
    df = pd.DataFrame(
        [
            {
                "ts": r.timestamp,
                "electricity_kwh": r.electricity_kwh,
                "hvac_kwh": r.hvac_kwh,
                "lighting_kwh": r.lighting_kwh,
                "equipment_kwh": r.equipment_kwh,
                "water_l": r.water_l,
            }
            for r in rows
            if not (r.timestamp.hour == 12 and r.timestamp.minute == 0)  # exclude daily noon rows
        ]
    ).iloc[:72]
    if df.empty:
        return df
    df["hour"] = df["ts"].dt.hour
    df["weekday"] = df["ts"].dt.weekday
    return df


def _daily_df(session: Session, facility_id: int) -> pd.DataFrame:
    rows = (
        session.query(EnergyUsage)
        .filter(EnergyUsage.facility_id == facility_id, EnergyUsage.is_forecast == False)  # noqa: E712
        .order_by(EnergyUsage.timestamp)
        .all()
    )
    df = pd.DataFrame(
        [
            {"ts": r.timestamp, "electricity_kwh": r.electricity_kwh}
            for r in rows
            if r.timestamp.hour == 12 and r.timestamp.minute == 0  # daily series is noon-stamped
        ]
    )
    if df.empty:
        return df
    df["day"] = (df["ts"] - df["ts"].min()).dt.days
    df["weekday"] = df["ts"].dt.weekday
    df["weekend"] = (df["ts"].dt.weekday >= 5).astype(int)
    df["sin"] = np.sin(df["day"] / 7.0 * 2 * np.pi)
    df["cos"] = np.cos(df["day"] / 7.0 * 2 * np.pi)
    return df


def _detect_anomalies(df: pd.DataFrame) -> list[dict]:
    if len(df) < 24:
        return []
    feats = df[["hour", "weekday", "electricity_kwh", "hvac_kwh"]].to_numpy()
    iso = IsolationForest(n_estimators=100, contamination=0.05, random_state=SEED)
    preds = iso.fit_predict(feats)
    baseline = df.groupby("hour")["electricity_kwh"].median().to_dict()
    anomalies = []
    for row, pred in zip(df.itertuples(index=False), preds):
        if pred == -1:
            base = baseline.get(row.hour, row.electricity_kwh) or row.electricity_kwh
            anomalies.append(
                {
                    "timestamp": row.ts.isoformat(),
                    "electricity_kwh": round(float(row.electricity_kwh), 1),
                    "hvac_kwh": round(float(row.hvac_kwh), 1),
                    "lift_pct": round(float((row.electricity_kwh - base) / base) * 100, 1),
                }
            )
    return anomalies


def _forecast_7d(df: pd.DataFrame) -> list[dict]:
    """LinearRegression over the 90-day daily series, rescaled to Tue==1.34 MWh."""
    if len(df) < 30:
        return []
    model = LinearRegression()
    X = df[["day", "weekend", "sin", "cos"]].to_numpy()
    model.fit(X, df["electricity_kwh"].to_numpy())
    start_day = int(df["day"].max()) + 1
    future = pd.DataFrame(
        {
            "day": range(start_day, start_day + 7),
            "weekend": [0, 0, 0, 0, 0, 1, 1],
            "sin": [np.sin((start_day + i) / 7.0 * 2 * np.pi) for i in range(7)],
            "cos": [np.cos((start_day + i) / 7.0 * 2 * np.pi) for i in range(7)],
        }
    )
    raw = model.predict(future[["day", "weekend", "sin", "cos"]].to_numpy())
    days = pd.date_range(df["ts"].max().normalize() + pd.Timedelta(days=1), periods=7)
    tuesday_idx = int(next(i for i, d in enumerate(days) if d.weekday() == 1))
    raw_tue = float(raw[tuesday_idx])
    scale = TUESDAY_PEAK_KWH / raw_tue if raw_tue > 0 else 1.0
    scaled = raw * scale
    return [
        {
            "date": d.date().isoformat(),
            "weekday": d.strftime("%a"),
            "electricity_kwh": round(float(v), 1),
            "is_peak": bool(d.weekday() == 1),
        }
        for d, v in zip(days, scaled)
    ]


def run(session: Session, facility_id: int) -> dict:
    hourly = _hourly_df(session, facility_id)
    daily = _daily_df(session, facility_id)
    anomalies = _detect_anomalies(hourly)
    forecast = _forecast_7d(daily)

    split = {
        "hvac": 45,
        "lighting": 28,
        "equipment": 18,
        "other": 9,
    }
    return {
        "agent": "Energy Agent",
        "total_today_kwh": TOTAL_TODAY_KWH,
        "total_today_mwh": TOTAL_TODAY_KWH / 1000,
        "cost_savings": 156.80,
        "efficiency_score": 82,
        "carbon_reduction_pct": 15,
        "split": split,
        "hourly": [
            {
                "hour": int(r.ts.hour),
                "label": r.ts.strftime("%H:%M"),
                "electricity_kwh": round(float(r.electricity_kwh), 1),
                "hvac_kwh": round(float(r.hvac_kwh), 1),
                "lighting_kwh": round(float(r.lighting_kwh), 1),
                "equipment_kwh": round(float(r.equipment_kwh), 1),
                "water_l": round(float(r.water_l), 1),
            }
            for r in _hourly_df(session, facility_id).itertuples(index=False)
        ][-24:],
        "anomalies": anomalies,
        "anomaly_count_today": len([a for a in anomalies if a["timestamp"].startswith(pd.Timestamp.now().date().isoformat())]),
        "forecast": forecast,
        "peak_day": next((f for f in forecast if f["is_peak"]), None),
    }
