# AGENTS.md — Agentic FacilityOps AI Platform

Master reference for every agent, skill, MCP server, and workflow in this repository.
Read this file first. Source of truth for project behavior, page specs, design tokens, and tooling.

---

## 1. Project Overview

- **Name:** Agentic FacilityOps AI Platform
- **Subtitle:** AI-Powered Building Operations & Facility Intelligence System
- **Tagline:** Autonomous AI Agents for Smart, Secure & Sustainable Facilities
- **Source doc:** `Agentic_FacilityOps_AI_Platform.xml`

Large facilities (corporate offices, IT parks, universities, hospitals) generate huge operational data from IoT sensors, HVAC, access control, maintenance logs, occupancy monitoring, and utility meters. Facility managers struggle with rising energy costs, delayed maintenance, inefficient space utilization, security incidents, and operational inefficiencies.

This platform uses multiple **autonomous AI agents** that continuously monitor facility operations, optimize resources, predict maintenance, improve security, and reduce operational cost. Agents collaborate through a central **Facility Intelligence Engine**.

### Key outcomes
- AI-driven facility monitoring and automation
- Predictive maintenance & asset health monitoring
- Energy consumption optimization
- Occupancy intelligence & space utilization analytics
- Real-time security monitoring & incident detection
- Operational cost reduction via intelligent recommendations
- Centralized facility operations dashboard
- Automated alerts & escalation workflows
- Sustainability / energy-efficiency reporting
- Improved asset lifespan & facility performance

---

## 2. Directory Map

```
Agentic_FacilityOps_AI_Platform/
├── AGENTS.md                       # This file (master brain)
├── opencode.json                   # opencode config: MCP servers + skills paths
├── README.md                       # Setup guide + Stitch workflow
├── Agentic_FacilityOps_AI_Platform.xml  # Original project spec
├── .stitch/
│   ├── DESIGN.md                   # Design system (source of truth for Stitch)
│   └── designs/                    # Generated screen HTML + screenshots
├── UI-UX-Specs/                    # One MD prompt-spec per page (paste into Stitch)
│   ├── 01-login.md
│   ├── 02-facility-operations-dashboard.md
│   ├── 03-energy-dashboard.md
│   ├── 04-maintenance-dashboard.md
│   ├── 05-occupancy-dashboard.md
│   ├── 06-security-dashboard.md
│   ├── 07-cost-optimization-dashboard.md
│   ├── 08-facility-intelligence.md
│   ├── 09-alerts-notifications-center.md
│   ├── 10-executive-reporting-dashboard.md
│   ├── 11-assets-management.md
│   ├── 12-work-orders.md
│   ├── 13-settings-integrations.md
│   └── 14-ai-copilot-agent-collaboration.md
├── .opencode/
│   └── skills/                     # Project-specific opencode skills
│       ├── stitch-design/          # Stitch prompt-enhancement workflow
│       └── facilityops-ui-spec/    # Page-spec format rules
├── .agents/skills/                 # Installed community skills (npx skills, opencode scope)
└── graphify-out/                   # graphify knowledge graph (generated)
```

---

## 3. Modules & Agents

| # | Module | Capabilities |
|---|--------|--------------|
| 1 | **Energy Agent** | Monitor electricity/water/utility consumption; detect energy wastage; analyze HVAC efficiency; optimize lighting schedules; energy-saving recommendations; forecast energy demand |
| 2 | **Maintenance Agent** | Monitor equipment health; predict maintenance; detect abnormal behavior; track asset lifecycle; generate work orders; reduce downtime |
| 3 | **Occupancy Agent** | Monitor room/building occupancy; space utilization; detect overcrowding; optimize workspace allocation; occupancy heatmaps; forecast usage |
| 4 | **Security Agent** | Access control monitoring; detect unauthorized access; analyze CCTV events; track visitors; security alerts; incident investigation |
| 5 | **Cost Optimization Agent** | Analyze operational expenditure; cost-saving opportunities; vendor optimization; resource allocation; budget compliance; ROI reports |
| 6 | **Facility Analytics & Intelligence Engine** | Aggregate insights from all agents; facility health scores; anomaly detection; operational forecasts; AI recommendations |
| 7 | **Dashboard & Reporting Module** | Facility Ops, Energy, Maintenance, Security, Occupancy, Executive dashboards |
| 8 | **Alert & Automation Module** | Email alerts; SMS; Teams/Slack integration; automated escalations; maintenance ticket creation |

---

## 4. Data Workflow

1. Facility Data (IoT Sensors, HVAC Systems, CCTV, Access Control Systems, Utility Meters)
2. Data Validation & Processing
3. Energy Agent
4. Maintenance Agent
5. Occupancy Agent
6. Security Agent
7. Cost Optimization Agent
8. Facility Intelligence Engine
9. Operational Recommendations
10. Facility Dashboard & Alerts

---

## 5. Architecture

**Data sources:** IoT Sensors · HVAC Systems · Smart Utility Meters · CCTV Cameras · Access Control Systems · Occupancy Sensors · Asset Management System · Maintenance Records

**Agents (functions):**
- Energy Agent → Energy Monitoring, Utility Analytics, Energy Optimization
- Maintenance Agent → Asset Health Monitoring, Predictive Maintenance, Work Order Recommendations
- Occupancy Agent → Space Utilization, Occupancy Analytics, Capacity Forecasting
- Security Agent → Access Monitoring, CCTV Event Analysis, Incident Detection
- Cost Optimization Agent → Operational Cost Analysis, Resource Optimization, Budget Monitoring

**Central component:** Facility Intelligence Engine → Aggregate Insights, Correlate Events, Generate Recommendations, Coordinate Agent Actions

**Shared services:** PostgreSQL Database · Time-Series Data Warehouse · Audit Logs · Historical Facility Data

**Outputs:** Facility/Energy/Maintenance/Security/Executive Dashboards · Mobile App · Email Alerts · SMS · Teams Notifications

---

## 6. Database Schema

| Entity | PK | FKs | Key fields |
|--------|----|-----|------------|
| FACILITIES | facility_id | — | facility_name, facility_type, location |
| ASSETS | asset_id | facility_id → FACILITIES | asset_name, asset_type, status |
| MAINTENANCE_RECORDS | maintenance_id | asset_id → ASSETS | issue_type, maintenance_date, status |
| ENERGY_USAGE | energy_id | facility_id → FACILITIES | timestamp, electricity_usage, water_usage |
| OCCUPANCY_RECORDS | occupancy_id | facility_id → FACILITIES | zone, occupancy_count, timestamp |
| SECURITY_EVENTS | event_id | facility_id → FACILITIES | event_type, severity, timestamp |
| COST_REPORTS | report_id | facility_id → FACILITIES | category, amount, report_date |
| ALERTS | alert_id | facility_id → FACILITIES | alert_type, severity, created_at |

**Relationships:** FACILITIES 1:N → {ASSETS, ENERGY_USAGE, OCCUPANCY_RECORDS, SECURITY_EVENTS, COST_REPORTS, ALERTS}; ASSETS 1:N → MAINTENANCE_RECORDS

---

## 7. Milestones & Canonical Dashboard Data

These values are the **canonical sample dataset** for all page specs and mock UIs.

### M1 Energy Intelligence (weeks 1–2)
- Total Energy: `1.28 MWh` · Cost Savings: `$156.80` · Efficiency Score: `82%` · Carbon Reduction: `15%`
- Energy distribution: HVAC 45% · Lighting 28% · Equipment 18% · Other 9%
- Acceptance: anomaly detection accuracy ≥ 85%

### M2 Predictive Maintenance (weeks 3–4)
- Assets Monitored: `2450` · Maintenance Tickets: `89` · Predicted Failures: `12` · Downtime Reduction: `34%`
- Equipment health: Excellent 68% · Good 22% · Warning 8% · Critical 2%

### M3 Occupancy & Security (weeks 5–6)
- Occupancy Rate: `73%` · Active Visitors: `342` · Security Events: `18` · Unauthorized Access: `4`
- Zone occupancy: Office Floors 82% · Meeting Rooms 65% · Common Areas 48% · Parking 37%
- Acceptance: occupancy forecasting accuracy ≥ 80%

### M4 Cost & Enterprise (weeks 7–8)
- Cost Reduction: `23%` · ROI Generated: `$2.4M` · Facility Health: `94/100` · Optimizations: `18`
- Cost distribution: Energy 38% · Maintenance 25% · Security Ops 18% · Administrative 19%

---

## 8. UI/UX Pages

14 pages, fully responsive (mobile/tablet/desktop). Each has a spec file in `UI-UX-Specs/`.

| # | Page | Route (proposed) | Spec file |
|---|------|------------------|-----------|
| 1 | Login / Sign-in | `/login` | `UI-UX-Specs/01-login.md` |
| 2 | Facility Operations Dashboard | `/` | `UI-UX-Specs/02-facility-operations-dashboard.md` |
| 3 | Energy Dashboard | `/energy` | `UI-UX-Specs/03-energy-dashboard.md` |
| 4 | Maintenance Dashboard | `/maintenance` | `UI-UX-Specs/04-maintenance-dashboard.md` |
| 5 | Occupancy Dashboard | `/occupancy` | `UI-UX-Specs/05-occupancy-dashboard.md` |
| 6 | Security Dashboard | `/security` | `UI-UX-Specs/06-security-dashboard.md` |
| 7 | Cost Optimization Dashboard | `/cost` | `UI-UX-Specs/07-cost-optimization-dashboard.md` |
| 8 | Facility Intelligence | `/intelligence` | `UI-UX-Specs/08-facility-intelligence.md` |
| 9 | Alerts & Notifications Center | `/alerts` | `UI-UX-Specs/09-alerts-notifications-center.md` |
| 10 | Executive Reporting Dashboard | `/reports` | `UI-UX-Specs/10-executive-reporting-dashboard.md` |
| 11 | Assets Management | `/assets` | `UI-UX-Specs/11-assets-management.md` |
| 12 | Work Orders | `/work-orders` | `UI-UX-Specs/12-work-orders.md` |
| 13 | Settings & Integrations | `/settings` | `UI-UX-Specs/13-settings-integrations.md` |
| 14 | AI Copilot / Agent Collaboration | `/copilot` | `UI-UX-Specs/14-ai-copilot-agent-collaboration.md` |

### Global app shell (shared by all authenticated pages)
- **Sidebar navigation** (collapsible): Overview, Energy, Maintenance, Occupancy, Security, Cost, Intelligence, Alerts, Reports, Assets, Work Orders, Copilot, Settings
- **Topbar:** facility selector, live clock, active-alert bell with unread count, theme toggle (dark default), user menu
- **Design tokens** in `.stitch/DESIGN.md`

---

## 9. Design System (summary)

Full spec in `.stitch/DESIGN.md`. Quick tokens:

- **Theme:** Dark-first, industrial / facility-control aesthetic. Light theme variant supported.
- **Backgrounds:** `#0B1120` (deep navy) → `#111C33` (panel) → `#1E293B` (elevated)
- **Accents:** Electric Blue `#38BDF8`, Signal Green `#34D399`, Amber `#FBBF24`, Alert Red `#F87171`
- **Text:** Slate `#94A3B8` (muted) / `#E2E8F0` (primary)
- **Fonts:** Inter (UI) + JetBrains Mono (numerics/data)
- **Radius:** 12px cards, 8px controls · subtle 1px slate borders + soft glow shadows

---

## 10. Installed Skills (when to use)

All community skills installed to `.agents/skills/` (opencode scope) via the `skills` CLI. Load them with the **skill tool** when the task matches.

### addyosmani/agent-skills (engineering lifecycle)
- `frontend-ui-engineering` — building/modifying any UI: component architecture, design systems, responsive, WCAG 2.1 AA
- `spec-driven-development` — write a PRD/spec before code
- `test-driven-development` — red-green-refactor for any logic
- `incremental-implementation` — thin vertical slices; implement/test/verify/commit
- `code-review-and-quality` — five-axis review before merge
- `security-and-hardening` — user input, auth, secrets, OWASP
- `context-engineering` — feeding the agent the right context; MCP integrations
- `documentation-and-adrs` — docs and Architecture Decision Records

### skills.sh / vercel-labs (UI craft)
- `frontend-design` (anthropics/skills) — modern frontend design patterns
- `web-design-guidelines` (vercel-labs/agent-skills) — web design quality guidance
- `tailwind-v4` (mastra-ai/mastra) — Tailwind CSS v4 usage rules
- `vercel-react-best-practices` (vercel-labs/agent-skills) — React best practices

### Project-specific (`.opencode/skills/`)
- `stitch-design` — Stitch prompt enhancement + design-system synthesis + generation workflow
- `facilityops-ui-spec` — rules for writing the `UI-UX-Specs/*.md` page specs

### Other
- `ponytail` (+ `ponytail-review`, `ponytail-audit`, `ponytail-debt`, `ponytail-gain`, `ponytail-help`) — lazy-senior-dev: write only what the task needs; never cut validation, security, accessibility
- `graphify` — code knowledge graph (see §11)

---

## 11. graphify (Code Knowledge Graph)

Turn this codebase into a queryable knowledge graph (local AST parsing via tree-sitter, no vector store).

**Rules:**
- Before answering architecture/codebase questions, read `graphify-out/GRAPH_REPORT.md` for god nodes and community structure.
- Prefer scoped graph queries over grepping raw files when the graph exists.
- After modifying code files, run `graphify update .` to keep the graph current.

**Commands (CLI):**
- `graphify extract .` — build/refresh the knowledge graph into `graphify-out/`
- `graphify update .` — incremental update after edits (AST-only, offline)
- `graphify query "..."` — plain-language question → scoped subgraph
- `graphify path A B` — trace how two things connect
- `graphify explain X` — explain one concept with file:line citations
- `graphify report` — generate `graphify-out/GRAPH_REPORT.md`

**Setup:** `uv tool install graphifyy` (official PyPI package is `graphifyy`, double-y; CLI is `graphify`).

---

## 12. MCP Servers

Configured in `opencode.json`.

| Server | Type | Purpose | Status |
|--------|------|---------|--------|
| `stitch` | remote (`https://stitch.googleapis.com/mcp`) | Generate/edit UI screens via Google Stitch; create projects; manage design systems | enabled — requires `STITCH_API_KEY` env var (header `X-Goog-Api-Key`) |
| `crawl4ai` | local (uvx `walksoda/crawl-mcp`) | LLM-friendly web crawling/scraping for research & data enrichment | **disabled** — enable after installing Docker (preferred) or accepting local uvx build |
| `graphify` | local (`graphify-mcp`, stdio) | Serve the knowledge graph over MCP for graph queries | **disabled** — enable after `graphify extract .` builds `graphify-out/graph.json` and `graphify-mcp` is on PATH |

**Stitch MCP tools:** `create_project`, `list_projects`, `get_project`, `generate_screen_from_text`, `edit_screens`, `generate_variants`, `list_screens`, `get_screen`, `create_design_system`, `list_design_systems`.

**Stitch auth:** Set `STITCH_API_KEY` (from stitch.withgoogle.com) as a user environment variable, then restart opencode. Fallback: OAuth access token via `gcloud`.

**Crawl4AI note:** The user's machine has no Docker. Options to enable:
1. Install Docker Desktop, then configure MCP to `docker run --rm -i -p 3001:9001 stgmt/crawl4ai-mcp ...` pointing at the `unclecode/crawl4ai` engine.
2. Or keep local uvx mode and allow the first-run Python/Playwright build (heavy).

---

## 13. Stitch UI Generation Workflow

1. **Design system:** `.stitch/DESIGN.md` is the source of truth for look & feel. When creating a new Stitch project, call `create_design_system` with its tokens so every screen matches.
2. **Pick a page spec:** read the relevant `UI-UX-Specs/*.md`.
3. **Generate:** call `generate_screen_from_text` with `projectId`, the spec (prompt format: vibe → **PLATFORM** → **PAGE STRUCTURE** → components → data), and `deviceType` (`DESKTOP` for specs that are desktop-first; use `MOBILE`/`TABLET` when a responsive variant is wanted).
4. **Refine:** `edit_screens` for targeted fixes instead of regenerating.
5. **Download:** save `htmlCode.downloadUrl` and `screenshot.downloadUrl` into `.stitch/designs/<page-slug>.html` / `.png`.

Prompt format used by every spec file:
```markdown
[Overall vibe, mood, and purpose of the page]

**PLATFORM:** Web, Desktop-first (responsive to Mobile/Tab)

**PAGE STRUCTURE:**
1. **Header:** ...
2. **Sidebar / Nav:** ...
3. **Primary Content Area:** [component-by-component breakdown]
4. **Footer:** ...
```

---

## 14. Engineering Conventions (this repo)

- **Follow ponytail:** write only what the task needs. Never cut validation, error handling, security, or accessibility to save lines.
- **Skills first:** load the matching skill (skill tool) before non-trivial UI/logic work.
- **Spec before code** for new pages/features; verify with tests where feasible.
- **Docs in AGENTS.md** when behavior changes; ADRs for architectural decisions.
- **Commit discipline:** atomic, small commits; only commit when asked.
- **Responsive rule:** every page must be usable at 360px (mobile), 768px (tablet), 1280px+ (desktop).
- **Accessibility:** WCAG 2.1 AA — keyboard navigable, labeled controls, color-safe contrast on the dark palette.

---

## 15. Verification

- `node --version`, `npx --version` — toolchain
- `uv --version` — Python tooling (graphify, crawl4ai local)
- `graphify query "..."` — confirm knowledge graph is built
- Stitch: `list_projects` via MCP after setting `STITCH_API_KEY`
- Config changes require restarting opencode (config loads once at startup).
