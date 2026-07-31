---
name: facilityops-ui-spec
description: Write the UI-UX-Specs/*.md page specifications for this project. Use when creating or editing a page spec so it is Stitch-ready, fully responsive, data-complete, and consistent with the Agentic FacilityOps design system.
---

# FacilityOps Page-Spec Format

Every page spec in `UI-UX-Specs/` follows one consistent structure so it can be pasted straight into Stitch (desktop-first, fully responsive) and stays consistent with `.stitch/DESIGN.md`.

## Frontmatter-style header

```markdown
# <Page Name>
- **Route:** /<route>
- **Page type:** <login | dashboard | management | settings | chat>
- **Primary agent:** <Energy | Maintenance | Occupancy | Security | Cost | Intelligence | —>
- **Data source (tables):** <from AGENTS.md §6 DB schema>
```

## Required sections (in order)

1. **Vibe & Purpose** — one paragraph: the mood (from DESIGN.md: precise, observant, command-center) and what the user accomplishes here.
2. **PLATFORM** — `Web, Desktop-first (responsive to Mobile/Tab)`.
3. **Page Structure** — numbered blocks:
   - `1. Header:` (topbar — facility selector, live clock, alert bell, theme toggle, user menu)
   - `2. Sidebar / Nav:` (collapsible rail; active item highlighted; note mobile drawer behavior)
   - `3. Primary Content Area:` component-by-component breakdown
   - `4. Footer:` (system status / meta)
4. **Components & Real Data** — every KPI card, chart, table, and widget with:
   - exact label + unit
   - **canonical sample values from AGENTS.md §7** (e.g. Total Energy `1.28 MWh`, Assets Monitored `2450`)
   - chart type + series + palette mapping (status colors)
   - table columns + 3–5 example rows
5. **Interactions** — filters, sort, drill-down, refresh, hover tooltips, actions (e.g. "Generate Work Order").
6. **States** — loading skeleton, empty, error/offline, live-update indicator (pulsing green dot + LIVE).
7. **Responsive Behavior** — explicit layout at 360px / 768px / 1280px+ per section.
8. **Design Tokens** — reference the role names (Panel Slate, Electric Blue, JetBrains Mono numerics, 12px radius) — never invent new colors.

## Rules

- Always include real numbers from AGENTS.md §7 — never invent or leave `XXXX` placeholders.
- Every dashboard must expose the KPI, chart, and at least one data table or list.
- Data tables on mobile become stacked cards or horizontal scroll — spec it explicitly.
- All interactive controls need accessible labels and keyboard operation (WCAG 2.1 AA).
- The final MD must be usable verbatim as a Stitch prompt (no references to "the screenshot" or dev-tool jargon).
