# Design System: Agentic FacilityOps AI Platform

**Project ID:** `facilityops-ai` (create via Stitch MCP `create_project`)
**Aesthetic:** Dark-first, industrial facility-control command center — precision, data density, and calm under pressure.

---

## 1. Visual Theme & Atmosphere

This is the command center for a living building. The design feels like a mission-control / SCADA aesthetic for facility operations: deep navy surfaces, high-contrast telemetry, glowing status accents, monospaced numerals. Mood is **precise, observant, trustworthy, technically dense but uncluttered**. Every visual element earns its place; whitespace gives the telemetry room to breathe. The interface should read as "serious infrastructure software," never playful consumer UI. Support a light theme variant that preserves the same data hierarchy.

**Design Principles:**
- Data-dense but scannable — KPIs and alerts above the fold.
- Status communicates instantly through color (green=healthy, amber=caution, red=critical, blue=info/action).
- Numbers are always in monospace; labels in UI sans.
- Glow is subtle — status indicators pulse softly, never strobe.

---

## 2. Color Palette & Roles

### Dark Theme (default)
| Role | Descriptive Name | Hex |
|------|------------------|-----|
| Background (deepest) | Abyss Navy | `#0B1120` |
| Panel / Card | Panel Slate | `#111C33` |
| Elevated surface | Elevated Slate | `#1E293B` |
| Border (subtle) | Hairline Slate | `#243249` |
| Primary text | Ice White | `#E2E8F0` |
| Muted text / labels | Steel Slate | `#94A3B8` |
| Primary accent / action | Electric Blue | `#38BDF8` |
| Success / healthy | Signal Green | `#34D399` |
| Warning / caution | Alert Amber | `#FBBF24` |
| Critical / danger | Alert Red | `#F87171` |
| Info / intelligence | Violet Insight | `#A78BFA` |

### Light Theme (variant)
| Role | Hex |
|------|-----|
| Background | `#F1F5F9` |
| Panel / Card | `#FFFFFF` |
| Border | `#E2E8F0` |
| Primary text | `#0F172A` |
| Muted text | `#64748B` |
| Accents | Same accent set (ensure WCAG AA contrast) |

---

## 3. Typography Rules

- **UI font:** `Inter` — used for labels, headings, body, and navigation. Headings at weights 600–700; body at 400–500.
- **Data/numerics font:** `JetBrains Mono` — every KPI value, timestamp, meter reading, table numeric, and code uses monospace so telemetry scans fast and aligns cleanly.
- **Hierarchy:** Page titles `clamp(20px, 2vw, 28px)` semibold; section headers 14–16px semibold uppercase-lite; KPI numerals `clamp(28px, 3vw, 42px)` mono semibold; captions/meta 11–12px.
- Letter-spacing: uppercase labels track slightly wider (+0.05em); mono numerics default.

---

## 4. Component Stylings

- **Cards / Panels:** `#111C33` surface, `12px` corner radius, `1px` `#243249` hairline border, soft outer glow shadow (`0 0 0 1px rgba(56,189,248,0.04), 0 12px 32px rgba(0,0,0,0.35)`). Hover: border brightens toward `#38BDF8` at 30% alpha.
- **Buttons:**
  - *Primary:* Electric Blue `#38BDF8` fill, dark navy text, `8px` radius, hover brightens, active compresses slightly.
  - *Secondary:* transparent, `1px` slate border, ice-white text, hover border→Electric Blue.
  - *Danger/ghost:* red-tinted border for destructive actions only.
- **Inputs / Forms:** `#0B1120` field background, `1px` `#243249` border, `8px` radius, focus ring Electric Blue (2px, 40% alpha). Labels 12px steel slate above fields.
- **Status chips / badges:** 4px radius pill, tinted bg at ~15% alpha of the status color, colored text, optional pulsing dot for live states.
- **Charts:** lines glow at ~2px with a soft gradient fill beneath; donut/bar colors always map to the status palette; grid lines `#243249` at 25% alpha; axis labels steel slate mono.
- **Tables:** header row steel-slate uppercase 11px, row hover `#1E293B`, row separators hairline `#243249` at 60%; numerics right-aligned mono.
- **Sidebar:** `#0B1120` rail, active item = Electric Blue left indicator bar + elevated slate pill; collapsed to icon-only at tablet widths.
- **Topbar:** elevated slate `#1E293B`, sticky, contains facility selector, live clock (mono), alert bell with red unread count, theme toggle, avatar.

---

## 5. Layout Principles

- **Grid:** 12-column desktop grid, 24px gutters, 24px page padding; breakpoints at 360px / 768px / 1280px+. Cards snap to the grid, KPIs in 3–4 across desktop, 2 across tablet, 1 across mobile.
- **Whitespace:** 24px between card groups, 16px inside cards; content blocks stack vertically on mobile with horizontal scroll only for wide data tables.
- **Density:** information-dense but with deliberate grouping — never cram more than ~5 KPI cards per row.
- **Alignment:** consistent 8px spacing scale everywhere; numbers always right-aligned in tables; chart axes baseline-aligned.
- **Responsive:** desktop-first, but every screen is verified at 360px, 768px, and 1280px+. Sidebar collapses to icons at ≤1024px and to a drawer at ≤768px.

---

## 6. Data Visualization Conventions

- Every chart carries a title, mono unit suffix (kWh, %, $, count), and a last-updated timestamp.
- Use the status palette consistently: Healthy=Signal Green, Caution=Alert Amber, Critical=Alert Red, Action/Info=Electric Blue.
- KPI deltas show an inline arrow (▲/▼) and color: up+good=green, up+bad=red, etc., with a 24h comparison caption.
- Live/realtime widgets show a small pulsing green dot + "LIVE" mono tag.
