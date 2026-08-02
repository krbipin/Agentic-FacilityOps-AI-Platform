"""System configuration accessor.

Values live in the `system_config` table (seeded defaults, editable via
`/api/settings/config`). Used by agents/live-sim as *constants* (tariffs,
targets, thresholds) — dashboard KPIs are computed from data, never fabricated.
"""
from __future__ import annotations

from sqlalchemy.orm import Session

from .models import SystemConfig

DEFAULTS: dict[str, float] = {
    "energy.tariff_per_kwh": 0.122,          # $ per kWh utility tariff
    "energy.emission_factor_kg_per_kwh": 0.6,  # kg CO2-eq per kWh (grid mix)
    "energy.efficiency_target": 85,          # % target efficiency score
    "energy.hvac_setpoint_c": 22.5,          # target setpoint in °C
    "energy.anomaly_threshold_pct": 12.0,    # deviation % that flags an anomaly
    "occupancy.comfort_threshold_pct": 90.0, # utilization % comfort ceiling
    "security.controlled_doors": 142.0,
    "security.camera_uptime_pct": 99.98,
    "cost.roi_multiple": 6.2,                # realized-savings → ROI multiplier
    "cost.hourly_rate": 160.0,               # $ per technician-hour
    "sustainability.renewables_pct": 32.0,
    "work_orders.default_due_days": 7.0,
    "work_orders.default_hours": 2.0,
    "app.active_facility_id": 1.0,      # facility currently shown in the UI
    "app.seeded_facility_id": 1.0,      # facility that owns the synthetic sample dataset
    "sim.tick_minutes": 1.0,
    "sim.catchup_cap_minutes": 1440.0,
}

TEXT_DEFAULTS: dict[str, str] = {
    "alerts.escalation_l1": '{"level":"Level 1","role":"on-call","delay":"15 min","channels":["SMS","Email"]}',
    "alerts.escalation_l2": '{"level":"Level 2","role":"manager","delay":"1 hr","channels":["SMS","Teams"]}',
    "alerts.escalation_l3": '{"level":"Level 3","role":"director","delay":"4 hr","channels":["Email","phone"]}',
    "app.sample_data_note": "Synthetic 90-day sample dataset — every value on screen is computed live from this database (no hardcoded numbers).",
}


def _load(session: Session) -> dict[str, float | str | None]:
    rows = session.query(SystemConfig).all()
    out: dict[str, float | str | None] = {}
    for r in rows:
        out[r.key] = r.value_float if r.value_float is not None else r.value_str
    return out


def get_config(session: Session) -> dict[str, float | str | None]:
    """Merged config dict (DB values win over defaults; missing → defaults)."""
    merged: dict[str, float | str | None] = {**DEFAULTS, **TEXT_DEFAULTS}
    merged.update(_load(session))
    return merged


def config_float(cfg: dict[str, float | str | None], key: str, default: float = 0.0) -> float:
    val = cfg.get(key)
    return float(val) if isinstance(val, (int, float)) else default


def config_str(cfg: dict[str, float | str | None], key: str, default: str = "") -> str:
    val = cfg.get(key)
    return str(val) if isinstance(val, str) else default
