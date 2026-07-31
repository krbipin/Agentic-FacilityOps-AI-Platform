"""Canonical seed data for the Agentic FacilityOps AI Platform.

Generates the deterministic dataset that reproduces every canonical KPI from
UI-UX-Specs/ and the project XML: 2,450 assets, energy time-series, occupancy
zones, security events, cost budgets, alerts and work orders.
"""
from __future__ import annotations

import random
from datetime import date, datetime, timedelta

import numpy as np
from sqlalchemy.orm import Session

from .models import (
    Alert,
    Asset,
    AuditLog,
    CostReport,
    EnergyUsage,
    Facility,
    MaintenanceRecord,
    OccupancyRecord,
    Recommendation,
    SecurityEvent,
    User,
    WorkOrder,
)

SEED = 20260731
FACILITY_NAME = "Corporate HQ & IT Park"

_TODAY = date.today()
_NOW = datetime.now()


# ────────────────────────────────────────────────────────────────────
# Facilities & users
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
    session.add(
        User(
            name="Alex Morgan",
            email="alex.morgan@facilityops.ai",
            role="Facility Manager",
            password_hash="demo-hash",
        )
    )
    session.add(
        User(name="Samira Patel", email="s.patel@facilityops.ai", role="Technician", password_hash="demo-hash")
    )
    session.add(
        User(name="James Doe", email="j.doe@facilityops.ai", role="Director", password_hash="demo-hash")
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
MANUFACTURERS = ["Carrier", "Daikin", "Siemens", "Johnson Controls", "Trane", "Grundfos", "KONE", "Schneider", "Toshiba", "ABB"]
LOCATIONS = ["Floor 2 Plant", "Basement", "Tower A", "Bldg B Roof", "Bldg C", "Floor 5", "Data Center", "Parking L1", "Lobby", "Server Room A"]

SAMPLE_ASSETS = [
    # (id, name, type, location, status, score, last_maint, next_due)
    ("AST-1042", "AHU-4", "HVAC", "Floor 2 Plant", "Critical", 42, date(_TODAY.year, 7, 12), None),
    ("AST-1043", "Chiller-2", "HVAC", "Basement", "Warning", 61, date(_TODAY.year, 6, 28), date(_TODAY.year, 8, 8)),
    ("AST-1188", "Gen-7", "Generator", "Bldg B Roof", "Good", 78, date(_TODAY.year, 5, 2), date(_TODAY.year, 8, 22)),
    ("AST-2031", "Elev-4", "Elevator", "Tower A", "Excellent", 95, date(_TODAY.year, 7, 20), date(_TODAY.year, 10, 15)),
    ("AST-3044", "VRF-12", "HVAC", "Bldg C", "Excellent", 97, date(_TODAY.year, 6, 11), date(_TODAY.year, 9, 30)),
]

# Distribution target: Excellent 1,667 (68%), Good 538 (22%), Warning 196 (8%), Critical 49 (2%)
TARGET_DIST = {"Excellent": 1667, "Good": 538, "Warning": 196, "Critical": 49}

_HEALTH_RANGE = {
    "Excellent": (90, 99),
    "Good": (75, 89),
    "Warning": (55, 74),
    "Critical": (40, 54),
}
_STATUS_NEXT_DAYS = {
    "Excellent": (75, 150),
    "Good": (40, 90),
    "Warning": (15, 35),
    "Critical": (-5, 2),  # mostly overdue
}


def _seed_assets(session: Session, facility: Facility) -> None:
    rng = np.random.default_rng(SEED)
    rnd = random.Random(SEED)

    # Pool of statuses for the 2,445 generated assets (after the 5 samples).
    remaining = dict(TARGET_DIST)
    for _, _, _, _, status, _, _, _ in SAMPLE_ASSETS:
        remaining[status] -= 1
    pool: list[str] = []
    for status, count in remaining.items():
        pool.extend([status] * count)
    rng.shuffle(pool)

    existing_ids = set()
    sample_map: dict[str, tuple] = {}
    for row in SAMPLE_ASSETS:
        sample_map[row[0]] = row

    # Build generated rows (2445), skipping codes that collide with sample ids.
    generated = []
    code = 1001
    while len(generated) < 2445:
        asset_id = f"AST-{code}"
        if asset_id in sample_map:
            code += 1
            continue
        asset_type = rng.choice(ASSET_TYPES, p=TYPE_WEIGHTS)
        prefix = rnd.choice(TYPE_PREFIX[asset_type])
        number = rng.integers(1, 40)
        name = f"{prefix}-{number}"
        status = pool.pop()
        lo, hi = _HEALTH_RANGE[status]
        score = int(rng.integers(lo, hi))
        install_years = int(rng.integers(2, 18))
        install = _TODAY - timedelta(days=365 * install_years)
        low, high = _STATUS_NEXT_DAYS[status]
        last = _TODAY - timedelta(days=int(rng.integers(20, 400)))
        if high >= 0:
            next_due = _TODAY + timedelta(days=int(rng.integers(low, high)))
        else:
            next_due = last + timedelta(days=int(rng.integers(20, 120)))
        generated.append(
            Asset(
                id=asset_id,
                facility_id=facility.id,
                name=name,
                asset_type=asset_type,
                location=rnd.choice(LOCATIONS),
                status=status,
                health_score=score,
                install_date=install,
                manufacturer=rnd.choice(MANUFACTURERS),
                useful_life_pct=round(rng.uniform(20, 95), 1),
                last_maintenance=last,
                next_due=next_due,
            )
        )
        code += 1
    session.add_all(generated)

    # Canonical sample assets (added after so distribution already satisfied).
    for asset_id, name, asset_type, location, status, score, last, next_due in SAMPLE_ASSETS:
        session.add(
            Asset(
                id=asset_id,
                facility_id=facility.id,
                name=name,
                asset_type=asset_type,
                location=location,
                status=status,
                health_score=score,
                install_date=_TODAY - timedelta(days=365 * 7),
                manufacturer=MANUFACTURERS[0],
                useful_life_pct=round(score / 1.4, 1),
                last_maintenance=last,
                next_due=next_due,
            )
        )
    session.flush()


def _seed_maintenance(session: Session, facility: Facility) -> None:
    rng = np.random.default_rng(SEED + 1)
    issues = ["Filter clean", "Vibration excessive", "Refrigerant recharge", "Bearing inspection",
              "Belt replacement", "Coil cleaning", "Door sensor fault", "Firmware update"]
    technicians = ["SM", "JD", "AP", "KS", "RL", "TC"]

    sample_assets = [a for a in session.query(Asset).filter(Asset.facility_id == facility.id).all() if a.id in {r[0] for r in SAMPLE_ASSETS}]

    # History for sample assets (5 rows each, last = asset.last_maintenance).
    for asset in sample_assets:
        base = asset.last_maintenance
        for i in range(5):
            session.add(
                MaintenanceRecord(
                    asset_id=asset.id,
                    issue_type=rng.choice(issues),
                    maintenance_date=base - timedelta(days=90 * i + int(rng.integers(5, 60))),
                    cost=round(float(rng.uniform(180, 2600)), 0),
                    technician=rng.choice(technicians),
                    status="Completed",
                )
            )

    # Sparse history for a sample of other assets.
    other_assets = [a for a in session.query(Asset).filter(Asset.facility_id == facility.id).all() if a.id not in {r[0] for r in SAMPLE_ASSETS}]
    rng.shuffle(other_assets)
    for asset in other_assets[:420]:
        for _ in range(int(rng.integers(1, 4))):
            days = int(rng.integers(15, 700))
            session.add(
                MaintenanceRecord(
                    asset_id=asset.id,
                    issue_type=rng.choice(issues),
                    maintenance_date=_TODAY - timedelta(days=days),
                    cost=round(float(rng.uniform(120, 3200)), 0),
                    technician=rng.choice(technicians),
                    status="Completed",
                )
            )
    session.flush()


# ────────────────────────────────────────────────────────────────────
# Energy usage
# ────────────────────────────────────────────────────────────────────
def _seed_energy(session: Session, facility: Facility) -> None:
    rng = np.random.default_rng(SEED + 2)

    # Daily series: 90 days historical ending today at exactly 1,280 kWh (1.28 MWh).
    day_idx = np.arange(90)
    weekday = np.array([(_TODAY - timedelta(days=89 - i)).weekday() for i in range(90)])
    weekend = (weekday >= 5).astype(float)
    trend = np.linspace(1.06, 0.96, 90)  # slight downward trend (fueling the ▼4%)
    seasonal = np.sin(day_idx / 7.0 * 2 * np.pi) * 0.03
    noise = rng.normal(0, 0.03, 90)
    daily_kwh = 1280.0 * trend * (1.0 - 0.16 * weekend + seasonal + noise)

    for i, kwh in enumerate(daily_kwh):
        ts = datetime.combine(_TODAY - timedelta(days=89 - i), datetime.min.time()) + timedelta(hours=12)
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

    # Force today to exactly 1,280 kWh with canonical split.
    today_row = (
        session.query(EnergyUsage)
        .filter(EnergyUsage.facility_id == facility.id)
        .order_by(EnergyUsage.timestamp.desc())
        .first()
    )
    if today_row:
        today_row.electricity_kwh = 1280.0
        today_row.hvac_kwh = 576.0
        today_row.lighting_kwh = 358.4
        today_row.equipment_kwh = 230.4

    # Forecast: next 7 days, Tuesday peak 1.34 MWh.
    base = 1280.0
    for i in range(1, 8):
        d = _TODAY + timedelta(days=i)
        dow = d.weekday()
        peak = 1.06 if dow == 1 else (0.94 if dow >= 5 else 1.0)
        session.add(
            EnergyUsage(
                facility_id=facility.id,
                timestamp=datetime.combine(d, datetime.min.time()) + timedelta(hours=12),
                electricity_kwh=round(base * peak, 1),
                water_l=round(base * 3.9, 1),
                hvac_kwh=round(base * peak * 0.45, 1),
                lighting_kwh=round(base * peak * 0.28, 1),
                equipment_kwh=round(base * peak * 0.18, 1),
                is_forecast=True,
            )
        )

    # Hourly series: last 72h with diurnal pattern; inject AHU-4 anomaly at 14:00 today.
    hour_start = datetime.combine(_TODAY, datetime.min.time()) - timedelta(days=2)
    for h in range(72):
        ts = hour_start + timedelta(hours=h)
        hour = ts.hour
        # occupancy-ish diurnal curve, peak ~15:00
        curve = 0.55 + 0.5 * np.exp(-((hour - 14.5) ** 2) / 18.0)
        hour_kwh = 62.0 * curve * rng.uniform(0.94, 1.06)
        if ts.date() == _TODAY and hour == 14:
            hour_kwh *= 1.18  # AHU-4 draw 18% above baseline
        session.add(
            EnergyUsage(
                facility_id=facility.id,
                timestamp=ts,
                electricity_kwh=round(float(hour_kwh), 1),
                water_l=round(float(hour_kwh * rng.uniform(0.4, 0.6)), 1),
                hvac_kwh=round(float(hour_kwh * 0.62), 1),
                lighting_kwh=round(float(hour_kwh * 0.22), 1),
                equipment_kwh=round(float(hour_kwh * 0.16), 1),
                is_forecast=False,
            )
        )
    session.flush()


# ────────────────────────────────────────────────────────────────────
# Occupancy
# ────────────────────────────────────────────────────────────────────
ZONE_DEFS = [
    ("Office Floors", 1148, 1400, 0.82),
    ("Meeting Rooms", 260, 400, 0.65),
    ("Common Areas", 144, 300, 0.48),
    ("Parking", 56, 150, 0.37),
]


def _seed_occupancy(session: Session, facility: Facility) -> None:
    rng = np.random.default_rng(SEED + 3)
    for zone, count, capacity, _ in ZONE_DEFS:
        # 30-day history approaching today's canonical counts.
        hist = np.linspace(int(count * 0.8), count, 30).astype(int)
        for i, c in enumerate(hist):
            ts = datetime.combine(_TODAY - timedelta(days=29 - i), datetime.min.time()) + timedelta(hours=12)
            session.add(
                OccupancyRecord(
                    facility_id=facility.id,
                    zone=zone,
                    occupancy_count=int(c),
                    capacity=capacity,
                    timestamp=ts,
                )
            )
        session.add(
            OccupancyRecord(
                facility_id=facility.id,
                zone=zone,
                occupancy_count=int(count),
                capacity=capacity,
                timestamp=datetime.combine(_TODAY, datetime.min.time()) + timedelta(hours=15),
            )
        )
    session.flush()


# ────────────────────────────────────────────────────────────────────
# Security events
# ────────────────────────────────────────────────────────────────────
SECURITY_SAMPLES = [
    ("Unauthorized access", "Red", "Unauthorized entry — Loading Dock B", "Loading Dock B", "Open"),
    ("Badge clone", "Red", "Badge duplication detected — Server Room A", "Server Room A", "Investigating"),
    ("After-hours", "Amber", "After-hours access — Office 5", "Office 5", "Investigating"),
    ("Visitor", "Blue", "Visitor check-in — Front Desk", "Front Desk", "Closed"),
]


def _seed_security(session: Session, facility: Facility) -> None:
    rng = np.random.default_rng(SEED + 4)
    other_types = [
        ("Access granted", "Blue", "Access granted — turnstile"),
        ("Motion", "Blue", "Perimeter motion detected"),
        ("Door left ajar", "Amber", "Door ajar alert"),
        ("CCTV flag", "Amber", "CCTV motion anomaly"),
        ("Access denied", "Blue", "Access attempt denied"),
    ]
    locations = ["Lobby", "Tower A", "Bldg B", "Data Center", "Parking L1", "Floor 3", "Server Room A", "Loading Dock B"]

    # Today's 18 incidents (4 from samples + 14 generated; exactly 4 unauthorized total).
    events = []
    for event_type, severity, title, location, status in SECURITY_SAMPLES:
        events.append((event_type, severity, title, location, status, _NOW - timedelta(minutes=41 if severity == "Blue" else 26 if severity == "Amber" else 2)))
    while sum(1 for e in events if e[1] == "Red") < 4:
        etype, sev, title = rng.choice(other_types)
        if etype == "Access denied":
            etype = "Unauthorized access"
            sev = "Red"
        events.append((etype, sev, title, rng.choice(locations), "Open", _NOW - timedelta(minutes=int(rng.integers(3, 90)))))
    while len(events) < 18:
        etype, sev, title = rng.choice(other_types)
        events.append((etype, sev, title, rng.choice(locations), "Open", _NOW - timedelta(minutes=int(rng.integers(5, 240)))))

    for event_type, severity, title, location, status, ts in events:
        session.add(
            SecurityEvent(
                facility_id=facility.id,
                event_type=event_type,
                severity=severity,
                title=title,
                location=location,
                timestamp=ts,
                status=status,
            )
        )
    session.flush()


# ────────────────────────────────────────────────────────────────────
# Cost reports
# ────────────────────────────────────────────────────────────────────
COST_CURRENT = [
    ("Energy", 156560, 165000),
    ("Maintenance", 103000, 110000),
    ("Security Ops", 74160, 80000),
    ("Administrative", 78280, 75000),
]


def _seed_cost(session: Session, facility: Facility) -> None:
    rng = np.random.default_rng(SEED + 5)
    # 6 months history per category ending with canonical current-month values.
    for category, amount, budget in COST_CURRENT:
        for m in range(5, -1, -1):
            year = _TODAY.year if _TODAY.month - m > 0 else _TODAY.year - 1
            month = _TODAY.month - m if _TODAY.month - m > 0 else _TODAY.month - m + 12
            if m == 0:
                amt, bud = amount, budget
            else:
                factor = 1.0 + 0.06 * m + rng.uniform(-0.03, 0.03)
                amt = round(amount / factor)
                bud = budget
            session.add(
                CostReport(
                    facility_id=facility.id,
                    category=category,
                    amount=amt,
                    budget=bud,
                    report_date=date(year, month, 1),
                )
            )
    session.flush()


# ────────────────────────────────────────────────────────────────────
# Alerts (89: 12 open / 18 acked / 59 resolved)
# ────────────────────────────────────────────────────────────────────
ALERT_TEMPLATES = [
    ("Energy", "AHU-4 draw 18% above baseline", "HVAC draw exceeding expected load; investigate schedule.", "Energy Agent", "Critical"),
    ("Energy", "After-hours lighting zone active", "Lighting bank 3 active during unoccupied window.", "Energy Agent", "Warning"),
    ("Energy", "Peak demand approaching forecast", "Tuesday peak projected at 1.34 MWh.", "Energy Agent", "Info"),
    ("Maintenance", "Chiller-2 refrigerant pressure low", "Predicted failure in ~6 days.", "Maintenance Agent", "Critical"),
    ("Maintenance", "VRF-12 filter service due", "Scheduled preventive maintenance window.", "Maintenance Agent", "Warning"),
    ("Maintenance", "Elev-4 door sensor drift", "Intermittent door sensor readings.", "Maintenance Agent", "Warning"),
    ("Occupancy", "Office 5 crowding threshold", "Occupancy above 90% comfort threshold.", "Occupancy Agent", "Warning"),
    ("Occupancy", "Parking occupancy spike", "Parking L1 at 85% capacity during shift change.", "Occupancy Agent", "Warning"),
    ("Occupancy", "Meeting room utilization drop", "Booking rate down 12% this week.", "Occupancy Agent", "Info"),
    ("Security", "Badge clone attempt blocked", "Duplicate badge credential rejected.", "Security Agent", "Critical"),
    ("Security", "After-hours access Office 5", "Access outside working hours logged.", "Security Agent", "Warning"),
    ("Security", "Door ajar — Bldg B", "Loading dock door open 8 min.", "Security Agent", "Warning"),
    ("Cost", "Administrative budget over", "Administrative spend 4% over budget.", "Cost Optimization Agent", "Critical"),
    ("Cost", "Vendor contract renewal", "Janitorial contract renews in 30 days.", "Cost Optimization Agent", "Info"),
]

CHANNELS = {
    "Critical": ["Email", "SMS", "Teams", "Slack"],
    "Warning": ["Email", "Teams"],
    "Info": ["Email"],
}


def _seed_alerts(session: Session, facility: Facility) -> None:
    rng = np.random.default_rng(SEED + 6)
    # 12 open: 4 Critical, 7 Warning, 1 Info
    open_alerts = []
    templates = list(ALERT_TEMPLATES)
    criticals = [t for t in templates if t[4] == "Critical"][:4]
    warnings = [t for t in templates if t[4] == "Warning"][:7]
    infos = [t for t in templates if t[4] == "Info"][:1]
    for severity_pool in (criticals, warnings, infos):
        for alert_type, title, message, agent, sev in severity_pool:
            open_alerts.append((alert_type, title, message, agent, sev, "Open"))

    # 18 acknowledged + 59 resolved drawn from the same templates deterministically.
    others = []
    for i in range(18):
        alert_type, title, message, agent, sev = templates[i % len(templates)]
        others.append((alert_type, title, message, agent, sev, "Acknowledged"))
    for i in range(59):
        alert_type, title, message, agent, sev = templates[(i * 7) % len(templates)]
        others.append((alert_type, title, message, agent, sev, "Resolved"))

    rng.shuffle(others)
    for i, (alert_type, title, message, agent, sev, status) in enumerate(open_alerts + others):
        created = _NOW - timedelta(hours=int(rng.integers(1, 24 * 14)))
        session.add(
            Alert(
                facility_id=facility.id,
                alert_type=alert_type,
                severity=sev,
                title=title,
                message=message,
                agent=agent,
                status=status,
                channels=CHANNELS[sev],
                created_at=created,
            )
        )
    session.flush()


# ────────────────────────────────────────────────────────────────────
# Work orders (89: 24 open / 18 in progress / 15 scheduled / 32 completed)
# ────────────────────────────────────────────────────────────────────
WO_SAMPLES = [
    ("WO-1042", "AST-1042", "Vibration excessive", "P1", "AI-predicted", "Open", None, 2.0, 92.0),
    ("WO-1041", "AST-2031", "Door sensor fault", "P2", "Manual", "Open", "SM", 1.5, None),
    ("WO-1038", "AST-1043", "Refrigerant recharge", "P2", "AI-predicted", "Scheduled", "JD", 3.0, 92.0),
    ("WO-1035", "AST-1188", "Bearing inspection", "P3", "AI-predicted", "Scheduled", "AP", 4.0, 92.0),
    ("WO-1029", "AST-3044", "Filter clean", "P3", "Manual", "Completed", "KS", 1.0, None),
]
WO_STATUS_COUNTS = {"Open": 24, "In Progress": 18, "Scheduled": 15, "Completed": 32}
WO_TITLES = ["Filter clean", "Vibration check", "Coil cleaning", "Belt replacement", "Sensor calibration", "Lubrication", "Pressure test", "Firmware update"]
WO_PRIORITIES = ["P1", "P2", "P3"]
WO_TECHNICIANS = ["SM", "JD", "AP", "KS", "RL", "TC"]


def _seed_work_orders(session: Session, facility: Facility) -> None:
    rng = np.random.default_rng(SEED + 7)
    asset_ids = [a.id for a in session.query(Asset).filter(Asset.facility_id == facility.id).all()]

    remaining = dict(WO_STATUS_COUNTS)
    # count samples into statuses
    for _, _, _, _, _, status, _, _, _ in WO_SAMPLES:
        remaining[status] -= 1

    # 12 AI-predicted total: the 3 AI-predicted samples + 9 more.
    ai_count_needed = 9

    rows = []
    code = 1001
    while len(rows) < 89:
        wo_id = f"WO-{code}"
        sample = next((s for s in WO_SAMPLES if s[0] == wo_id), None)
        if sample:
            _, asset_id, title, priority, source, status, assignee, hours, conf = sample
            rows.append((wo_id, asset_id, title, priority, source, status, assignee, hours, conf, _TODAY))
            code += 1
            continue
        # generate
        status_pool = [s for s, c in remaining.items() if c > 0]
        if not status_pool:
            break
        status = rng.choice(status_pool)
        remaining[status] -= 1
        is_ai = ai_count_needed > 0 and status in ("Open", "Scheduled", "In Progress")
        if is_ai:
            ai_count_needed -= 1
        source = "AI-predicted" if is_ai else "Manual"
        due = _TODAY if status in ("Open", "In Progress") else _TODAY + timedelta(days=int(rng.integers(1, 20)))
        if status == "Completed":
            due = _TODAY - timedelta(days=int(rng.integers(1, 30)))
        rows.append(
            (
                wo_id,
                rng.choice(asset_ids),
                rng.choice(WO_TITLES),
                rng.choice(WO_PRIORITIES),
                source,
                status,
                rng.choice(WO_TECHNICIANS),
                round(float(rng.uniform(0.5, 6.0)), 1),
                92.0 if is_ai else None,
                due,
            )
        )
        code += 1

    for wo_id, asset_id, title, priority, source, status, assignee, hours, conf, due in rows:
        session.add(
            WorkOrder(
                id=wo_id,
                asset_id=asset_id,
                title=title,
                issue_type=title,
                priority=priority,
                source=source,
                status=status,
                assignee=assignee,
                due_date=due,
                estimated_hours=hours,
                confidence=conf,
                completion_note="Completed by technician." if status == "Completed" else None,
            )
        )
    session.flush()


# ────────────────────────────────────────────────────────────────────
# Recommendations + audit
# ────────────────────────────────────────────────────────────────────
RECOMMENDATIONS = [
    ("Cost Optimization Agent", "Optimize HVAC schedule across floors 2–4", "$4,800/mo", "Proposed"),
    ("Cost Optimization Agent", "Renegotiate janitorial vendor contract", "$3,200/mo", "Proposed"),
    ("Cost Optimization Agent", "Shift data-center load to off-peak energy", "$2,100/mo", "Proposed"),
    ("Energy Agent", "Dim lighting bank 3 during unoccupied windows", "$950/mo", "Proposed"),
    ("Maintenance Agent", "Consolidate AHU-4 replacement with scheduled shutdown", "12 h saved", "Proposed"),
]


def _seed_recommendations(session: Session) -> None:
    for i, (agent, title, impact, status) in enumerate(RECOMMENDATIONS):
        session.add(
            Recommendation(
                agent=agent,
                title=title,
                impact=impact,
                status=status,
                date=_TODAY - timedelta(days=i * 2),
            )
        )
    session.add(AuditLog(user_id=None, action="seed", details="Canonical dataset loaded", created_at=_NOW))


# ────────────────────────────────────────────────────────────────────
def seed(session: Session) -> None:
    facility = _seed_facility(session)
    _seed_users(session)
    _seed_assets(session, facility)
    _seed_maintenance(session, facility)
    _seed_energy(session, facility)
    _seed_occupancy(session, facility)
    _seed_security(session, facility)
    _seed_cost(session, facility)
    _seed_alerts(session, facility)
    _seed_work_orders(session, facility)
    _seed_recommendations(session)
    session.commit()
