# Alerts & Notifications Center
- **Route:** /alerts
- **Page type:** management (app shell)
- **Primary agent:** Alert & Automation Module (all agents emit alerts)
- **Data source:** ALERTS, FACILITIES, SECURITY_EVENTS, MAINTENANCE_RECORDS

## Vibe & Purpose
The single inbox for every alert, escalation, and automated action across all agents. Operators triage by severity, bulk-resolve, and see the automation pipeline (email/SMS/Teams/Slack) that fired for each. Red-first triage, with powerful filters and status workflows.

**PLATFORM:** Web, Desktop-first (responsive to Mobile/Tab)

**PAGE STRUCTURE:**
1. **Topbar:** facility selector, live clock, alert bell `4`, theme toggle, user menu.
2. **Sidebar:** Overview, Energy, Maintenance, Occupancy, Security, Cost, Intelligence, Alerts (active), Reports, Assets, Work Orders, Copilot, Settings.
3. **Primary Content Area:**
   - **Page header:** "Alerts & Notifications" + subtitle "Orchestrated by the Alert & Automation Module" + "Configure channels →" link (to Settings) + "Mark all read" button.
   - **Summary strip:** 3 mini-cards — Open `12`, Acknowledged `18`, Resolved `59` (24h); plus severity distribution chip row (Critical `4` red / Warning `7` amber / Info `1` blue).
   - **Toolbar:** search box, severity filter, agent filter (All agents dropdown), status filter, date range, sort.
   - **Alert list (main content):** each row/card:
     - Severity chip (Red/Amber/Blue) + type icon
     - Title: e.g. "Unauthorized access — Loading Dock B"
     - Meta line (steel slate): agent tag · zone · timestamp (mono relative)
     - Status pill: Open / Acknowledged / Resolved
      - Automation badges: which channels fired — `Email ✓`, `SMS ✓`, `Teams ✓`, `Slack ✓`
     - Actions: Acknowledge, Resolve, Escalate, View
     - 7 sample alerts mixing domains:
       1. RED · Security · "Unauthorized access — Loading Dock B" · 2m · Open · Email/SMS/Teams
       2. RED · Maintenance · "AHU-4 predicted failure (92%)" · 12m · Open · Email/SMS
       3. AMBER · Energy · "AHU-4 draw 18% above baseline" · 28m · Acknowledged · Email
       4. AMBER · Occupancy · "Open Plan A at 92% capacity" · 1h · Open · Email
       5. AMBER · Cost · "Administrative budget over by 4%" · 3h · Open · Email/Teams
       6. BLUE · Energy · "Off-peak shift opportunity identified" · 5h · Acknowledged · Teams
       7. BLUE · Security · "Visitor checked in — Front Desk" · 6h · Resolved · —
   - **Escalation timeline drawer (right, on selection):** shows the automated path — "14:30 Alert created → 14:31 Email to ops → 14:35 SMS to on-call → 14:45 Escalated to manager (Level 2)".
4. **Footer:** System status + delivery health (channels online 4/4).

**Components & Real Data:**
- Severity chips, status pills, automation badges with ✓/✗.
- Alert rows with inline actions.
- Escalation timeline with Level 1/2 markers.
- Filter toolbar.

**Interactions:**
- Acknowledge/Resolve update status pill + summary counts instantly.
- Escalate → modal choosing level + channel → adds timeline entry + fires channel simulation.
- Search filters by title/zone/agent.
- Bulk select + "Resolve selected".
- Row click → detail drawer with escalation timeline + full payload.

**States:**
- Loading skeletons; Empty: "No alerts match filters" + "Clear filters" button; Error banner; Offline: delivery health shows channel down + amber banner.
- Unread alerts carry a left accent bar; read alerts dim.

**Responsive Behavior:**
- **1280px+:** 3 summary cards; alert list full-width; drawer slides right on selection.
- **768px:** summary 3-up; alert rows compress (meta line wraps); automation badges collapse into a single "Sent: 4 channels" line.
- **360px:** summary cards 1-col; alerts as stacked cards (title, chips, actions stacked); toolbar wraps into two rows; drawer becomes full-screen sheet.

**Design Tokens:**
Alert Red `#F87171` critical, Alert Amber `#FBBF24` warning, Electric Blue `#38BDF8` info, Signal Green `#34D399` resolved, Panel Slate `#111C33`, Hairline `#243249`, Ice White `#E2E8F0`, Steel Slate `#94A3B8`. JetBrains Mono for timestamps.
