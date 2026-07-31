# Settings & Integrations
- **Route:** /settings
- **Page type:** settings (app shell)
- **Primary agent:** Alert & Automation Module (channels), all agents (toggles)
- **Data source:** FACILITIES, ALERTS (config), platform meta

## Vibe & Purpose
Configuration hub: notification channels, agent control, facilities, integrations, and team access. Clean, grouped settings with clear save/apply semantics and live connection status for each integration.

**PLATFORM:** Web, Desktop-first (responsive to Mobile/Tab)

**PAGE STRUCTURE:**
1. **Topbar:** facility selector, live clock, alert bell `4`, theme toggle, user menu.
2. **Sidebar:** Overview, Energy, Maintenance, Occupancy, Security, Cost, Intelligence, Alerts, Reports, Assets, Work Orders, Copilot, Settings (active).
3. **Primary Content Area:** (left section nav + right content panel)
   - **Section nav (left, ~240px):** Notifications · Agents · Facilities · Integrations · Team & Roles · Appearance · Security · API.
   - **Panel — Notifications (default):**
      - **Channel cards (Email / SMS / Teams / Slack):** each with logo icon, enabled toggle, connection status dot (green connected / amber pending), "Verify" button, expandable config (e.g. SMTP server, recipient list, webhook URL). Teams: "FacilityOps HQ / #facility-alerts"; Slack: "facilityops.slack.com / #ops-alerts".
      - **Data Services cards (PostgreSQL / Time-Series):** data warehouse connections — PostgreSQL: "facilityops-prod / facilityops" schema; Time-Series (TimescaleDB): 5-year retention for ENERGY_USAGE, OCCUPANCY_RECORDS.
     - **Routing rules:** table — Severity | Agent | Channel (e.g. "Critical · All agents · Email + SMS + Teams"). Add/edit rules.
     - **Escalation policy:** Level 1 (ops) → Level 2 (manager) → Level 3 (director) with time delays (15m / 1h / 4h) and channel per level.
     - **Digest settings:** daily summary time (default 17:00), quiet hours.
   - **Panel — Agents:** 5 agent cards (Energy, Maintenance, Occupancy, Security, Cost) + Intelligence Engine, each with: status (Online green / Paused amber), enabled toggle, "last run" mono, sensitivity slider (Low/Normal/High), per-agent alert thresholds (e.g. Energy anomaly accuracy target `≥85%`).
   - **Panel — Facilities:** active facility "Corporate HQ & IT Park" (type: Corporate HQ + IT Park) with add/remove and set-active controls.
   - **Panel — Integrations:** IoT providers, HVAC vendor, CCTV, Access control, CMMS (asset), Weather API — each with Connect/Configure buttons + auth status. Crawl4AI research note: "Web research connector" (optional, for agent research).
   - **Panel — Team & Roles:** role table (Admin, Facility Manager, Technician, Auditor, Viewer) with member counts; invite button.
   - **Panel — Appearance:** Theme (Dark default / Light / System), accent color picker (Electric Blue default), density (Comfortable/Compact), font scale.
   - **Panel — Security:** password change, MFA status, session list, audit log link.
   - **Panel — API:** API key (masked, regenerate), webhook endpoint, rate limits, SDK snippets.
4. **Footer:** System status + config version.

**Components & Real Data:**
- Channel cards with toggles + status dots + Verify buttons.
- Data Services cards (PostgreSQL, Time-Series warehouse).
- Routing rules table with severity/agent/channel selectors.
- Escalation policy stepper.
- Agent cards with sensitivity sliders + thresholds.
- Integration rows with auth status.
- Role table + appearance + API panels.

**Interactions:**
- Toggles apply instantly with "Saved" toast (auto-save per panel).
- "Verify" channel → sends test alert → success/failure toast.
- Add routing rule → modal row editor.
- Agent sensitivity slider updates threshold chips live.
- Theme toggle in topbar mirrors Appearance setting.
- Integration Connect → OAuth modal → success → status dot turns green.
- API regenerate → confirmation modal (invalidates old key).

**States:**
- Loading skeleton panels; Error: failed save → red banner + revert; Channel offline → amber dot + "Retry".
- Sensitive actions (regenerate key, disable agent) require confirmation modals.

**Responsive Behavior:**
- **1280px+:** section nav + full content panel side-by-side.
- **768px:** section nav becomes horizontal scroll tabs; panels full-width.
- **360px:** tabs wrap; channel cards stack; routing table becomes horizontal scroll; toggles remain accessible (min 44px targets).

**Design Tokens:**
Signal Green `#34D399` connected/online, Alert Amber `#FBBF24` pending/paused, Alert Red `#F87171` errors, Electric Blue `#38BDF8` primary actions, Panel Slate `#111C33`, Hairline `#243249`, Ice White `#E2E8F0`, Steel Slate `#94A3B8`. JetBrains Mono for thresholds, API keys, timestamps.
