# API Reference

The backend is a **FastAPI** service (interactive docs at `/docs` and `/openapi.json`).
All endpoints are under `/api`. The Next.js frontend never talks to the backend directly —
`next.config.ts` rewrites `/api/:path*` to `BACKEND_URL/api/:path*`.

**Base URLs**

- Local: `http://127.0.0.1:8000`
- Production (Render): `https://facilityops-backend-izin.onrender.com`

**Live health check**

```bash
curl https://facilityops-backend-izin.onrender.com/api/health
```

```json
{
  "status": "ok",
  "version": "0.1.0",
  "facility": "Corporate HQ & IT Park",
  "sample_note": "Synthetic 90-day sample dataset — every value on screen is computed live from this database (no hardcoded numbers).",
  "counts": {
    "assets": 2450,
    "maintenance_records": 4862,
    "energy_usage": 5686,
    "occupancy_records": 22504,
    "security_events": 154,
    "cost_reports": 24,
    "alerts": 126,
    "work_orders": 64
  }
}
```

> The minute-level counts (`energy_usage`, `occupancy_records`) grow continuously — the
> live simulator appends one row per facility per minute.

---

## Conventions

- **Auth:** The API itself is unauthenticated. Access is gated at the frontend by Clerk
  (`src/proxy.ts`); the `/api/*` proxy rewrite is only reachable behind an authenticated
  session in the browser.
- **CORS:** `http://localhost:3000` and `http://127.0.0.1:3000` are allowed origins
  (`backend/app/config.py`).
- **Live advance:** dashboard, alert, and copilot endpoints call the live simulator
  (`advance()`) before computing, so payloads always reflect "now".
- **Errors:** JSON `{ "detail": "..." }` with the status code.
- **Facility:** all payloads target the first facility (single-facility demo). Responses
  include a `facility: { name, facility_type, location }` block where relevant.

---

## Endpoints

### `GET /api/health`

Service health, facility name, `sample_note`, and per-table row counts. Also advances the
live simulator when a facility exists.

### Dashboards — `GET /api/dashboards/*`

Each endpoint runs the relevant agent(s) and returns a full payload for one page.

| Endpoint | Agent(s) run | Notes |
|----------|--------------|-------|
| `GET /api/dashboards/overview` | energy, maintenance, occupancy, security, cost, intelligence | Full mesh; adds `kpis` and open-alerts list |
| `GET /api/dashboards/energy` | energy | |
| `GET /api/dashboards/maintenance` | maintenance | adds `asset_count` |
| `GET /api/dashboards/occupancy` | occupancy | |
| `GET /api/dashboards/security` | security | |
| `GET /api/dashboards/cost` | cost | |
| `GET /api/dashboards/intelligence` | intelligence (+ energy, occupancy, maintenance, cost) | adds 7-day `forecasts` cross-domain cards |
| `GET /api/dashboards/alerts` | — | `summary`, `alerts`, `escalation_policy` |
| `GET /api/dashboards/reports` | all six | executive report: scorecards, sustainability, narrative, agent performance |
| `GET /api/dashboards/assets` | — | status counts + distribution % + asset type list |
| `GET /api/dashboards/work-orders` | — | status counts + `ai_predicted` |

**Example — `GET /api/dashboards/energy`**

```json
{
  "facility": { "name": "Corporate HQ & IT Park", "facility_type": "Corporate HQ + IT Park", "location": "Bengaluru, India" },
  "agent": "Energy Agent",
  "total_today_kwh": 8423.1,
  "total_today_mwh": 8.423,
  "cost_savings": 95.12,
  "efficiency_score": 91.4,
  "efficiency_target": 85,
  "carbon_reduction_pct": 6.2,
  "hvac_efficiency_pct": 88.1,
  "hvac_setpoint_c": 22.5,
  "hvac_avg_temp_c": 23.4,
  "hvac_run_hours": 9.2,
  "co2_saved_kg": 475.6,
  "split": { "hvac": 61, "lighting": 22, "equipment": 15, "other": 2 },
  "wastage_insights": [
    { "title": "Dim lighting banks during unoccupied windows", "impact": "$3,050/mo", "status": "Proposed" }
  ],
  "change_vs_prev_pct": 2.3,
  "change_vs_baseline_pct": -4.1,
  "anomalies": [ { "timestamp": "2026-08-02T14:00:00", "electricity_kwh": 412.3, "hvac_kwh": 258.1, "lift_pct": 18.4 } ],
  "anomaly_count_today": 2,
  "anomaly_threshold_pct": 12,
  "forecast": [ { "date": "2026-08-03", "weekday": "Mon", "electricity_kwh": 13120.5, "is_peak": false } ],
  "peak_day": { "date": "2026-08-05", "weekday": "Wed", "electricity_kwh": 13710.2, "is_peak": true },
  "hourly": [ { "hour": 14, "label": "14:00", "electricity_kwh": 412.3, "hvac_kwh": 258.1, "lighting_kwh": 90.7, "equipment_kwh": 63.5, "water_l": 1480.2 } ]
}
```

### Agents — `/api/agents`

| Endpoint | Purpose |
|----------|---------|
| `GET /api/agents` | Registry list with id, name, module, status, health |
| `GET /api/agents/{agent_id}/run` | Run one agent and return its full payload |

`agent_id` ∈ `energy`, `maintenance`, `occupancy`, `security`, `cost`, `intelligence`.
Unknown id → `404 { "detail": "Unknown agent: <id>" }`.

### Alerts — `/api/alerts`

| Endpoint | Purpose |
|----------|---------|
| `GET /api/alerts/summary` | `{ total, open, acknowledged, resolved }` |
| `GET /api/alerts?status=&limit=` | List (newest first), optional `status` filter, `limit` default 100 |
| `PATCH /api/alerts/{alert_id}` | Update status |

**PATCH body** (alert_id is an int):

```json
{ "status": "Acknowledged" }
```

Allowed statuses: `Open`, `Acknowledged`, `Resolved`. Unknown alert → `404`; invalid
status → `400`.

### Work orders — `/api/work-orders`

| Endpoint | Purpose |
|----------|---------|
| `GET /api/work-orders?status=&limit=` | List (newest first), optional filter |
| `GET /api/work-orders/technicians` | Distinct assignee initials `{ "technicians": ["AP","JD",...] }` |
| `GET /api/work-orders/{wo_id}` | Single work order (wo_id like `WO-1042`) |
| `POST /api/work-orders` | Create (returns `201`) |
| `PATCH /api/work-orders/{wo_id}` | Update `status` and/or `assignee` |

**POST body:**

```json
{ "asset_id": "AST-1042", "title": "Replace AHU filter", "priority": "P2", "source": "Manual", "due_date": "2026-08-12" }
```

- `asset_id` must exist → else `400 "Unknown asset_id"`.
- New id auto-increments from the highest `WO-<n>`.
- `due_date` optional; falls back to `now + work_orders.default_due_days` (config).

**PATCH body** (both optional):

```json
{ "status": "In Progress", "assignee": "SM" }
```

Allowed statuses: `Open`, `In Progress`, `Scheduled`, `Completed`.

### Assets — `/api/assets`

| Endpoint | Purpose |
|----------|---------|
| `GET /api/assets?status=&asset_type=&search=&limit=&offset=` | Paginated list, filters, name/id search; sorted by `health_score` asc |
| `GET /api/assets/{asset_id}` | Detail + `maintenance_history` + failure prediction |

`search` matches `name` or `id` (case-insensitive contains). `limit` default 200.
Unknown asset → `404`.

Detail adds:

```json
{
  "maintenance_history": [
    { "issue_type": "Filter clean", "maintenance_date": "2026-05-11", "cost": 420, "technician": "SM", "status": "Completed" }
  ],
  "days_to_failure": 4,
  "predicted_risk": 72.4
}
```

`days_to_failure` / `predicted_risk` are present only for assets in the top-12 risk list
computed by the Maintenance agent (prediction is cached per facility).

### Settings — `/api/settings`

| Endpoint | Purpose |
|----------|---------|
| `GET /api/settings/integrations` | Notification & data-source integrations (access control, Teams, Slack, email, BACnet, CCTV) |
| `GET /api/settings/config` | Editable `system_config` key/value rows (grouped by prefix) |
| `GET /api/settings/agents` | Agent names + configured thresholds |
| `GET /api/settings/facility` | Facility profile + timezone + currencies |
| `GET /api/settings/team` | Seeded user roster `{ "members": [...] }` |

### Copilot — `/api/copilot`

| Endpoint | Purpose |
|----------|---------|
| `POST /api/copilot/chat` | Deterministic agent-collaboration chat |
| `GET /api/copilot/agents` | Live agent status, facility health, correlations |

**POST body:**

```json
{ "message": "how is facility health?" }
```

Response shape:

```json
{
  "reply": "Facility Health is 87/100.\n\nEnergy: ...",
  "agents_collaborated": 6,
  "reasoning": [
    { "agent": "Facility Intelligence Engine", "step": "Dispatching query across agent mesh", "detail": "'...' → energy, maintenance, occupancy, security, cost" }
  ]
}
```

The reply is composed from live agent factoids; keywords (health, energy, maintenance,
occupancy, security, cost) select a focused briefing, otherwise a full six-agent summary.

---

## Error summary

| Code | Typical cause |
|------|---------------|
| `400` | Invalid status on PATCH, unknown `asset_id` on work-order POST |
| `404` | Unknown agent id, alert id, work order id, or asset id |
| `500` | Backend failure (e.g. database unreachable) |

## Related

- [ARCHITECTURE.md](./ARCHITECTURE.md) — how the API is wired to agents and the live simulator
- [WORKFLOW.md](./WORKFLOW.md) — page → endpoint mapping and how to extend the API
- [EDGE_CASES.md](./EDGE_CASES.md) — request behavior gotchas (e.g. curl vs browser 404)
