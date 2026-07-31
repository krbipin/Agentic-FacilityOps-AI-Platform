# Cost Optimization Dashboard
- **Route:** /cost
- **Page type:** dashboard (app shell)
- **Primary agent:** Cost Optimization Agent
- **Data source:** COST_REPORTS, FACILITIES, ENERGY_USAGE, MAINTENANCE_RECORDS, SECURITY_EVENTS, ALERTS

## Vibe & Purpose
The money view. The Cost Optimization Agent analyzes operational expenditure, finds savings, monitors budget compliance, and quantifies ROI. Financial dashboard aesthetics: clear dollar hierarchy, budget bars, and save actions with hard dollar impact.

**PLATFORM:** Web, Desktop-first (responsive to Mobile/Tab)

**PAGE STRUCTURE:**
1. **Topbar:** facility selector, live clock, alert bell `4`, theme toggle, user menu.
2. **Sidebar:** Overview, Energy, Maintenance, Occupancy, Security, Cost (active), Intelligence, Alerts, Reports, Assets, Work Orders, Copilot, Settings.
3. **Primary Content Area:**
   - **Page header:** "Cost Optimization" + subtitle "Monitored by the Cost Optimization Agent" + period filter (This month / Quarter / Year) + "Export report" button.
   - **KPI row (4 cards):**
     - Cost Reduction `23%` (green)
     - ROI Generated `$2.4M` (green)
     - Facility Health `94/100` (green)
     - Optimizations Live `18` (blue)
   - **Cost distribution donut (left, 40%):** Energy Costs `38%` / Maintenance `25%` / Security Operations `18%` / Administrative `19%`. Center label "Total $412,000". Hover → exact dollar; click → filters table.
   - **Budget compliance panel (right, 60%):** per-category budget bars — Energy `$156,560 / $165,000` (green, on track), Maintenance `$103,000 / $110,000` (green), Security Ops `$74,160 / $80,000` (green), Administrative `$78,280 / $75,000` (red, over). Each bar shows % of budget used + remaining.
   - **Savings opportunities list (Cost Agent recommendations):**
     - "Optimize HVAC schedule across floors 2–4 — save $4,800/mo" (Apply)
     - "Renegotiate janitorial vendor — save $3,200/mo" (Apply)
     - "Shift to off-peak energy for data center — save $2,100/mo" (Apply)
     Each with projected annual impact chip (mono `$/yr`).
   - **Cost trend chart:** monthly operational spend line vs. budget line, with the reduction trend annotated ("-23% YoY").
   - **Vendor spend table:** Vendor | Category | Spend | vs. budget | Δ | Last paid. 5 rows.
   - **ROI summary panel:** "AI recommendations applied this quarter" — `18` optimizations, `$96,400` realized savings, `6.2x` return multiple.
4. **Footer:** System status + financial data sync.

**Components & Real Data:**
- Donut: Energy 38, Maintenance 25, Security 18, Admin 19 (%).
- Budget bars with green/red over-budget states.
- Savings rows with `$` mono impact chips.
- Cost trend vs budget lines.
- ROI panel with `6.2x` multiple.

**Interactions:**
- Period filter re-drives donut, budget bars, trend.
- Donut slice click → vendor table filter.
- Apply savings → modal "Projected annual impact" → confirm → toast + updates Optimizations Live KPI.
- Export → CSV/PDF.
- Over-budget bar click → drill into category detail.

**States:**
- Loading skeletons; Empty: no spend data → empty state; Error banner.
- Over-budget categories get persistent red tag "OVER".

**Responsive Behavior:**
- **1280px+:** 4 KPIs; donut (40%) + budget bars (60%); trend full-width; opportunities + vendor table 2-col; ROI panel full-width.
- **768px:** 2×2 KPIs; donut stacks; budget bars full-width; vendor table full-width.
- **360px:** KPIs 1-col; donut full-width; budget bars stacked; opportunities cards stack; table horizontal-scroll.

**Design Tokens:**
Signal Green `#34D399` savings/on-track, Alert Red `#F87171` over-budget, Alert Amber `#FBBF24` caution, Electric Blue `#38BDF8` optimizations, Panel Slate `#111C33`, Hairline `#243249`, Ice White `#E2E8F0`, Steel Slate `#94A3B8`. JetBrains Mono for all `$` figures.
