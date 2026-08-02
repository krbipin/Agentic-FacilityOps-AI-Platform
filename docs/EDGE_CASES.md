# Edge Cases & Known Behaviors

A catalog of real behaviors, gotchas, and intentional trade-offs in the codebase — written
from the actual implementation so on-call debugging is fast.

---

## 1. Clerk 404 on curl but not the browser

**Symptom:** `curl https://facilityops-platform.vercel.app/` returns a 404 (or the raw
sign-in redirect is missing), yet the site works fine in a browser.

**Cause:** `src/proxy.ts` calls `auth.protect()` on every non-public route. Clerk treats a
request **without** `Sec-Fetch-Dest: document` (like curl) as a non-page navigation and
rewrites it to a 404 (`X-Clerk-Auth-Reason: protect-rewrite`). A browser sends
`Sec-Fetch-Dest: document`, so Clerk instead returns a 307 handshake redirect to the hosted
sign-in.

**Fix:** use a browser, or emulate the page request:

```bash
curl -H "Sec-Fetch-Dest: document" -i https://facilityops-platform.vercel.app/
# → 307 → Location: https://<clerk-host>/sign-in
```

`/sign-in` returns 200. **The app is live** — this is a curl artifact, not a deployment issue.

---

## 2. Noon (12:00) rows are special

- Rows at exactly `12:00` are the **daily-summary series** used for energy trends, the 7-day
  forecast, occupancy noon histories, and energy × occupancy correlation.
- Minute-level aggregation **excludes** `12:00` rows (`_is_live_ts`), and the live simulator
  never writes one. If you see "missing" minutes at noon in raw queries, that is by design.

---

## 3. Live simulation: idempotent but capped

- `advance()` (backend/app/live.py) generates ticks deterministically per
  `(facility_id, timestamp)` via a seeded RNG — retries and multiple workers produce
  identical rows, and inserts are effectively idempotent.
- **Catch-up is capped** (`sim.catchup_cap_minutes`, default 1440): after long downtime it
  generates at most the last day, so the DB doesn't blow up.
- The `system_config` keys `sim.tick_minutes` (1.0) and `sim.catchup_cap_minutes` (1440.0)
  tune this.
- Security events are probabilistic (~1.2%/minute) and create **Open** alerts only when a
  Red event fires; Energy/Occupancy alerts are deduplicated within a 60-minute window per
  title (`_recent_alert`).

---

## 4. SQLite fallback is partial

`config.py` falls back to a local SQLite file when `DATABASE_URL` is unset, but **some
agents use PostgreSQL-only SQL**:

- Energy agent baselines use `percentile_cont(...) WITHIN GROUP (...)` — not available in
  SQLite. The Energy agent (and anything that runs it) can error on a pure SQLite DB.

**Impact:** use SQLite for a smoke test / boot check only. Point `DATABASE_URL` at Neon for
full functionality. SQLite also gets `PRAGMA foreign_keys=ON` enabled on connect and uses
`check_same_thread=False`.

---

## 5. Cache TTL & cross-endpoint consistency

- Per-agent payloads are cached **45s** per `(agent, facility_id)`; impact estimates are
  cached **120s** per `(agent, title)` (`backend/app/cache.py`, `impact.py`).
- Because all agents share one TTL window, an Overview request and a simultaneous Copilot
  request in the same window return consistent numbers.
- **Cold start:** the first request after a TTL expiry re-runs the agent mesh — full-mesh
  endpoints (overview/reports/intelligence) can take 10–20s on Neon vs 1–7s warm. The
  frontend `loading` state covers this.
- Cache is **in-process**: it resets on restart and does not share across multiple backend
  instances (fine for this single-instance deployment).

---

## 6. Empty-data fallbacks (per agent)

| Agent | Behavior when data is missing |
|-------|-------------------------------|
| Energy | `_forecast_7d` returns `[]` under 30 daily points; anomalies return `[]` under 8 hourly points; missing baselines skip deviation alerts |
| Maintenance | `predicted` is empty; risk normalization falls back to 1.0 peak; downtime reduction returns 0 |
| Occupancy | `zones` empty, forecast accuracy 0; `today_total` falls back to current counts |
| Security | `events_today` 0, no burst hours, empty visitors |
| Cost | no categories → `total_spend` 0, `distribution` empty, `monthly_trend` empty |
| Intelligence | `_correlation` returns `None` when either series is empty or has < 5 joined days / constant values; health defaults to 80 if no assets |

---

## 7. API validation & resource rules

| Case | Behavior |
|------|----------|
| `PATCH /api/alerts/{id}` with invalid status | `400 "Invalid status"` |
| `PATCH /api/work-orders/{id}` with invalid status | `400 "Invalid status"` |
| Unknown agent id (`/api/agents/{id}/run`) | `404 "Unknown agent: <id>"` |
| Unknown alert / work order / asset id | `404` |
| `POST /api/work-orders` with unknown `asset_id` | `400 "Unknown asset_id"` |
| `POST /api/energy` with `electricity_kwh <= 0` (or missing) | `422` — must be `> 0` |
| `POST /api/assets` with bad `status` / `health_score` | `422` — status enum; score 0–100 |
| `POST /api/facilities` with blank fields | `422` — name/type/location required |
| `POST /api/facilities/{id}/activate` unknown id | `404 "Facility not found"` |
| Work order id generation | `WO-<n>` = max existing id + 1 — single-writer assumption (demo), a race could collide under concurrent creates |
| Asset detail prediction | `days_to_failure` / `predicted_risk` only for the top-12 risk assets; `null` otherwise |

---

## 8. Shared Neon database (local ≠ isolated)

The backend runs on **one shared Neon database for both local dev and production** — local
actions (including reseeding) mutate production data. This is accepted for the demo but is
the single biggest operational caveat. Run `reseed.py` locally only when you intend to
refresh the demo dataset.

---

## 9. Frontend fetch behavior

- `fetcher` uses `cache: "no-store"` and throws on non-2xx; `useApiData` surfaces the error
  string and keeps the last good data.
- `patch`/`post` helpers send JSON and throw `Error(status)` on failure.
- Polling interval is per-hook; components stop polling on unmount (`cancelled` guard).

---

## 10. Deployment-specific quirks

- **Vercel deployment protection** was disabled so the production alias is publicly
  reachable; re-enabling it will make `/` appear to 404/blocked again.
- **Render free tier** cold-sleeps; a cron pinging `/api/health` keeps it (and Neon) warm.
- Local `.vercel/` state is gitignored — it is machine-specific and must not be committed.
- CORS allows only `localhost:3000` origins; the frontend proxy means the browser never
  calls the backend cross-origin in production.

---

## 11. Facility management & active facility

- The **active facility** is read from the `system_config` key `app.active_facility_id`
  (default: first facility). All agents and endpoints are scoped to it. `GET /api/facilities`
  returns `is_active` per row; switching writes the key and clears nothing (caches are keyed
  per `facility_id`, so old-facility payloads expire naturally).
- **Empty facilities are safe:** a created facility has no synthetic data; `advance()` is a
  no-op on it, and every agent returns a zeroed/None payload (e.g. intelligence correlation
  is `None`). New facilities stay empty until the user posts assets/energy readings.
- **`sample_note` is per-facility:** `/api/health` shows the "Sample Data" note only when the
  active facility is the seeded one (`app.seeded_facility_id`), so user-created facilities
  never show the badge.
- **POST caches:** `POST /api/assets` invalidates `maintenance:{fid}` + `cost:{fid}`;
  `POST /api/energy` invalidates `energy:{fid}` + `cost:{fid}` — so dashboards reflect
  user-entered data on the next poll.
- **Asset id:** user-created assets get `AST-{facility_id*10000+n}` (loop-verified unique);
  seeded assets keep `AST-<n>`.

## Related

- [ARCHITECTURE.md](./ARCHITECTURE.md) — live simulator & cache design
- [API.md](./API.md) — endpoint behavior and error contract
- [DEPLOYMENT.md](./DEPLOYMENT.md) — deployment troubleshooting
