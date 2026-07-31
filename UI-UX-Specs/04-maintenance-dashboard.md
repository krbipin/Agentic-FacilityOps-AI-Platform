# Maintenance Dashboard
- **Route:** /maintenance
- **Page type:** dashboard (app shell)
- **Primary agent:** Maintenance Agent
- **Data source:** ASSETS, MAINTENANCE_RECORDS, ALERTS

## Vibe & Purpose
Predictive maintenance command view. Shows asset health at a glance, predicted failures before they happen, and the live ticket backlog. The Maintenance Agent turns raw asset telemetry into "fix this before it breaks" action items. Critical-first hierarchy: anything in Warning/Critical floats to the top.

**PLATFORM:** Web, Desktop-first (responsive to Mobile/Tab)

**PAGE STRUCTURE:**
1. **Topbar:** facility selector, live clock, alert bell `4`, theme toggle, user menu.
2. **Sidebar:** Overview, Energy, Maintenance (active), Occupancy, Security, Cost, Intelligence, Alerts, Reports, Assets, Work Orders, Copilot, Settings.
3. **Primary Content Area:**
   - **Page header:** "Predictive Maintenance" + subtitle "Monitored by the Maintenance Agent" + range filter + "LIVE" tag + "Create Work Order" primary button.
   - **KPI row (4 cards):**
      - Assets Monitored `2,450`
     - Maintenance Tickets `89` (▲ 6 — red, backlog rising)
     - Predicted Failures `12` (▲ 2 — amber, needs attention)
     - Downtime Reduction `34%` (▼ good — green)
    - **Equipment health donut (left, 40%):** Excellent `68%` (green) / Good `22%` (blue) / Warning `8%` (amber) / Critical `2%` (red). Center label "2,450 assets".
   - **Predicted failures list (right, 60%):** top 5 assets at risk, each row: asset name + ID, type (HVAC/Pump/Generator), health chip (Warning/Critical), failure probability mono `%`, predicted window ("Est. 6 days"), and actions (Schedule / Investigate).
     - "AHU-4 · Vibration threshold exceeded · Critical · 92% · Est. 2 days · Investigate"
     - "Chiller-2 · Refrigerant pressure drop · Warning · 74% · Est. 6 days · Schedule"
     - "Gen-7 · Bearing temp rising · Warning · 61% · Est. 12 days · Schedule"
   - **Health trend chart:** asset health score index over 30 days with Warning/Critical threshold bands (amber/red zones).
   - **Recent work orders table:** columns Ticket ID | Asset | Issue type | Priority | Status | Due. 5 rows (e.g. "WO-1042 · AHU-4 · Vibration · Critical · Open · Today").
   - **Maintenance cost mini-panel:** month-to-date `$24,500`, cost avoided via prediction `$11,200` (green), average MTTR `3.2h`.
4. **Footer:** System status + agent heartbeat.

**Components & Real Data:**
- Donut: Excellent 68 / Good 22 / Warning 8 / Critical 2 (%).
- Failure rows with probability mono `92%` and status chips.
- Health trend chart with red/amber threshold bands.
- Work order table with severity color-coded priority.

**Interactions:**
- Donut segment click → filters the predicted-failures list.
- "Schedule" on a failure → creates a work order draft (modal) → routes to Work Orders.
- "Investigate" → opens asset detail drawer with sensor history sparklines.
- Row click on table → asset drawer.
- KPI card click → sets filters (e.g. Predicted Failures card opens only Warning+Critical list).

**States:**
- Loading: skeletons; Empty: "No predicted failures — all assets healthy" green empty state; Error: banner + retry.
- Critical assets section always pinned above the fold with red glow.

**Responsive Behavior:**
- **1280px+:** 4 KPIs; donut (40%) + failure list (60%); trend chart full-width; 2-col bottom (table + cost panel).
- **768px:** 2×2 KPIs; donut stacks over list; bottom stacks.
- **360px:** KPIs 1-col; failure list full-width cards; table horizontal-scroll; "Create Work Order" becomes sticky bottom bar.

**Design Tokens:**
Signal Green `#34D399` Excellent, Electric Blue `#38BDF8` Good, Alert Amber `#FBBF24` Warning, Alert Red `#F87171` Critical, Panel Slate `#111C33`, Hairline `#243249`, Ice White `#E2E8F0`, Steel Slate `#94A3B8`. JetBrains Mono numerics (probabilities, MTTR).
