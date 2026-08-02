# Agentic FacilityOps AI Platform

**AI-Powered Building Operations & Facility Intelligence System**

Autonomous AI agents for smart, secure & sustainable facilities — continuously monitoring energy, assets, occupancy, security, and operational cost, then surfacing live intelligence and recommendations on a centralized facility operations platform.

---

## Live deployment

| Component | URL | Status |
|-----------|-----|--------|
| **Web Platform** — Vercel | [facilityops-platform.vercel.app](https://facilityops-platform.vercel.app) | **Live** ✓ · Clerk sign-in |
| **API Backend** — Render | [facilityops-backend-izin.onrender.com](https://facilityops-backend-izin.onrender.com) | **Live** ✓ · `GET /api/health` |
| **Source** — GitHub | [github.com/krbipin/Agentic-FacilityOps-AI-Platform](https://github.com/krbipin/Agentic-FacilityOps-AI-Platform) | `master` |

> **Try it:** open the web platform, create a Clerk account (new accounts are auto-provisioned), and land on the live Facility Operations Dashboard. Every number on screen is computed from the backend in real time and refreshes every 15–30 seconds — nothing is hardcoded or a static screenshot.

---

## Table of contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Core agents & modules](#core-agents--modules)
- [Dashboards (14 pages)](#dashboards-14-pages)
- [Tech stack](#tech-stack)
- [Live simulation & polling](#live-simulation--polling)
- [Data pipeline & sample dataset](#data-pipeline--sample-dataset)
- [Getting started](#getting-started)
- [Database schema](#database-schema)
- [API reference](#api-reference)
- [Deployment](#deployment)
- [Project structure](#project-structure)
- [Verification](#verification)
- [Status](#status)

---

## Overview

Large facilities (corporate offices, IT parks, universities, hospitals) generate huge operational data from IoT sensors, HVAC systems, access control, maintenance logs, occupancy monitoring, and utility meters. Facility managers struggle with rising energy costs, delayed maintenance, inefficient space utilization, security incidents, and operational inefficiencies.

This platform deploys a suite of **autonomous AI agents** that continuously monitor operations, optimize resources, predict maintenance, improve security, and reduce operational cost. Agents collaborate through a central **Facility Intelligence Engine**, and the results are presented through real-time dashboards, alerts, and an AI copilot.

### Key outcomes

- AI-driven facility monitoring and automation
- Predictive maintenance and asset health monitoring
- Energy consumption optimization
- Occupancy intelligence and space-utilization analytics
- Real-time security monitoring and incident detection
- Operational cost reduction via intelligent recommendations
- Centralized facility operations dashboard
- Automated alerts and escalation workflows
- Sustainability / energy-efficiency reporting
- Improved asset lifespan and facility performance

---

## Architecture

```mermaid
flowchart TB
    subgraph FE["Next.js 16 Frontend — Vercel"]
        UI["14 dashboards · Clerk auth<br/>15s / 30s polling · Topbar live clock"]
        MW["src/proxy.ts — Clerk route guard"]
        UI --> MW
    end

    subgraph BE["FastAPI Backend — Render"]
        R["API Routers — dashboards · agents · alerts<br/>work-orders · assets · settings · copilot"]
        A["Agents — Energy · Maintenance · Occupancy<br/>Security · Cost (pandas + scikit-learn)"]
        I["Facility Intelligence Engine"]
        S["Live Simulator — live.py<br/>1-minute ticks · business-day curves"]
        R --> A
        A --> I
        A --> S
    end

    subgraph DATA["Data"]
        C["Agent cache (45s) · impact cache (120s)"]
        D[("PostgreSQL — Neon<br/>SQLite fallback")]
    end

    MW -->|"/api/* proxy rewrite"| R
    A --> C
    A --> D
    I --> D
    S --> D
```

**Data workflow**

1. Facility data — IoT sensors, HVAC systems, CCTV, access control, utility meters
2. Data validation and processing
3. Energy Agent → Maintenance Agent → Occupancy Agent → Security Agent → Cost Optimization Agent
4. Facility Intelligence Engine (aggregates insights, correlates events, coordinates agents)
5. Operational recommendations → Facility dashboards, alerts, notifications

---

## Core agents & modules

| # | Module | Capabilities |
|---|--------|--------------|
| 1 | **Energy Agent** | Monitor electricity/water/utility consumption; detect energy wastage; analyze HVAC efficiency; optimize lighting schedules; energy-saving recommendations; forecast energy demand |
| 2 | **Maintenance Agent** | Monitor equipment health; predict failures; detect abnormal behavior; track asset lifecycle; generate work orders; reduce downtime |
| 3 | **Occupancy Agent** | Monitor room/building occupancy; space utilization; detect overcrowding; optimize workspace allocation; occupancy heatmaps; forecast usage |
| 4 | **Security Agent** | Access control monitoring; detect unauthorized access; analyze CCTV events; track visitors; security alerts; incident investigation |
| 5 | **Cost Optimization Agent** | Analyze operational expenditure; cost-saving opportunities; vendor optimization; resource allocation; budget compliance; ROI reports |
| 6 | **Facility Analytics & Intelligence Engine** | Aggregate insights from all agents; facility health scores; anomaly detection; operational forecasts; AI recommendations |
| 7 | **Dashboard & Reporting Module** | Facility Ops, Energy, Maintenance, Security, Occupancy, Executive dashboards |
| 8 | **Alert & Automation Module** | Email alerts, SMS, Teams/Slack integration, automated escalations, maintenance ticket creation |

---

## Dashboards (14 pages)

| # | Page | Route |
|---|------|-------|
| 1 | Sign-in / Sign-up (Clerk) | `/sign-in` · `/sign-up` |
| 2 | Facility Operations Dashboard | `/` |
| 3 | Energy Dashboard | `/energy` |
| 4 | Maintenance Dashboard | `/maintenance` |
| 5 | Occupancy Dashboard | `/occupancy` |
| 6 | Security Dashboard | `/security` |
| 7 | Cost Optimization Dashboard | `/cost` |
| 8 | Facility Intelligence | `/intelligence` |
| 9 | Alerts & Notifications Center | `/alerts` |
| 10 | Executive Reporting Dashboard | `/reports` |
| 11 | Assets Management | `/assets` |
| 12 | Work Orders | `/work-orders` |
| 13 | Settings & Integrations | `/settings` |
| 14 | AI Copilot / Agent Collaboration | `/copilot` |

Every page shares a global app shell — collapsible sidebar navigation, facility selector, live clock, active-alert bell with unread count, theme toggle (dark-first industrial aesthetic), and a Clerk user menu. All pages are fully responsive (mobile / tablet / desktop).

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16.2.12, React 19.2.4, TypeScript 5, Tailwind CSS v4 |
| Auth | Clerk (`@clerk/nextjs`), route guard via `src/proxy.ts` |
| Backend | Python ≥3.14, FastAPI, Uvicorn, pandas 3, NumPy 2, scikit-learn |
| ORM / DB | SQLAlchemy 2, psycopg3, PostgreSQL (Neon) · SQLite local fallback |
| Tooling | uv (Python), npm (Node), Render (deploy) |

Design system: Inter (UI) + JetBrains Mono (data), dark-first palette (`#0B1120` → `#111C33` → `#1E293B`), accents Electric Blue `#38BDF8`, Signal Green `#34D399`, Amber `#FBBF24`, Alert Red `#F87171`. Tokens live in `.stitch/DESIGN.md`.

---

## Live simulation & polling

The platform is **live end-to-end**, not static screenshots:

- **Sim clock** — `backend/app/live.py` advances a 1-minute tick of `EnergyUsage` / `OccupancyRecord` per real minute (capped catch-up), idempotent per `(facility_id, timestamp)`. Noon (12:00) rows are the daily-summary series and are excluded from minute aggregation.
- **Weekend model** — a business-day diurnal curve runs every day (weekends included) so the demo stays lively.
- **Agent cache** — each agent caches its payload for 45s; impact estimates for 120s. Cached reads are ~1–7s; cold full-mesh (overview/reports/intelligence) ~10–20s on Neon.
- **Frontend polling** — dashboards + Topbar poll every 15s; Assets/WorkOrders/Copilot/Settings every 30s. The Topbar "Live" badge, 1s clock, and 15s alert bell are the liveness indicators.

---

## Data pipeline & sample dataset

The app is a full stack: **Next.js frontend → FastAPI agents → PostgreSQL (Neon)**. The frontend polls the agents; agents run analytics, ML predictions, and the live 1-minute simulation.

**Sample dataset.** `backend/app/seed.py` generates a deterministic synthetic history (`SEED=20260731`) for **Corporate HQ & IT Park, Bengaluru** — 2,450 assets with maintenance records, minute-level energy and occupancy series, security events, 6-month cost reports, and 64 work orders. This represents an established facility so every dashboard is demonstrable out of the box.

**Data integrity.** No on-screen number is hardcoded. Every KPI — energy MWh, facility health, cost savings, ROI, occupancy, predicted failures — is computed live by the agents from this database. The Topbar renders a backend-driven **"Sample Data"** badge (`app.sample_data_note`, surfaced via `/api/health`) so the synthetic source is always labeled and never misrepresented as real telemetry. Historical rows are deterministic and reproducible; the simulation appends new minute rows live.

**KPI derivation cheat-sheet** (full detail in each agent's docstring in `backend/app/agents/`):

| KPI | How it's computed |
|-----|-------------------|
| Energy efficiency | `100 − |today vs 7-day baseline|` (%) on time-of-day–matched slices; savings/carbon from baseline delta × config tariff & emission factor |
| Maintenance | RandomForest failure-risk 0–99 per asset (health, useful life, days since maintenance); downtime from work-order cycle comparisons |
| Occupancy | Latest live per-zone snapshots; forecast = linear extrapolation of noon history + residual band; accuracy = model-vs-actual MAPE |
| Security | Event counts/severities from `security_events`; doors & camera uptime from config; visitors from `visitors` table |
| Cost | Spend from latest `CostReport` rows; trend = linear extrapolation of each category's 6-month series; ROI = realized savings × config multiplier (6.2) |
| Intelligence | Cross-correlates energy × occupancy; weighted facility health from each agent's live health; recommendation impacts computed at runtime |

---

## Getting started

### Prerequisites

- Node.js 18+ (`node`, `npx`)
- Python ≥3.14 and `uv` (Python tool manager) — `curl -LsSf https://astral.sh/uv/install.sh | sh`
- (Optional) A Neon PostgreSQL database; without it the backend falls back to SQLite

### 1. Backend

```bash
cd backend
uv sync                       # install dependencies
# create backend/.env with:
#   DATABASE_URL=postgresql://user:pass@host/db   (Neon)
# (unset → local SQLite at backend/data/facilityops.db)
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000
```

The backend seeds the database automatically on first start (see "Data pipeline"). Health check:

```bash
curl http://127.0.0.1:8000/api/health
```

> ⚠️ **Shared Neon database.** The backend runs on one shared Neon database for both local dev and production — local actions mutate production data. The Neon URL lives only in `backend/.env` (gitignored) and the Render service env var — never in committed code.

### 2. Frontend

```bash
npm install
cp .env.example .env.local    # add your Clerk keys (see below)
npm run dev                   # http://localhost:3000
```

`next.config.ts` rewrites `/api/*` to `BACKEND_URL` (default `http://127.0.0.1:8000`).

### Environment variables

| Variable | Used by | Notes |
|----------|---------|-------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Frontend | Clerk publishable key |
| `CLERK_SECRET_KEY` | Frontend | Clerk secret key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `SIGN_UP_URL` | Frontend | `/sign-in` · `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` / `AFTER_SIGN_UP_URL` | Frontend | `/` |
| `NEXT_PUBLIC_CLERK_SIGN_OUT_REDIRECT_URL` | Frontend | `/` |
| `BACKEND_URL` | Frontend proxy | Backend origin (default `http://127.0.0.1:8000`) |
| `DATABASE_URL` | Backend | PostgreSQL (Neon) connection string |

---

## Database schema

Canonical entities (16 tables via SQLAlchemy models):

```mermaid
erDiagram
    FACILITIES ||--o{ ASSETS : owns
    FACILITIES ||--o{ ENERGY_USAGE : records
    FACILITIES ||--o{ OCCUPANCY_RECORDS : tracks
    FACILITIES ||--o{ SECURITY_EVENTS : logs
    FACILITIES ||--o{ COST_REPORTS : reports
    FACILITIES ||--o{ ALERTS : raises
    FACILITIES ||--o{ MEETING_ROOMS : has
    FACILITIES ||--o{ VISITORS : receives
    FACILITIES ||--o{ VENDORS : contracts
    ASSETS ||--o{ MAINTENANCE_RECORDS : serviced_by
    ASSETS ||--o{ WORK_ORDERS : generates
```

| Entity | Key fields |
|--------|------------|
| `facilities` | name, facility_type, location, is_active |
| `assets` | name, asset_type, location, status, health_score, useful_life_pct, next_due |
| `maintenance_records` | issue_type, maintenance_date, cost, technician, status |
| `energy_usage` | timestamp, electricity_kwh, water_l, hvac/lighting/equipment_kwh, is_forecast |
| `occupancy_records` | zone, occupancy_count, capacity, timestamp |
| `security_events` | event_type, severity, title, location, timestamp, status |
| `cost_reports` | category, amount, budget, report_date |
| `alerts` | alert_type, severity, title, message, agent, status, channels |
| `work_orders` | title, issue_type, priority, source, status, assignee, due_date, confidence |
| `recommendations` | agent, title, impact, status, date |
| `meeting_rooms` · `visitors` · `vendors` | occupancy/security/cost side-panel data |
| `system_config` | key/value editable infrastructure parameters (tariffs, targets, thresholds) |
| `users` · `audit_log` | auth + audit trail |

---

## API reference

Base URL: `http://127.0.0.1:8000` (or `https://facilityops-backend-izin.onrender.com`).

**Live health check:**

```bash
curl https://facilityops-backend-izin.onrender.com/api/health
```

```json
{
  "status": "ok",
  "version": "0.1.0",
  "facility": "Corporate HQ & IT Park",
  "sample_note": "Synthetic 90-day sample dataset — every value on screen is computed live from this database (no hardcoded numbers).",
  "counts": { "assets": 2450, "energy_usage": 5686, "occupancy_records": 22504 }
}
```

> The minute-level series (`energy_usage`, `occupancy_records`) grow continuously — the live simulator appends a new row per facility every minute.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Service health, facility name, `sample_note`, row counts |
| GET | `/api/dashboards/overview` | Facility Operations Dashboard |
| GET | `/api/dashboards/energy` | Energy Dashboard |
| GET | `/api/dashboards/maintenance` | Maintenance Dashboard |
| GET | `/api/dashboards/occupancy` | Occupancy Dashboard |
| GET | `/api/dashboards/security` | Security Dashboard |
| GET | `/api/dashboards/cost` | Cost Optimization Dashboard |
| GET | `/api/dashboards/intelligence` | Facility Intelligence |
| GET | `/api/dashboards/reports` | Executive Reporting |
| GET | `/api/dashboards/alerts` | Alerts payload |
| GET | `/api/alerts` · `/api/alerts/summary` | Alerts list · status summary (`{total, open, acknowledged, resolved}`) |
| PATCH | `/api/alerts/{alert_id}` | Update alert status |
| GET | `/api/assets` · `/api/assets/{asset_id}` | Asset list · detail (incl. `days_to_failure`/`predicted_risk` for top-12 risk assets) |
| GET | `/api/work-orders` · `/api/work-orders/technicians` | Work orders · technician roster |
| PATCH | `/api/work-orders/{wo_id}` | Update work order |
| GET | `/api/settings/config` · `/team` · `/integrations` · `/agents` · `/facility` | Settings & integrations |
| GET | `/api/agents` · `/api/agents/{agent_id}/run` | List agents · run one agent |
| GET | `/api/copilot/agents` | Agent collaboration payload |
| POST | `/api/copilot/chat` | AI copilot chat |

---

## Deployment

| Component | URL | Status |
|-----------|-----|--------|
| Backend (Render) | `https://facilityops-backend-izin.onrender.com` | **Live** ✓ |
| Frontend (Vercel) | `https://facilityops-platform.vercel.app` | **Live** ✓ |

- **Backend** deploys via `render.yaml` (Python, `uv sync --frozen` + `uvicorn app.main:app`, health check `/api/health`, auto-deploy on push). A scheduled cron pings `/api/health` to keep the free instance and Neon warm.
- **Frontend** deploys from the GitHub repo on `master` (Next.js build, Clerk auth). Deployment protection is disabled so the production alias is publicly reachable; unauthenticated visits redirect through Clerk to `/sign-in`.
- **Secrets rule:** `DATABASE_URL`, Clerk keys, and `BACKEND_URL` are never committed — they live in the platform env var dashboards only.

---

## Project structure

```
├── backend/                     # FastAPI backend
│   ├── app/
│   │   ├── agents/              # energy, maintenance, occupancy, security, cost, intelligence
│   │   ├── routers/             # dashboards, agents, alerts, work-orders, assets, settings, copilot
│   │   ├── cache.py             # per-agent response cache (45s)
│   │   ├── config.py            # env + SQLite/PostgreSQL selection
│   │   ├── config_store.py      # editable system config (tariffs, targets, sample note)
│   │   ├── impact.py            # cached recommendation impact estimates (120s)
│   │   ├── live.py              # live simulator (1-minute ticks)
│   │   ├── main.py              # FastAPI app + /api/health
│   │   ├── models.py            # SQLAlchemy models (16 tables)
│   │   ├── seed.py              # deterministic synthetic dataset (SEED=20260731)
│   │   ├── db.py                # engine/session, init_db
│   │   └── ...
│   ├── pyproject.toml           # uv project (FastAPI, pandas, scikit-learn, psycopg)
│   └── reseed.py                # one-off drop → re-seed utility
├── src/                         # Next.js frontend
│   ├── app/                     # routes: (app)/…, sign-in, sign-up, user
│   ├── components/
│   │   ├── layout/              # app shell: Sidebar, Topbar
│   │   └── pages/               # one component per dashboard
│   └── lib/api.ts               # fetcher + useApiData polling hook + payload types
├── render.yaml                  # Render backend blueprint
├── next.config.ts               # /api/* proxy → BACKEND_URL
├── UI-UX-Specs/                 # per-page design specs
├── .stitch/DESIGN.md            # design system tokens
└── AGENTS.md                    # master reference for agents
```

---

## Verification

```bash
# Backend
curl http://127.0.0.1:8000/api/health          # → {"status":"ok","facility":…}

# Frontend
npx tsc --noEmit                                # type check
npm run lint                                    # ESLint
npm run build                                   # production build (14 routes)
```

---

## Status

- **Done:** full-stack live app (Next.js + FastAPI + Neon), 8 agents, 14 pages, Clerk auth, live simulation & polling, backend-driven KPIs with sample-data labeling, **production deployments on Render (backend) and Vercel (frontend)** with auto-deploy + backend warm-up cron.
- **Planned:** email/SMS/Teams alert delivery, multi-facility support, mobile app.
