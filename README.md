# Agentic FacilityOps AI Platform

**AI-Powered Building Operations & Facility Intelligence System**
Autonomous AI Agents for Smart, Secure & Sustainable Facilities.

This repo contains the complete UI/UX design system and per-page specs for a 14-page facility operations platform, plus the AI-agent tooling (skills + MCP servers) that powers the build.

---

## What's inside

| Path | Purpose |
|------|---------|
| `Agentic_FacilityOps_AI_Platform.xml` | Original project specification (modules, agents, DB schema, milestones) |
| `AGENTS.md` | Master reference for agents — read this first |
| `.stitch/DESIGN.md` | Design system (source of truth for Stitch generation) |
| `UI-UX-Specs/` | 14 prompt-specs, one per page — paste into Stitch to generate |
| `.stitch/designs/` | Generated HTML + screenshots (output) |
| `opencode.json` | opencode config: Stitch + Crawl4AI MCP servers, skills paths |
| `.agents/skills/` | Installed community skills (agent-skills, skills.sh, ponytail) |
| `.opencode/skills/` | Project-specific skills (stitch-design, facilityops-ui-spec) |
| `graphify-out/` | graphify code knowledge graph (generated) |

---

## The 14 pages

| # | Page | Route | Spec |
|---|------|-------|------|
| 1 | Sign-in / Sign-up (Clerk default) | `/sign-in` `/sign-up` | `UI-UX-Specs/01-login.md` (superseded by Clerk's default page) |
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

---

## Stitch workflow (generate a page)

1. Open [Stitch](https://stitch.withgoogle.com) and sign in.
2. Create a project (or reuse `facilityops-ai`). Apply `.stitch/DESIGN.md` as the design system.
3. Open any spec file from `UI-UX-Specs/`, copy the whole prompt, and paste it into Stitch chat.
4. Generate as **DESKTOP** (each spec is desktop-first and fully responsive).
5. Download the HTML + screenshot, or connect the Stitch MCP server to generate programmatically (below).

### Auto-generate via MCP (opencode)
1. Set the `STITCH_API_KEY` environment variable (create a key at stitch.withgoogle.com).
2. Restart opencode.
3. Ask: "Generate all 14 pages from UI-UX-Specs into the stitch project." The agent uses `create_project` → `create_design_system` → `generate_screen_from_text` per spec → downloads into `.stitch/designs/`.

---

## Tooling setup

### Prerequisites
- Node.js 18+ (`node`, `npx`)
- `uv` (Python tool manager) — `curl -LsSf https://astral.sh/uv/install.sh | sh`
- Optional: Docker Desktop (preferred for Crawl4AI)

### MCP servers (`opencode.json`)
| Server | Type | Requires |
|--------|------|----------|
| `stitch` | remote (`https://stitch.googleapis.com/mcp`) | `STITCH_API_KEY` env var |
| `crawl4ai` | local `uvx walksoda/crawl-mcp` | **disabled** until Docker installed or local build accepted |

Config loads once at startup — **restart opencode after changing `opencode.json` or env vars.**

### Skills
Installed to `.agents/skills/` (opencode scope):
```bash
npx skills add addyosmani/agent-skills --skill frontend-ui-engineering --skill spec-driven-development --skill test-driven-development --skill incremental-implementation --skill code-review-and-quality --skill security-and-hardening --skill context-engineering --skill documentation-and-adrs -a opencode
npx skills add vercel-labs/frontend-design vercel-labs/web-design-guidelines vercel-labs/tailwind-best-practices vercel-labs/vercel-react-best-practices -a opencode
npx skills add DietrichGebert/ponytail -a opencode
```

### graphify (code knowledge graph)
```bash
uv tool install graphifyy
graphify extract .          # build the graph
graphify query "..."        # ask questions against the code
```

---

## Conventions

- Follow **ponytail**: write only what the task needs; never cut validation, security, or accessibility.
- Spec before code; tests where feasible; small atomic commits.
- Every page must work at **360px / 768px / 1280px+** and meet **WCAG 2.1 AA**.
- Design tokens live in `.stitch/DESIGN.md` — never hardcode colors in specs.
