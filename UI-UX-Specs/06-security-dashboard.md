# Security Dashboard
- **Route:** /security
- **Page type:** dashboard (app shell)
- **Primary agent:** Security Agent
- **Data source:** SECURITY_EVENTS, FACILITIES, ALERTS

## Vibe & Purpose
Real-time security operations: access control, incidents, visitors, and CCTV events. The Security Agent flags unauthorized access and anomalies immediately, with incident investigation support. High-stakes, alert-first design — red events never get buried.

**PLATFORM:** Web, Desktop-first (responsive to Mobile/Tab)

**PAGE STRUCTURE:**
1. **Topbar:** facility selector, live clock, alert bell `4`, theme toggle, user menu.
2. **Sidebar:** Overview, Energy, Maintenance, Occupancy, Security (active), Cost, Intelligence, Alerts, Reports, Assets, Work Orders, Copilot, Settings.
3. **Primary Content Area:**
   - **Page header:** "Security Monitoring" + subtitle "Monitored by the Security Agent" + event filter (All / Unauthorized / Access / CCTV / Visitor) + severity filter + "LIVE" tag.
   - **KPI row (4 cards):**
     - Security Events `18` (last 24h)
     - Unauthorized Access `4` (red, high priority)
     - Active Visitors `342` (green)
     - Doors Secured `142 / 142` (green)
   - **Incident feed (left, 40%):** chronological event list, most severe first. Each row: severity chip (Red/Amber/Blue), event type, location, timestamp, status (Open/Investigating/Resolved), action.
     - "RED · Unauthorized access · Loading Dock B · 2m ago · Open · Investigate"
     - "RED · Badge cloned attempt · Server Room A · 8m ago · Investigating · View"
     - "AMBER · After-hours entry · Office 5 · 26m ago · Investigating · View"
     - "BLUE · Visitor checked in · Front Desk · 41m ago · Closed · View"
   - **Access events chart (right, 60%):** 24h histogram of door access events, overlaid with after-hours window shading; anomaly spikes marked red.
   - **CCTV event analysis panel:** latest analyzed feed thumbnails (3) with AI tags ("Person loitering · Dock B · confidence 91%") and a "Analyze feed" action.
   - **Visitor tracking table:** Name | Company | Badge | Purpose | Zone | Check-in | Check-out | Status. 5 rows.
   - **Security recommendations (Security Agent):**
     - "Require 2FA on Server Room A access" (high impact)
     - "Resolve badge-duplication alert pattern"
     - "Enable night camera preset on Dock B"
4. **Footer:** System status + camera uptime `99.98%`.

**Components & Real Data:**
- Severity chips: Red `#F87171` Critical, Amber `#FBBF24` Warning, Blue `#38BDF8` Info.
- Event rows with status pill + action buttons.
- Access histogram with after-hours band + anomaly markers.
- CCTV cards with confidence mono `91%`.
- Visitor table columns as above.

**Interactions:**
- Severity filter (Critical/Warning/Info) narrows feed.
- "Investigate" → incident drawer with timeline, badge logs, camera clip link.
- Event row click → detail drawer.
- CCTV card click → full clip modal.
- "Mark resolved" on open events updates status + reduces KPI counts.

**States:**
- Loading skeletons; Empty: "No security events — all clear" green state; Error banner.
- Live: pulsing red dot + "LIVE" when an open Critical event exists, else green.

**Responsive Behavior:**
- **1280px+:** 4 KPIs; feed (40%) + chart (60%); CCTV row of 3; visitor table full-width + recommendations 2-col.
- **768px:** 2×2 KPIs; feed stacks over chart; CCTV 3-up wraps to 1×3; table full-width.
- **360px:** KPIs 1-col; feed full-width cards; CCTV cards stack; table horizontal-scroll; "Investigate" becomes full-width per row.

**Design Tokens:**
Alert Red `#F87171` critical, Alert Amber `#FBBF24` warning, Electric Blue `#38BDF8` info, Signal Green `#34D399` secured/ok, Panel Slate `#111C33`, Hairline `#243249`, Ice White `#E2E8F0`, Steel Slate `#94A3B8`. JetBrains Mono timestamps + confidences.
