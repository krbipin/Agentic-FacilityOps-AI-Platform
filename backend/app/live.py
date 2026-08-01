"""LiveSimulator: advances the facility's simulated data stream to "now".

Every dashboard request calls `advance()` which lazily generates the missing
1-minute ticks between the last stored reading and the current wall clock:

- EnergyUsage: minute-level consumption (diurnal + noise, live HVAC/lighting split)
- OccupancyRecord: per-zone snapshot each minute
- SecurityEvent: probabilistic incidents (~1/hour)
- Alert: auto-created when a live threshold is crossed (energy anomaly,
  occupancy crowding, Red security event) — numbers embedded are computed.

Generation is deterministic per (facility_id, timestamp) so any worker/retry
produces identical rows (idempotent). Catch-up is capped to avoid DB blowups
after long downtime.
"""
from __future__ import annotations

import math
import random
from datetime import datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from .config_store import config_float, get_config
from .models import Alert, EnergyUsage, OccupancyRecord, SecurityEvent

ZONE_CAPACITY: dict[str, int] = {
    "Office Floors": 1400,
    "Meeting Rooms": 400,
    "Common Areas": 300,
    "Parking": 150,
}
ZONE_PEAK_UTIL: dict[str, float] = {
    "Office Floors": 0.72,
    "Meeting Rooms": 0.55,
    "Common Areas": 0.42,
    "Parking": 0.36,
}

SECURITY_TYPES: list[tuple[str, str, str, float]] = [
    ("Access granted", "Blue", "Access granted — turnstile", 0.30),
    ("Motion", "Blue", "Perimeter motion detected", 0.20),
    ("Access denied", "Blue", "Access attempt denied", 0.15),
    ("Door left ajar", "Amber", "Door ajar alert", 0.12),
    ("CCTV flag", "Amber", "CCTV motion anomaly", 0.10),
    ("After-hours", "Amber", "After-hours access logged", 0.08),
    ("Badge clone", "Red", "Badge duplication attempt", 0.03),
    ("Unauthorized access", "Red", "Unauthorized entry attempt", 0.02),
]
LOCATIONS = ["Lobby", "Tower A", "Bldg B", "Data Center", "Parking L1", "Floor 3", "Server Room A", "Loading Dock B"]


def _rng_for(facility_id: int, ts: datetime) -> random.Random:
    seed = (facility_id * 1_000_003) ^ int(ts.replace(tzinfo=None).timestamp())
    return random.Random(seed)


def day_factor(hour_frac: float) -> float:
    """Occupancy-shaped diurnal curve 0..~1; ~0 overnight. Runs a business day
    every day (weekends included) so the live demo stays lively year-round."""
    f = 0.5 + 0.55 * math.exp(-((hour_frac - 14.5) ** 2) / 20.0)
    if hour_frac < 7.0 or hour_frac >= 21.0:
        f *= 0.15
    elif hour_frac < 9.0:
        f *= max(0.2, (hour_frac - 7.0) / 2.0)
    elif hour_frac >= 18.0:
        f *= max(0.2, (21.0 - hour_frac) / 3.0)
    return f


def energy_row_kwh(ts: datetime, rng: random.Random) -> float:
    hour_frac = ts.hour + ts.minute / 60.0
    return max(0.0, 1.75 * day_factor(hour_frac) * rng.uniform(0.90, 1.10))


def occupancy_count(zone: str, ts: datetime, rng: random.Random) -> int:
    cap = ZONE_CAPACITY[zone]
    hour_frac = ts.hour + ts.minute / 60.0
    c = cap * ZONE_PEAK_UTIL[zone] * day_factor(hour_frac) * rng.uniform(0.85, 1.15)
    return int(max(0, min(cap, c)))


def _security_event(facility_id: int, ts: datetime, rng: random.Random) -> dict | None:
    if rng.random() >= 0.012:
        return None
    picks = [t for t in SECURITY_TYPES for _ in range(int(t[3] * 100))]
    etype, sev, title, _ = rng.choice(picks)
    return {
        "event_type": etype,
        "severity": sev,
        "title": title,
        "location": rng.choice(LOCATIONS),
        "timestamp": ts,
        "status": "Open" if sev != "Blue" else "Closed",
    }


def _is_live_ts(ts: datetime) -> bool:
    """Minute series never writes a row at exactly 12:00 (noon rows are the
    daily-summary series used for trends/correlation)."""
    return not (ts.hour == 12 and ts.minute == 0)


def _last_live_ts(session: Session, facility_id: int) -> datetime | None:
    row = (
        session.query(EnergyUsage.timestamp)
        .filter(EnergyUsage.facility_id == facility_id, EnergyUsage.is_forecast.is_(False))
        .order_by(EnergyUsage.timestamp.desc())
        .first()
    )
    return row[0] if row else None


def _recent_alert(session: Session, facility_id: int, agent: str, title: str, minutes: int = 60) -> bool:
    cutoff = datetime.utcnow() - timedelta(minutes=minutes)
    return bool(
        session.query(Alert)
        .filter(
            Alert.facility_id == facility_id,
            Alert.agent == agent,
            Alert.title == title,
            Alert.status == "Open",
            Alert.created_at >= cutoff,
        )
        .first()
    )


def _energy_hour_baselines(session: Session, facility_id: int) -> dict[int, float]:
    """Median kWh per hour-of-day from the trailing 3-day minute series (one grouped query)."""
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
            func.extract("minute", EnergyUsage.timestamp) != 0,
        )
        .group_by(func.extract("hour", EnergyUsage.timestamp))
        .all()
    )
    return {int(h): float(v) for h, v in rows}


def advance(session: Session, facility_id: int) -> None:
    cfg = get_config(session)
    tick_min = int(config_float(cfg, "sim.tick_minutes", 1.0) or 1)
    cap_min = int(config_float(cfg, "sim.catchup_cap_minutes", 240.0) or 240)
    threshold_pct = config_float(cfg, "energy.anomaly_threshold_pct", 12.0)
    comfort_pct = config_float(cfg, "occupancy.comfort_threshold_pct", 90.0)

    last = _last_live_ts(session, facility_id)
    if last is None:
        return
    now = datetime.utcnow()
    cap_start = now - timedelta(minutes=cap_min)
    start = max(last + timedelta(minutes=tick_min), cap_start)

    baselines = _energy_hour_baselines(session, facility_id)
    ts = start
    while ts <= now:
        if _is_live_ts(ts):
            rng = _rng_for(facility_id, ts)
            kwh = energy_row_kwh(ts, rng)
            session.add(
                EnergyUsage(
                    facility_id=facility_id,
                    timestamp=ts,
                    electricity_kwh=round(kwh, 2),
                    water_l=round(kwh * rng.uniform(3.0, 4.0), 1),
                    hvac_kwh=round(kwh * rng.uniform(0.58, 0.64), 2),
                    lighting_kwh=round(kwh * rng.uniform(0.20, 0.24), 2),
                    equipment_kwh=round(kwh * rng.uniform(0.13, 0.17), 2),
                    is_forecast=False,
                )
            )
            for zone, cap in ZONE_CAPACITY.items():
                session.add(
                    OccupancyRecord(
                        facility_id=facility_id,
                        zone=zone,
                        occupancy_count=occupancy_count(zone, ts, rng),
                        capacity=cap,
                        timestamp=ts,
                    )
                )

            event = _security_event(facility_id, ts, rng)
            if event:
                session.add(SecurityEvent(facility_id=facility_id, **event))
                if event["severity"] == "Red" and not _recent_alert(session, facility_id, "Security Agent", event["title"]):
                    session.add(
                        Alert(
                            facility_id=facility_id,
                            alert_type="Security",
                            severity="Critical",
                            title=event["title"],
                            message=f"{event['title']} at {event['location']} detected at {ts.strftime('%H:%M')}.",
                            agent="Security Agent",
                            status="Open",
                            channels=["Email", "SMS", "Teams", "Slack"],
                            created_at=ts,
                        )
                    )

            hour = ts.hour
            baseline = baselines.get(hour)
            if baseline and baseline > 0:
                deviation = (kwh - baseline) / baseline * 100.0
                title = f"Energy draw {deviation:+.0f}% vs baseline"
                if deviation > threshold_pct and not _recent_alert(session, facility_id, "Energy Agent", title):
                    session.add(
                        Alert(
                            facility_id=facility_id,
                            alert_type="Energy",
                            severity="Warning",
                            title=title,
                            message=f"Hourly consumption {deviation:.0f}% above the 3-day baseline for {hour:02d}:00.",
                            agent="Energy Agent",
                            status="Open",
                            channels=["Email", "Teams"],
                            created_at=ts,
                        )
                    )

            for zone, cap in ZONE_CAPACITY.items():
                count = occupancy_count(zone, ts, rng)
                util = count / cap * 100.0
                if util > comfort_pct:
                    title = f"{zone} above comfort threshold"
                    if not _recent_alert(session, facility_id, "Occupancy Agent", title):
                        session.add(
                            Alert(
                                facility_id=facility_id,
                                alert_type="Occupancy",
                                severity="Warning",
                                title=title,
                                message=f"{zone} at {util:.0f}% utilization (threshold {comfort_pct:.0f}%).",
                                agent="Occupancy Agent",
                                status="Open",
                                channels=["Email", "Teams"],
                                created_at=ts,
                            )
                        )

        ts += timedelta(minutes=tick_min)

    if start <= now:
        session.commit()
