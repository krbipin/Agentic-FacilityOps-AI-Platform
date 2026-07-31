# Energy Dashboard
- **Route:** /energy
- **Page type:** dashboard (app shell)
- **Primary agent:** Energy Agent
- **Data source:** ENERGY_USAGE, FACILITIES, COST_REPORTS, ALERTS

## Vibe & Purpose
Deep-dive into energy telemetry: consumption, distribution, efficiency, and waste. The Energy Agent drives the story — showing where energy goes, what's wasteful, and exactly what to do about it. Numeric-heavy, engineering-grade, with strong visual hierarchy on the four headline KPIs.

**PLATFORM:** Web, Desktop-first (responsive to Mobile/Tab)

**PAGE STRUCTURE:**
1. **Topbar:** facility selector, live clock, alert bell `4`, theme toggle, user menu.
2. **Sidebar:** Overview, Energy (active), Maintenance, Occupancy, Security, Cost, Intelligence, Alerts, Reports, Assets, Work Orders, Copilot, Settings.
3. **Primary Content Area:**
   - **Page header:** "Energy Intelligence" + subtitle "Monitored by the Energy Agent" + range filter (Today / 7d / 30d / 90d) + Compare toggle (vs. baseline) + "LIVE" tag + export button.
   - **KPI row (4 cards):**
     - Total Energy `1.28 MWh` (▼ 4% vs yesterday — green, good)
     - Cost Savings `$156.80` (▲ 12% — green)
     - Efficiency Score `82%` (▲ 3 pts — green; band at 85% target with progress bar)
     - Carbon Reduction `15%` (▲ 2% — green) with CO₂-eq subtext `1.9 t`
   - **Consumption vs Forecast chart (left, 60%):** area/line chart of last 30 days electricity usage (kWh) with dashed forecast line and 85% anomaly-detection confidence band. Status-colored anomalies flagged as red markers.
   - **Energy distribution donut (right, 40%):** HVAC `45%` / Lighting `28%` / Equipment `18%` / Other `9%`. Hover reveals kWh + cost share; click slices filters below table.
   - **HVAC Efficiency panel:** HVAC efficiency gauge `78%`, setpoint vs actual overlay, wastage alert "AHU-4 running during unoccupied hours — potential savings $212/mo".
   - **Wastage insights list (Energy Agent recommendations):**
     - "Dim corridor lighting 23:00–06:00 — save $320/mo" (Amber chip "Lighting")
     - "Schedule AHU-4 off during unoccupied window — save $212/mo"
     - "Shift heavy equipment load to off-peak — save $180/mo"
     Each: agent icon, impact chip, Apply button.
   - **Water usage mini-chart:** water_usage series (m³) last 7d with normal band.
   - **Data table — Energy usage by zone:** columns Zone | Electricity (kWh) | Water (m³) | Cost | Δ | Trend. 5 rows (e.g. "Data Center · 412.5 kWh · 3.2 m³ · $98.40 · ▲6% · sparkline").
4. **Footer:** System status + last sync timestamp.

**Components & Real Data:**
- KPI cards with delta chips: Total Energy `1.28 MWh`, Cost Savings `$156.80`, Efficiency `82%`, Carbon `15%`.
- Donut distribution exactly: HVAC 45, Lighting 28, Equipment 18, Other 9 (%). Legend with mono values.
- Forecast chart with anomaly markers (red dots) matching the ≥85% detection accuracy claim.
- Impact chips on recommendations show dollar/month figures in mono green.

**Interactions:**
- Range filter drives all charts; compare toggle overlays a dashed baseline series.
- Donut slice click filters the zone table.
- Anomaly marker hover → tooltip: "AHU-4 · 14:32 · draw 18% above baseline".
- Export → downloads CSV of current filter.
- Apply recommendation → modal with projected impact → confirm → toast "Energy Agent applied".

**States:**
- Loading: skeleton cards + shimmer charts.
- Empty: no data for range → "No energy data for this period".
- Error: chart retry + banner.
- Live: pulsing green dot + "LIVE".

**Responsive Behavior:**
- **1280px+:** 4 KPI cards, 60/40 chart/donut, HVAC + water side-by-side, full-width table.
- **768px:** 2×2 KPIs, chart stacks above donut, HVAC above water.
- **360px:** KPIs 1-col; charts full-width; recommendations stack; table horizontal-scroll; header wraps with range filter on second row.

**Design Tokens:**
Electric Blue `#38BDF8` primary lines, Signal Green `#34D399` savings/positive, Alert Amber `#FBBF24` wastage, Alert Red `#F87171` anomalies, Panel Slate `#111C33`, Hairline `#243249`, Ice White `#E2E8F0`, Steel Slate `#94A3B8`. JetBrains Mono for all energy numerics.
