# Facility Operations Dashboard (Overview)
- **Route:** /
- **Page type:** dashboard (app shell)
- **Primary agent:** Facility Intelligence Engine (aggregates all)
- **Data source:** ALL tables (FACILITIES, ASSETS, ENERGY_USAGE, OCCUPANCY_RECORDS, SECURITY_EVENTS, COST_REPORTS, ALERTS)

## Vibe & Purpose
The landing command center. A single glance must answer: "Is my facility healthy right now?" Four domains (Energy, Maintenance, Occupancy, Security) plus a cross-cutting health score, recent alerts, and the day's top AI recommendations. Precise, dense, calm — a mission-control overview, not a deep dive.

**PLATFORM:** Web, Desktop-first (responsive to Mobile/Tab)

**PAGE STRUCTURE:**
1. **Topbar:** facility selector (Corporate HQ & IT Park), live clock (mono, HH:MM:SS), alert bell with unread badge `4`, theme toggle (dark default), avatar menu (name "Alex Morgan", role "Facility Manager").
2. **Sidebar (collapsible icon rail):** Overview (active), Energy, Maintenance, Occupancy, Security, Cost, Intelligence, Alerts, Reports, Assets, Work Orders, Copilot, Settings. Collapses to icons ≤1024px, drawer ≤768px.
3. **Primary Content Area:**
   - **Page header:** "Good morning, Alex" + date + "LIVE" tag (pulsing green dot) + refresh button + range filter (Today / 7d / 30d).
   - **Health banner:** Facility Health Score `94/100` gauge (Electric Blue arc) with status chip "Healthy" (green) + delta "▲ 2 this week".
   - **Domain KPI grid (4 cards):**
     - Energy: Total Energy `1.28 MWh` (▲ 4%), Cost Savings `$156.80`, Efficiency `82%`.
      - Maintenance: Assets Monitored `2,450`, Tickets `89`, Predicted Failures `12`.
     - Occupancy: Occupancy Rate `73%`, Active Visitors `342`.
     - Security: Security Events `18`, Unauthorized Access `4`.
   - **Two-column section:**
     - Left (60%): **Energy consumption line chart** — last 24h, series HVAC (45%) / Lighting (28%) / Equipment (18%) / Other (9%), JetBrains Mono axis, Electric Blue primary line + status palette.
     - Right (40%): **Cross-agent alerts feed** — 5 latest alerts with severity chips (Red/Amber/Green), agent tag (Energy/Security/…), time-ago; "View all →".
   - **AI Recommendations strip (Intelligence Engine):** 3 recommendation cards, each with agent avatar icon, one-line action, impact chip (e.g. "Save $1,200/mo", "Reduce 8% energy"), and "Apply" secondary button.
   - **Zone occupancy mini heatmap:** 4 zones — Office Floors `82%`, Meeting Rooms `65%`, Common Areas `48%`, Parking `37%` — horizontal bars in status colors.
   - **Bottom data table:** Recent facility activity — columns: Time, Entity, Type, Detail, Status, Agent. 5 rows (e.g. "14:32 · AHU-4 · Energy anomaly · High draw during setpoint · Investigating · Energy").
4. **Footer:** System status (API healthy, DB latency 42ms, agents online 5/5) + environment badge.

**Components & Real Data:**
- Health gauge 94/100 with threshold bands (≥85 green, 70–84 amber, <70 red).
- 4 KPI cards, each: label (steel slate 12px), mono value `clamp(28px,3vw,42px)`, delta chip (▲/▼ + color), mini sparkline.
- Alerts feed chips: Critical=Red `#F87171`, Warning=Amber `#FBBF24`, Info=Blue `#38BDF8`.
- AI recommendation cards: icon, text, impact chip (green for savings), Apply button.

**Interactions:**
- Range filter (Today/7d/30d) re-fetches charts + KPIs.
- Alert bell opens dropdown of latest 5, "Mark all read".
- Recommendation "Apply" → confirmation modal → success toast.
- Row click on table → navigates to relevant dashboard with filter preset.
- Refresh spins and updates the "Last updated HH:MM:SS" mono caption.
- Facility selector switches all data (multi-facility).

**States:**
- Loading: skeleton KPI cards + shimmer chart area.
- Empty: no alerts → "All clear" empty state with green check icon.
- Error: chart area shows retry button + red banner "Failed to load telemetry".
- Offline: banner + LIVE tag turns gray "STALE".

**Responsive Behavior:**
- **1280px+:** 4-column KPI grid, 60/40 two-column section, full-width table.
- **768px:** 2×2 KPI grid, two-column section stacks (chart above feed), heatmap 2×2.
- **360px:** 1-column KPI stack, chart full-width, alerts feed full-width, recommendation cards stack vertically, table becomes horizontal-scroll.

**Design Tokens:**
Panel Slate `#111C33`, Elevated Slate `#1E293B`, Hairline `#243249`, Ice White `#E2E8F0`, Steel Slate `#94A3B8`, Electric Blue `#38BDF8`, Signal Green `#34D399`, Alert Amber `#FBBF24`, Alert Red `#F87171`, Violet Insight `#A78BFA`. Inter UI, JetBrains Mono numerics.
