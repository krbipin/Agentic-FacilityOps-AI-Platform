# Deployment

How to run the platform locally and ship it to production. The app is deployed as two
independent services that talk over HTTP:

- **Backend** — FastAPI on **Render** (`render.yaml` blueprint)
- **Frontend** — Next.js on **Vercel**, proxying `/api/*` to the backend via `BACKEND_URL`

```mermaid
flowchart LR
    subgraph GIT["GitHub — master"]
        REPO[(Repo)]
    end
    subgraph PROD["Production"]
        VC["Vercel — Next.js 16<br/>Clerk env + BACKEND_URL"]
        REN["Render — FastAPI<br/>uv sync + uvicorn"]
        NB[("Neon PostgreSQL")]
    end

    REPO -->|push / auto-deploy| VC
    REPO -->|push / auto-deploy| REN
    BR["Browser"] --> VC
    VC -->|"/api/* rewrite"| REN
    REN --> NB
    CRON["Render cron → GET /api/health"] --> REN
```

---

## 1. Live deployments

| Component | URL |
|-----------|-----|
| Web Platform (Vercel) | `https://facilityops-platform.vercel.app` |
| API Backend (Render) | `https://facilityops-backend-izin.onrender.com` |

> **Important:** the frontend requires a Clerk session. Opening `/` while signed out
> redirects through Clerk to `/sign-in` (browser request). A bare `curl /` returns a 404 —
> see [EDGE_CASES.md](./EDGE_CASES.md#clerk-404-on-curl-but-not-the-browser).

---

## 2. Local development

### Prerequisites

- Node.js 18+ (`node`, `npx`)
- Python ≥3.14 and `uv` — `curl -LsSf https://astral.sh/uv/install.sh | sh`
- A Clerk application (free tier) for frontend auth
- (Recommended) A free **Neon** PostgreSQL database; without it the backend falls back to SQLite

### Backend

```bash
cd backend
uv sync                       # install dependencies
# create backend/.env — see backend/.env.example
#   DATABASE_URL=postgresql://user:password@host/database   (Neon)
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000
```

The database is created and seeded automatically on first start. Health check:

```bash
curl http://127.0.0.1:8000/api/health
```

> `postgresql://` URLs are normalized to the psycopg3 dialect automatically
> (`backend/app/config.py`). If `DATABASE_URL` is unset, the app uses SQLite at
> `backend/data/facilityops.db`.

### Frontend

```bash
npm install
cp .env.example .env.local    # add your Clerk keys
npm run dev                   # http://localhost:3000
```

`next.config.ts` rewrites `/api/*` to `BACKEND_URL` (default `http://127.0.0.1:8000`).

---

## 3. Environment variables

| Variable | Where | Required | Notes |
|----------|-------|----------|-------|
| `DATABASE_URL` | Backend `backend/.env` + Render | Yes (recommended) | Neon `postgresql://` URL. Unset → SQLite fallback |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Frontend `.env.local` + Vercel | Yes | Clerk publishable key |
| `CLERK_SECRET_KEY` | Frontend `.env.local` + Vercel | Yes | Clerk secret key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Frontend | Yes | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Frontend | Yes | `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Frontend | Yes | `/` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Frontend | Yes | `/` |
| `NEXT_PUBLIC_CLERK_SIGN_OUT_REDIRECT_URL` | Frontend | Yes | `/` |
| `BACKEND_URL` | Frontend `.env.local` + Vercel | Yes | Backend origin; local `http://127.0.0.1:8000`, prod the Render URL |
| `GROQ_API_KEY` | Backend `backend/.env` + Render | No | Groq key → live LLM answers in the Facility Copilot. Missing → deterministic fallback |

Template files: `.env.example` (frontend) and `backend/.env.example` (backend).

---

## 4. Backend — Render

`render.yaml` describes the service:

```yaml
services:
  - type: web
    name: facilityops-backend
    runtime: python
    rootDir: backend
    plan: free
    buildCommand: uv sync --frozen
    startCommand: uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT
    healthCheckPath: /api/health
    autoDeploy: true
```

Steps:

1. Create a Render web service from the GitHub repo (root dir `backend`), or use the
   `render.yaml` blueprint — it applies the settings above automatically.
2. Set the `DATABASE_URL` env var in the Render dashboard to the Neon URL.
3. (Optional) Set `GROQ_API_KEY` in the Render dashboard to enable live LLM Copilot
   answers. Without it the Copilot uses its deterministic fallback composer.
4. `autoDeploy: true` rebuilds and redeploys on every push to `master`.

**Keep-alive:** a scheduled cron on Render hits `GET /api/health` periodically so the free
instance and the Neon connection stay warm.

---

## 5. Frontend — Vercel

1. Import the GitHub repo as a Vercel project (framework preset Next.js).
2. Set the Clerk env vars and `BACKEND_URL` (the Render URL) in the project dashboard.
3. Deploy. Production alias is public; unauthenticated visits redirect through Clerk to
   `/sign-in`.

> **Deployment protection:** if enabled, Vercel's SSO/credential protection blocks
> non-matching requests and the alias can appear broken. Disable deployment protection so
> the production alias is publicly reachable.

---

## 6. Secrets rule

- The **Neon URL** is a secret: it lives **only** in `backend/.env` (gitignored) and the
  Render env var dashboard — never in `render.yaml`, `.env.example`, or committed code.
- The **Groq key** is a secret too: same rule — `backend/.env` (gitignored) + Render env
  vars only. Never commit it.
- Clerk keys are similarly only in `.env.local` (gitignored) and the Vercel dashboard.
- `.env.example` / `backend/.env.example` contain **placeholders only**.
- Local `.vercel/` state is gitignored.

---

## 7. Troubleshooting

| Symptom | Cause / fix |
|---------|-------------|
| `curl /` on Vercel returns 404 but the browser works | Clerk `protect()` rewrite — a curl request without `Sec-Fetch-Dest: document` is treated as non-page. Use a browser or send the header. See [EDGE_CASES.md](./EDGE_CASES.md) |
| Backend unreachable from Vercel | `BACKEND_URL` missing/wrong on Vercel, or Render free instance cold-sleeping (cron pings prevent this) |
| Health shows `facility: null` | DB empty — restart the service; lifespan seeds on first boot |
| Database schema errors on SQLite | Some agents use PostgreSQL-only SQL (`percentile_cont`). Point `DATABASE_URL` at Neon |
| `/docs` slow | Cold cache — first request after 45s+ re-runs the agent mesh (~1–7s warm, 10–20s cold) |

## Related

- [ARCHITECTURE.md](./ARCHITECTURE.md) — deployment architecture
- [WORKFLOW.md](./WORKFLOW.md) — end-to-end run/verify loop
