# Executive Reporting Dashboard
- **Route:** /reports
- **Page type:** dashboard/reporting (app shell)
- **Primary agent:** Facility Intelligence Engine + Cost Optimization Agent
- **Data source:** COST_REPORTS, ENERGY_USAGE, MAINTENANCE_RECORDS, OCCUPANCY_RECORDS, SECURITY_EVENTS, ALERTS

## Vibe & Purpose
Boardroom-ready summary for executives: top-line outcomes, sustainability, ROI, and health — digestible in 60 seconds. Cleaner, more spacious than ops dashboards, fewer alerts, more narrative. Executive tone: fewer numbers on screen, bigger headlines, "so what" callouts.

**PLATFORM:** Web, Desktop-first (responsive to Mobile/Tab)

**PAGE STRUCTURE:**
1. **Topbar:** facility selector, live clock, alert bell `4`, theme toggle, user menu.
2. **Sidebar:** Overview, Energy, Maintenance, Occupancy, Security, Cost, Intelligence, Alerts, Reports (active), Assets, Work Orders, Copilot, Settings.
3. **Primary Content Area:**
   - **Page header:** "Executive Report" + subtitle "Q3 · Corporate HQ & IT Park" + period selector (Quarter / Year) + "Generate PDF" + "Schedule delivery" buttons.
   - **Executive summary callout (left, 60%):** 3-line narrative in larger type: "Operational cost down 23% this quarter. AI optimization agents generated $2.4M in value and cut energy 15%. Facility health at 94/100 — all systems nominal." Supporting numbers in mono.
   - **Headline KPI row (right, 40% or below callout on mobile):** Cost Reduction `23%` (green), ROI Generated `$2.4M` (green), Facility Health `94/100` (violet), Optimizations `18` (green).
   - **Outcome trend chart:** quarterly bar chart of operational spend vs. budget vs. prior year with "23% down" annotation.
   - **Domain scorecards (4 cards):** Energy `88/100` "8% efficiency gain", Maintenance `91/100` "34% less downtime", Occupancy `85/100` "73% utilization", Security `79/100` "4 unauthorized attempts, all resolved".
   - **Sustainability panel:** Carbon Reduction `15%` with chart of CO₂-eq trend + "Energy from renewables 32%".
   - **Narrative insights list (Executive Intelligence):** 3 plain-language callouts:
     - "HVAC optimization saved $4,800/mo — the single largest AI contribution."
     - "Consolidating floors 4–5 could free 22% of space — potential $54k/yr."
     - "Security hardening closed 3 badge-duplication gaps."
   - **KPI table — agent performance:** Agent | Health | Cost reduction | ROI | Downtime. 5 rows (Energy `88/100`, Maintenance `91/100`, Occupancy `85/100`, Security `79/100`, Cost Optimization `93/100`).
4. **Footer:** "Prepared by FacilityOps AI · Generated 2026-07-31 · data through 2026-07-30".

**Components & Real Data:**
- Narrative callout with big type + mono figures.
- KPI row: 23%, $2.4M, 94/100, 18 optimizations.
- Quarterly bar chart with annotations.
- 4 domain scorecards.
- Sustainability panel with CO₂ trend.
- Agent performance comparison table.

**Interactions:**
- Period selector (Quarter/Year) re-renders all charts + narrative.
- "Generate PDF" → downloads branded report.
- "Schedule delivery" → modal (recipients, cadence, channels: Email/Teams).
- Scorecard click → drills to that domain dashboard.
- Hover on chart bars → exact values.

**States:**
- Loading skeletons; Empty: no data for period; Error banner; "Data as of" timestamp always shown.
- PDF generation shows progress toast.

**Responsive Behavior:**
- **1280px+:** callout (60%) + KPI row (40%); trend chart full-width; scorecards 4-up; sustainability + insights 2-col; agent table full-width.
- **768px:** callout full-width; KPIs 2×2; scorecards 2×2; stacks.
- **360px:** everything stacks; KPI row 1-col; PDF button becomes full-width; tables horizontal-scroll.

**Design Tokens:**
Signal Green `#34D399` outcomes, Violet Insight `#A78BFA` health, Electric Blue `#38BDF8` links, Panel Slate `#111C33`, Hairline `#243249`, Ice White `#E2E8F0`, Steel Slate `#94A3B8`. Serif-neutral executive headline styling via Inter 600–700; JetBrains Mono for figures.
