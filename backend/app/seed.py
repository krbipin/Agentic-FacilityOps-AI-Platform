"""Natural seed data for the Agentic FacilityOps AI Platform.

Generates a realistic synthetic dataset (facilities, assets, energy, occupancy,
security, cost, work orders, alerts). No KPI is pinned to a demo constant —
values emerge from the data, and the LiveSimulator continues appending from
the seeded minute-level history.
"""
from __future__ import annotations

import random
from datetime import date, datetime, timedelta

import numpy as np
from sqlalchemy import func
from sqlalchemy.orm import Session

from .config_store import DEFAULTS, TEXT_DEFAULTS
from .live import ZONE_CAPACITY, _is_live_ts, _rng_for, _security_event, energy_row_kwh, occupancy_count
from .models import (
    Alert,
    Asset,
    AuditLog,
    CostReport,
    EnergyUsage,
    Facility,
    MaintenanceRecord,
    MeetingRoom,
    OccupancyRecord,
    Recommendation,
    SecurityEvent,
    SystemConfig,
    User,
    Vendor,
    Visitor,
    WorkOrder,
)

SEED = 20260731
FACILITY_NAME = "Corporate HQ & IT Park"

_NOW = datetime.utcnow()
_TODAY = _NOW.date()


# ────────────────────────────────────────────────────────────────────
# Facility / users / config
# ────────────────────────────────────────────────────────────────────
def _seed_facility(session: Session) -> Facility:
    facility = Facility(
        name=FACILITY_NAME,
        facility_type="Corporate HQ + IT Park",
        location="Bengaluru, India",
        is_active=True,
    )
    session.add(facility)
    session.flush()
    return facility


def _seed_users(session: Session) -> None:
    session.add(User(name="Alex Morgan", email="alex.morgan@facilityops.ai", role="Facility Manager", password_hash="demo-hash"))
    session.add(User(name="Samira Patel", email="s.patel@facilityops.ai", role="Technician", password_hash="demo-hash"))
    session.add(User(name="James Doe", email="j.doe@facilityops.ai", role="Director", password_hash="demo-hash"))


def _seed_config(session: Session) -> None:
    for key, val in {**DEFAULTS, **TEXT_DEFAULTS}.items():
        session.add(
            SystemConfig(
                key=key,
                value_float=val if isinstance(val, float) else None,
                value_str=None if isinstance(val, float) else val,
                description="",
            )
        )


# ────────────────────────────────────────────────────────────────────
# Assets (2,450) + maintenance history
# ────────────────────────────────────────────────────────────────────
ASSET_TYPES = ["HVAC", "Lighting", "Pumps", "Generators", "Elevators", "Access"]
TYPE_WEIGHTS = [0.30, 0.25, 0.15, 0.10, 0.10, 0.10]
TYPE_PREFIX = {
    "HVAC": ["AHU", "Chiller", "VRF", "RTU"],
    "Lighting": ["LTG"],
    "Pumps": ["PUM"],
    "Generators": ["GEN"],
    "Elevators": ["ELEV"],
    "Access": ["ACS"],
}
STATUS_WEIGHTS = {"Excellent": 0.60, "Good": 0.27, "Warning": 0.09, "Critical": 0.04}
HEALTH_RANGE = {
    "Excellent": (90, 99),
    "Good": (75, 89),
    "Warning": (55, 74),
    "Critical": (40, 54),
}
NEXT_DAYS = {
    "Excellent": (75, 150),
    "Good": (40, 90),
    "Warning": (15, 35),
    "Critical": (-5, 2),
}
MANUFACTURERS = ["Carrier", "Daikin", "Siemens", "Johnson Controls", "Trane", "Grundfos", "KONE", "Schneider", "Toshiba", "ABB"]
LOCATIONS = ["Floor 2 Plant", "Basement", "Tower A", "Bldg B Roof", "Bldg C", "Floor 5", "Data Center", "Parking L1", "Lobby", "Server Room A"]
ISSUES = ["Filter clean", "Vibration excessive", "Refrigerant recharge", "Bearing inspection",
          "Belt replacement", "Coil cleaning", "Door sensor fault", "Firmware update"]
TECHNICIANS = ["SM", "JD", "AP", "KS", "RL", "TC"]


def _seed_assets(session: Session, facility: Facility) -> None:
    rng = np.random.default_rng(SEED)
    rnd = random.Random(SEED)
    statuses = [s for s, w in STATUS_WEIGHTS.items() for _ in range(int(w * 100))]
    code = 1001
    for _ in range(2450):
        asset_type = rng.choice(ASSET_TYPES, p=TYPE_WEIGHTS)
        name = f"{rnd.choice(TYPE_PREFIX[asset_type])}-{int(rng.integers(1, 40))}"
        status = rnd.choice(statuses)
        lo, hi = HEALTH_RANGE[status]
        install_years = int(rng.integers(2, 18))
        low, high = NEXT_DAYS[status]
        last = _TODAY - timedelta(days=int(rng.integers(20, 400)))
        next_due = (
            _TODAY + timedelta(days=int(rng.integers(low, high)))
            if high >= 0
            else last + timedelta(days=int(rng.integers(20, 120)))
        )
        session.add(
            Asset(
                id=f"AST-{code}",
                facility_id=facility.id,
                name=name,
                asset_type=asset_type,
                location=rnd.choice(LOCATIONS),
                status=status,
                health_score=int(rng.integers(lo, hi)),
                install_date=_TODAY - timedelta(days=365 * install_years),
                manufacturer=rnd.choice(MANUFACTURERS),
                useful_life_pct=round(rng.uniform(20, 95), 1),
                last_maintenance=last,
                next_due=next_due,
            )
        )
        code += 1
    session.flush()


def _seed_maintenance(session: Session, facility: Facility) -> None:
    rng = np.random.default_rng(SEED + 1)
    assets = session.query(Asset).filter(Asset.facility_id == facility.id).all()
    for asset in assets:
        for _ in range(int(rng.integers(1, 4))):
            days = int(rng.integers(0, 28)) if rng.uniform() < 0.3 else int(rng.integers(15, 700))
            session.add(
                MaintenanceRecord(
                    asset_id=asset.id,
                    issue_type=rng.choice(ISSUES),
                    maintenance_date=_TODAY - timedelta(days=days),
                    cost=round(float(rng.uniform(120, 3200)), 0),
                    technician=rng.choice(TECHNICIANS),
                    status="Completed",
                )
            )
    session.flush()


# ────────────────────────────────────────────────────────────────────
# Energy: 90-day daily series + rolling 72h minute-level history
# ────────────────────────────────────────────────────────────────────
def _seed_energy(session: Session, facility: Facility) -> None:
    rng = np.random.default_rng(SEED + 2)

    for i in range(90):
        d = _TODAY - timedelta(days=89 - i)
        base = 1300.0 * (1.0 + 0.03 * np.sin(i / 7.0 * 2 * np.pi))
        kwh = base * (1.0 + float(rng.normal(0, 0.03)))
        ts = datetime.combine(d, datetime.min.time()) + timedelta(hours=12)
        session.add(
            EnergyUsage(
                facility_id=facility.id,
                timestamp=ts,
                electricity_kwh=round(float(kwh), 1),
                water_l=round(float(kwh * rng.uniform(3.4, 4.4)), 1),
                hvac_kwh=round(float(kwh * 0.45), 1),
                lighting_kwh=round(float(kwh * 0.28), 1),
                equipment_kwh=round(float(kwh * 0.18), 1),
                is_forecast=False,
            )
        )

    _minute_history(session, facility, hours=72)
    session.flush()


def _minute_history(session: Session, facility: Facility, hours: int = 72) -> None:
    start = (_NOW - timedelta(hours=hours)).replace(second=0, microsecond=0)
    ts = start
    while ts <= _NOW:
        if _is_live_ts(ts):
            rng = _rng_for(facility.id, ts)
            kwh = energy_row_kwh(ts, rng)
            session.add(
                EnergyUsage(
                    facility_id=facility.id,
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
                        facility_id=facility.id,
                        zone=zone,
                        occupancy_count=occupancy_count(zone, ts, rng),
                        capacity=cap,
                        timestamp=ts,
                    )
                )
        ts += timedelta(minutes=1)


# ────────────────────────────────────────────────────────────────────
# Occupancy: 30-day noon series (zone histories)
# ────────────────────────────────────────────────────────────────────
def _seed_occupancy(session: Session, facility: Facility) -> None:
    for zone, cap in ZONE_CAPACITY.items():
        for i in range(30):
            d = _TODAY - timedelta(days=29 - i)
            ts = datetime.combine(d, datetime.min.time()) + timedelta(hours=12)
            session.add(
                OccupancyRecord(
                    facility_id=facility.id,
                    zone=zone,
                    occupancy_count=occupancy_count(zone, ts, _rng_for(facility.id, ts)),
                    capacity=cap,
                    timestamp=ts,
                )
            )
    session.flush()


# ────────────────────────────────────────────────────────────────────
# Security events: trailing 7 days via the live generator
# ────────────────────────────────────────────────────────────────────
def _seed_security(session: Session, facility: Facility) -> None:
    start = (_NOW - timedelta(days=7)).replace(second=0, microsecond=0)
    ts = start
    while ts <= _NOW:
        if _is_live_ts(ts):
            ev = _security_event(facility.id, ts, _rng_for(facility.id, ts))
            if ev:
                session.add(SecurityEvent(facility_id=facility.id, **ev))
        ts += timedelta(minutes=1)
    session.flush()


# ────────────────────────────────────────────────────────────────────
# Cost: 6 months per category (current month under budget)
# ────────────────────────────────────────────────────────────────────
COST_BUDGETS = [("Energy", 165000), ("Maintenance", 110000), ("Security Ops", 80000), ("Administrative", 75000)]


def _seed_cost(session: Session, facility: Facility) -> None:
    rng = np.random.default_rng(SEED + 5)
    for category, budget in COST_BUDGETS:
        for m in range(5, -1, -1):
            year = _TODAY.year if _TODAY.month - m > 0 else _TODAY.year - 1
            month = _TODAY.month - m if _TODAY.month - m > 0 else _TODAY.month - m + 12
            if m == 0:
                amt = budget * rng.uniform(0.88, 0.96)
            else:
                amt = budget * (1.0 - 0.03 * m + rng.uniform(-0.03, 0.03))
            session.add(
                CostReport(
                    facility_id=facility.id,
                    category=category,
                    amount=round(amt),
                    budget=budget,
                    report_date=date(year, month, 1),
                )
            )
    session.flush()


# ────────────────────────────────────────────────────────────────────
# Work orders (natural backlog/history)
# ────────────────────────────────────────────────────────────────────
WO_STATUSES = ["Completed"] * 5 + ["Open"] * 2 + ["Scheduled"] * 15 + ["In Progress"] * 15


def _seed_work_orders(session: Session, facility: Facility) -> None:
    rng = np.random.default_rng(SEED + 7)
    asset_ids = [a.id for a in session.query(Asset).filter(Asset.facility_id == facility.id).all()]
    titles = ["Filter clean", "Vibration check", "Coil cleaning", "Belt replacement", "Sensor calibration", "Lubrication", "Pressure test", "Firmware update"]
    code = 1001
    for _ in range(64):
        status = rng.choice(WO_STATUSES)
        source = "AI-predicted" if rng.random() < 0.4 else "Manual"
        created = _NOW - timedelta(days=int(rng.integers(0, 60)), hours=int(rng.integers(0, 24)))
        due = created.date() + timedelta(days=int(rng.integers(1, 14)))
        if status == "Completed":
            due = created.date() - timedelta(days=int(rng.integers(1, 30)))
        session.add(
            WorkOrder(
                id=f"WO-{code}",
                asset_id=rng.choice(asset_ids),
                title=rng.choice(titles),
                issue_type=rng.choice(ISSUES),
                priority=rng.choice(["P1", "P2", "P3"]),
                source=source,
                status=status,
                assignee=rng.choice(TECHNICIANS),
                due_date=due,
                estimated_hours=round(float(rng.uniform(0.5, 6.0)), 1),
                confidence=round(float(rng.uniform(60.0, 98.0)), 1) if source == "AI-predicted" else None,
                created_at=created,
                completion_note="Completed by technician." if status == "Completed" else None,
            )
        )
        code += 1
    session.flush()


# ────────────────────────────────────────────────────────────────────
# Recommendations (qualitative; numeric impact estimated at runtime)
# ────────────────────────────────────────────────────────────────────
RECOMMENDATIONS = [
    ("Cost Optimization Agent", "Optimize HVAC schedule across occupied floors"),
    ("Cost Optimization Agent", "Renegotiate janitorial vendor contract"),
    ("Cost Optimization Agent", "Shift data-center load to off-peak energy"),
    ("Energy Agent", "Dim lighting banks during unoccupied windows"),
    ("Energy Agent", "Align HVAC schedules to live occupancy zones"),
    ("Maintenance Agent", "Consolidate AHU replacement with scheduled shutdown"),
    ("Security Agent", "Require 2FA on server room access"),
    ("Security Agent", "Resolve badge-duplication alert pattern"),
    ("Security Agent", "Enable night camera preset on loading dock"),
    ("Occupancy Agent", "Consolidate underused floors to one footprint"),
    ("Occupancy Agent", "Convert underused desks to focus pods"),
    ("Occupancy Agent", "Release low-utilization rooms to drop-in booking"),
]


def _seed_recommendations(session: Session) -> None:
    for i, (agent, title) in enumerate(RECOMMENDATIONS):
        session.add(
            Recommendation(
                agent=agent,
                title=title,
                impact="AI estimate",
                status="Proposed",
                date=_TODAY - timedelta(days=i * 2),
            )
        )
    session.add(AuditLog(user_id=None, action="seed", details="Dataset loaded", created_at=_NOW))


# ────────────────────────────────────────────────────────────────────
# Alerts: derived from the seeded data (energy deviation, crowding, Red events)
# ────────────────────────────────────────────────────────────────────
def _seed_alerts(session: Session, facility: Facility) -> None:
    cfg = {**DEFAULTS, **TEXT_DEFAULTS}

    # Energy: daily noon series — flag days above the trailing mean + threshold.
    daily = [
        (r.timestamp, r.electricity_kwh)
        for r in session.query(EnergyUsage)
        .filter(EnergyUsage.facility_id == facility.id, EnergyUsage.is_forecast.is_(False))
        .all()
        if r.timestamp.hour == 12 and r.timestamp.minute == 0
    ]
    vals = [v for _, v in daily]
    if len(vals) > 8:
        mean = float(np.mean(vals[:-7]))
        for ts, v in daily[-7:]:
            dev = (v - mean) / mean * 100 if mean else 0.0
            if dev > 12.0:
                session.add(
                    Alert(
                        facility_id=facility.id,
                        alert_type="Energy",
                        severity="Warning",
                        title=f"Energy draw {dev:+.0f}% vs baseline",
                        message=f"Daily consumption {dev:.0f}% above the trailing mean on {ts.date().isoformat()}.",
                        agent="Energy Agent",
                        status="Resolved",
                        channels=["Email", "Teams"],
                        created_at=ts,
                    )
                )

    # Occupancy: noon snapshots above the comfort ceiling.
    comfort = 90.0
    occ_rows = (
        session.query(OccupancyRecord)
        .filter(OccupancyRecord.facility_id == facility.id, func.extract("hour", OccupancyRecord.timestamp) == 12)
        .all()
    )
    for r in occ_rows:
        if r.capacity and r.occupancy_count / r.capacity * 100 > comfort:
            title = f"{r.zone} above comfort threshold"
            if not session.query(Alert).filter(Alert.title == title, Alert.created_at == r.timestamp).first():
                session.add(
                    Alert(
                        facility_id=facility.id,
                        alert_type="Occupancy",
                        severity="Warning",
                        title=title,
                        message=f"{r.zone} at {r.occupancy_count / r.capacity * 100:.0f}% utilization (threshold {comfort:.0f}%).",
                        agent="Occupancy Agent",
                        status="Resolved",
                        channels=["Email", "Teams"],
                        created_at=r.timestamp,
                    )
                )

    # Security: Red events → critical alerts.
    red_events = (
        session.query(SecurityEvent)
        .filter(SecurityEvent.facility_id == facility.id, SecurityEvent.severity == "Red")
        .all()
    )
    for e in red_events:
        session.add(
            Alert(
                facility_id=facility.id,
                alert_type="Security",
                severity="Critical",
                title=e.title,
                message=f"{e.title} at {e.location} ({e.timestamp.strftime('%d %b %H:%M')}).",
                agent="Security Agent",
                status="Resolved",
                channels=["Email", "SMS", "Teams", "Slack"],
                created_at=e.timestamp,
            )
        )
    session.flush()


# ────────────────────────────────────────────────────────────────────
# Meeting rooms / visitors / vendors
# ────────────────────────────────────────────────────────────────────
def _seed_meeting_rooms(session: Session, facility: Facility) -> None:
    for name, capacity, status, booked_at in [
        ("Boardroom B", 12, "Available", None),
        ("Conf 3A", 8, "Booked", "14:00"),
        ("Focus Pod 1", 2, "Available", None),
        ("Training Room", 24, "Booked", "10:00"),
        ("Quiet Room 4", 4, "Available", None),
    ]:
        session.add(
            MeetingRoom(
                facility_id=facility.id,
                name=name,
                capacity=capacity,
                utilization_pct=0,
                status=status,
                booked_at=booked_at,
            )
        )


def _seed_visitors(session: Session, facility: Facility) -> None:
    for name, company, purpose, status in [
        ("R. Sharma", "Schneider Electric", "HVAC audit", "Checked in"),
        ("L. Nguyen", "Siemens", "Firmware update", "On site"),
        ("P. Costa", "KONE", "Elevator PM", "On site"),
        ("A. Kim", "Dell", "Rack install", "Checked out"),
        ("M. Osei", "Grundfos", "Pump calibration", "Checked out"),
    ]:
        session.add(Visitor(facility_id=facility.id, name=name, company=company, purpose=purpose, status=status))


def _seed_vendors(session: Session, facility: Facility) -> None:
    for name, category, spend, trend in [
        ("Carrier Services", "Maintenance", 34200, 4.0),
        ("Bengaluru Power Co.", "Energy", 156000, -4.0),
        ("ClearSight Security", "Security Ops", 38800, 2.0),
        ("FacilityCare Janitorial", "Administrative", 41200, 6.0),
        ("KONE", "Elevator PM", 18900, 0.0),
    ]:
        session.add(Vendor(facility_id=facility.id, name=name, category=category, spend=spend, trend_pct=trend))


# ────────────────────────────────────────────────────────────────────
def seed(session: Session) -> None:
    facility = _seed_facility(session)
    _seed_users(session)
    _seed_config(session)
    _seed_assets(session, facility)
    _seed_maintenance(session, facility)
    _seed_energy(session, facility)
    _seed_occupancy(session, facility)
    _seed_security(session, facility)
    _seed_cost(session, facility)
    _seed_work_orders(session, facility)
    _seed_recommendations(session)
    _seed_alerts(session, facility)
    _seed_meeting_rooms(session, facility)
    _seed_visitors(session, facility)
    _seed_vendors(session, facility)
    session.commit()
