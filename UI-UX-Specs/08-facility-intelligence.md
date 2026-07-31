# Facility Intelligence
- **Route:** /intelligence
- **Page type:** analytics (app shell)
- **Primary agent:** Facility Intelligence Engine (all agents feed it)
- **Data source:** ALL tables (aggregated/correlated)

## Vibe & Purpose
The brain of the platform. This page surfaces the Facility Intelligence Engine's cross-agent synthesis: health scoring, anomaly detection, event correlation, and forecasts. A place for operators and analysts to see *why* things happen across domains and what the AI recommends next. Visually distinct with Violet Insight `#A78BFA` intelligence accents.

**PLATFORM:** Web, Desktop-first (responsive to Mobile/Tab)

**PAGE STRUCTURE:**
1. **Topbar:** facility selector, live clock, alert bell `4`, theme toggle, user menu.
2. **Sidebar:** Overview, Energy, Maintenance, Occupancy, Security, Cost, Intelligence (active), Alerts, Reports, Assets, Work Orders, Copilot, Settings.
3. **Primary Content Area:**
   - **Page header:** "Facility Intelligence" + subtitle "Synthesized by the Facility Intelligence Engine" + insight filter (All / Anomalies / Forecasts / Correlations / Health) + "Explain" toggle.
   - **Platform Impact KPI strip (top):** Cost Reduction `23%`, ROI Generated `$2.4M`, Facility Health `94/100`, Optimizations `18` — the executive-level outcomes aggregated from all agents.
   - **Health score hero (left, 50%):** large Facility Health gauge `94/100` (Violet arc) + sub-scores per domain (Energy `88`, Maintenance `91`, Occupancy `85`, Security `79`, Cost `93`) as vertical mini-bars. Trend sparkline 30d. Explanation text when "Explain" is on: "Energy improved 4pts after AHU schedule change on Jul 14."
   - **Cross-agent correlation panel (right, 50%):** detected correlations, each with confidence mono:
     - "High energy draw ↔ late-floor occupancy (r=0.82) — equipment running for empty floors"
     - "After-hours access ↔ server-room temperature spikes"
     - "Meeting-room booking drop ↔ floor consolidation opportunity"
   - **Anomaly detection feed:** list of anomalies detected across agents, each with severity, domain tag, timestamp, status. E.g. "AMBER · Energy · AHU-4 draw 18% above baseline · 14:32 · Open".
   - **Operational forecasts panel:** 3 forecast cards — Energy demand (next 7d), Occupancy (next 7d), Maintenance load (next 30d) — each with a sparkline + confidence band + headline value.
   - **Recommendation log (table):** ID | Agent | Recommendation | Impact | Status | Date. 5 rows.
   - **Agent collaboration map (bottom):** visual graph of the 5 agents + engine showing recent interactions (Energy→Maintenance "flagged AHU wear", Occupancy→Cost "space saving", etc.). Nodes with agent icons, edges labeled with shared insights.
4. **Footer:** System status + model version.

**Components & Real Data:**
- Platform Impact strip: 23%, $2.4M, 94/100, 18.
- Health gauge 94/100 + 5 sub-score bars.
- Correlation cards with `r=0.82` mono correlation + confidence.
- Anomaly feed with severity chips + domain tags.
- Forecast cards with headline values (e.g. "Peak 1.34 MWh Tue").
- Collaboration graph with agent nodes and edge labels.
- Recommendation table with impact chips.

**Interactions:**
- Insight filter narrows sections.
- "Explain" toggle reveals plain-language rationale under each chart/card.
- Anomaly click → drill to originating agent dashboard.
- Correlation click → expands "Why it matters" + suggested action.
- Forecast card click → full forecast chart modal.
- Collaboration edge hover → shows the shared insight text.

**States:**
- Loading skeletons; Empty: "No anomalies — all systems nominal"; Error banner; Model-offline state: "Engine degraded — forecasts may be stale".

**Responsive Behavior:**
- **1280px+:** health (50%) + correlations (50%); anomalies + forecasts 2-col; recommendation table full-width; map full-width.
- **768px:** hero stacks; correlations below; forecasts 2-col; map simplified.
- **360px:** all sections stack; health sub-scores become horizontal scroll; map renders as list of edge labels.

**Design Tokens:**
Violet Insight `#A78BFA` primary intelligence accent, Electric Blue `#38BDF8`, Signal Green `#34D399`, Alert Amber `#FBBF24`, Alert Red `#F87171`, Panel Slate `#111C33`, Hairline `#243249`, Ice White `#E2E8F0`, Steel Slate `#94A3B8`. JetBrains Mono for scores, r-values, confidences.
