# Agentic FacilityOps AI Platform

**AI-Powered Building Operations & Facility Intelligence System**

Autonomous AI agents continuously monitor energy, assets, occupancy, security, and
operational cost — then surface live intelligence, predictive maintenance, and
recommendations on a centralized facility operations dashboard. Built with **Next.js 16 +
FastAPI + PostgreSQL (Neon)**, powered by **pandas + scikit-learn** agents, and running a
**live 1-minute simulation** so every number moves in real time.

---

## Live deployment

| Component | URL | Status |
|-----------|-----|--------|
| **Web Platform** — Vercel | [facilityops-platform.vercel.app](https://facilityops-platform.vercel.app) | Live — Clerk sign-in |
| **API Backend** — Render | [facilityops-backend-izin.onrender.com](https://facilityops-backend-izin.onrender.com) | Live — `GET /api/health` |
| **Source** — GitHub | [github.com/krbipin/Agentic-FacilityOps-AI-Platform](https://github.com/krbipin/Agentic-FacilityOps-AI-Platform) | `master` |

**Try it:** open the web platform, create a Clerk account (auto-provisioned), and land on
the live Facility Operations Dashboard. Every number on screen is computed from the backend
in real time and refreshes every 15–30 seconds — nothing is hardcoded or a static screenshot.

---

## Documentation

| Doc | What it covers |
|-----|----------------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, request lifecycle, agent collaboration (mermaid diagrams) |
| [DB_SCHEMA.md](docs/DB_SCHEMA.md) | All 16 tables, columns, relationships (ER diagram), seed strategy |
| [API.md](docs/API.md) | Every endpoint — paths, params, bodies, sample requests, errors |
| [TECH STACK.md](docs/TECH STACK.md) | Exact versions, rationale, ML models, design tokens |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Local dev, Render + Vercel setup, env vars, secrets, troubleshooting |
| [WORKFLOW.md](docs/WORKFLOW.md) | Data flow, page → endpoint map, extend-guide, commit discipline |
| [EDGE_CASES.md](docs/EDGE_CASES.md) | Known behaviors and gotchas (Clerk curl-404, noon rows, SQLite fallback, caching) |

---

## Highlights

- **8 autonomous modules** — Energy, Maintenance, Occupancy, Security, Cost Optimization
  agents + Facility Intelligence Engine + Dashboards + Alert & Automation
- **14 fully responsive pages** — Operations, Energy, Maintenance, Occupancy, Security,
  Cost, Intelligence, Alerts, Reports, Assets, Work Orders, Settings, AI Copilot
- **Live end-to-end** — the LiveSimulator appends 1-minute readings; agents recompute KPIs
  every poll; alerts auto-create on threshold breaches
- **Predictive ML** — RandomForest failure risk, IsolationForest anomaly detection,
  linear-regression demand/occupancy/cost forecasts (pandas + scikit-learn)
- **Backend-driven data** — no hardcoded KPIs; every value is computed from the database
  and labeled "Sample Data" via `/api/health`
- **Clerk auth** — sign-in/up, route guard, user menu; single shared Neon DB for local + prod

---

## Quick start

Prerequisites: Node.js 18+, Python ≥3.14, `uv`, a Clerk app, and a Neon PostgreSQL database
(optional — falls back to local SQLite).

**Backend**

```bash
cd backend
uv sync
# create backend/.env from backend/.env.example — set DATABASE_URL (Neon postgresql://)
uv run uvicorn app.main:app --reload --port 8000
curl http://127.0.0.1:8000/api/health   # seeds DB on first boot
```

**Frontend**

```bash
npm install
cp .env.example .env.local    # add your Clerk keys
npm run dev                   # http://localhost:3000
```

Full setup, env variables, and deployment: [DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## Environment variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `DATABASE_URL` | `backend/.env` + Render | Neon `postgresql://` URL (unset → SQLite) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `.env.local` + Vercel | Clerk publishable key |
| `CLERK_SECRET_KEY` | `.env.local` + Vercel | Clerk secret key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` · `SIGN_UP_URL` | `.env.local` | `/sign-in` · `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` · `AFTER_SIGN_UP_URL` | `.env.local` | `/` |
| `NEXT_PUBLIC_CLERK_SIGN_OUT_REDIRECT_URL` | `.env.local` | `/` |
| `BACKEND_URL` | `.env.local` + Vercel | Backend origin (default `http://127.0.0.1:8000`) |

Template files: `.env.example` (frontend) and `backend/.env.example` (backend). Secrets
only ever live in gitignored env files / platform dashboards.

---

## Tech stack (summary)

Next.js 16.2.12 · React 19.2.4 · TypeScript 5 · Tailwind CSS v4 · Clerk · FastAPI ·
Python ≥3.14 · pandas 3 · NumPy 2 · scikit-learn · SQLAlchemy 2 · psycopg3 · PostgreSQL
(Neon) · uv · Render · Vercel. See [TECH STACK.md](docs/TECH STACK.md).

## Status

- **Done:** full-stack live app (Next.js + FastAPI + Neon), 8 modules, 14 pages, Clerk auth,
  live simulation & polling, backend-driven KPIs, production deployments on Render + Vercel.
- **Planned:** email/SMS/Teams alert delivery, multi-facility support, mobile app.
