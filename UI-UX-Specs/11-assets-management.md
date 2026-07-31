# Assets Management
- **Route:** /assets
- **Page type:** management (app shell)
- **Primary agent:** Maintenance Agent (asset lifecycle)
- **Data source:** ASSETS, MAINTENANCE_RECORDS, FACILITIES

## Vibe & Purpose
The complete asset register with health, lifecycle, and maintenance history. Operators browse, search, filter, and inspect every piece of equipment; the Maintenance Agent keeps each asset's health scoring and lifecycle status current.

**PLATFORM:** Web, Desktop-first (responsive to Mobile/Tab)

**PAGE STRUCTURE:**
1. **Topbar:** facility selector, live clock, alert bell `4`, theme toggle, user menu.
2. **Sidebar:** Overview, Energy, Maintenance, Occupancy, Security, Cost, Intelligence, Alerts, Reports, Assets (active), Work Orders, Copilot, Settings.
3. **Primary Content Area:**
   - **Page header:** "Assets" + subtitle "2,450 assets monitored by the Maintenance Agent" + "Add asset" primary button + "Import CSV" secondary.
   - **KPI strip:** Total Assets `2,450` · Healthy `1,667` (68%) · Warning `196` (8%) · Critical `49` (2%) — with mini distribution bar.
   - **Toolbar:** search (name/ID), type filter (HVAC / Lighting / Pumps / Generators / Elevators / Access), status filter (Excellent/Good/Warning/Critical), facility filter, sort, "Export".
   - **Asset table:** columns ID | Asset name | Type | Facility | Location | Status | Health score | Last maintenance | Next due | Actions.
     Sample rows:
     - `AST-1042` · AHU-4 · HVAC · HQ · Floor 2 Plant · Critical · 42/100 · Jul 12 · Overdue · View/Work Order
     - `AST-1043` · Chiller-2 · HVAC · HQ · Basement · Warning · 61/100 · Jun 28 · Aug 08 · View
      - `AST-1188` · Gen-7 · Generator · Corporate HQ & IT Park · Bldg B Roof · Good · 78/100 · May 02 · Aug 22 · View
     - `AST-2031` · Elev-4 · Elevator · HQ · Tower A · Excellent · 95/100 · Jul 20 · Oct 15 · View
     - `AST-3044` · VRF-12 · HVAC · IT Park · Bldg C · Excellent · 97/100 · Jun 11 · Sep 30 · View
   - **Pagination footer:** `Showing 1–25 of 2,450` + page controls + per-page selector.
   - **Asset detail drawer (on row click):**
     - Header: name, ID, type, health score gauge + status chip.
     - Attribute grid: facility, location, install date, manufacturer, lifecycle stage (e.g. "Active · 68% useful life").
     - **Health trend sparkline** 90d.
     - **Maintenance history table:** date, issue type, cost, technician, status (5 rows).
     - **Prediction card:** "Predicted failure in ~6 days · confidence 92%" + actions (Schedule work order / Dismiss).
4. **Footer:** System status + last asset sync.

**Components & Real Data:**
- Health score gauge per asset (mono).
- Status chips color-mapped: Excellent green, Good blue, Warning amber, Critical red.
- Maintenance history with cost column.
- Prediction card with confidence.
- KPI strip + distribution bar.

**Interactions:**
- Search-as-you-type filters table (debounced).
- Filters combine (AND); each has clear button.
- Row click → detail drawer; "Work Order" → pre-fills create-work-order modal with asset.
- Sort on ID/Health/Status/Next due.
- Export → CSV of filtered view.
- Add asset → modal form (name, type, facility, location, install date, manufacturer).

**States:**
- Loading skeleton rows; Empty: "No assets match filters" + clear; Error banner; pagination spinner.
- Critical rows have red left accent; Warning amber.

**Responsive Behavior:**
- **1280px+:** full table with all columns; drawer right.
- **768px:** table hides Location + Manufacturer columns (toggleable); KPI strip 4-up.
- **360px:** table becomes card list (name+status+score per card); toolbar stacks; drawer full-screen sheet; pagination collapses to Prev/Next.

**Design Tokens:**
Signal Green `#34D399`, Electric Blue `#38BDF8`, Alert Amber `#FBBF24`, Alert Red `#F87171`, Panel Slate `#111C33`, Hairline `#243249`, Ice White `#E2E8F0`, Steel Slate `#94A3B8`. JetBrains Mono for IDs, scores, dates.
