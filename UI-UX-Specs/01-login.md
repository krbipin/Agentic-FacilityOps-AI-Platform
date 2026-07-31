# Login / Sign-in
- **Route:** /login
- **Page type:** auth (standalone — no app shell)
- **Primary agent:** — (entry point)
- **Data source:** FACILITIES (facility picker after auth)

## Vibe & Purpose
A focused, secure sign-in for the facility operations command center. Dark, precise, and technical — like the login gate of industrial control software. The page has one job: get an authorized operator in fast, with clear feedback and full accessibility. Split-screen layout on desktop (brand/telemetry panel + form), centered card on mobile.

**PLATFORM:** Web, Desktop-first (responsive to Mobile/Tab)

**PAGE STRUCTURE:**
1. **Left Brand Panel (desktop ≥1024px):**
   - Full-height Abyss Navy `#0B1120` panel with a subtle grid/graph motif.
   - Product mark: hexagonal "F" logo in Electric Blue `#38BDF8`, wordmark "FacilityOps AI" in Ice White, tagline "Autonomous AI Agents for Smart, Secure & Sustainable Facilities".
   - Product title: "Agentic FacilityOps AI Platform" (headline) + subtitle "AI-Powered Building Operations & Facility Intelligence System".
   - Live telemetry strip at the bottom: three mono readouts — Facility Health `94/100`, Active Alerts `4`, Current Load `1.28 MWh` — each with a status dot (green/amber/red).
   - Hidden/collapsed below 1024px.
2. **Right Auth Panel:**
   - Centered card (Panel Slate `#111C33`, 12px radius, hairline border `#243249`, soft glow shadow).
   - Heading "Sign in to FacilityOps AI" + subtext "Operator access only".
   - **Email field** (label above, `#0B1120` fill, focus ring Electric Blue), placeholder `you@company.com`.
   - **Password field** with show/hide toggle (mono bullets).
   - **"Remember me" checkbox** + **"Forgot password?"** link (Ice White, hover Electric Blue).
   - **Primary button** "Sign in" — full width, Electric Blue fill, dark navy text, 8px radius.
   - **SSO row:** "Continue with Microsoft" / "Continue with Google" secondary buttons with icons.
   - Divider "or", then a subtle **"Emergency contact"** link (steel slate).
   - Footer micro-text: "SOC 2 Type II · Audited access" + version `v2.4.0` in mono.
3. **Footer (mobile only):** brand mark + tagline centered.

**Components & Real Data:**
- KPI readouts (left panel): Facility Health `94/100` (green dot), Active Alerts `4` (amber dot), Current Load `1.28 MWh` (green dot). JetBrains Mono numerals.
- Input validation: email format check; "Please enter a valid work email" inline error in Alert Red `#F87171`.

**Interactions:**
- Sign-in submits → button shows spinner "Verifying…" → success routes to `/`.
- Invalid credentials → inline Alert Red banner "Invalid email or password" at top of card.
- Forgot password → navigates to a recovery flow (out of scope; placeholder link).
- Show/hide password toggles input type with an eye icon; aria-pressed state announced.

**States:**
- Loading: skeleton shimmer on the sign-in button only.
- Error: red banner + field-level red borders.
- Empty: fields disabled? No — normal with helper text.
- Offline: top banner "Connectivity lost — live telemetry paused".

**Responsive Behavior:**
- **1280px+:** two-panel split (45% brand / 55% auth), card centered in right panel.
- **768px:** brand panel hidden; full-width auth panel; card ~420px centered.
- **360px:** single column; card full-width minus 24px gutters; buttons stack (SSO row wraps to two full-width buttons); footer mark below.

**Design Tokens:**
Abyss Navy `#0B1120`, Panel Slate `#111C33`, Elevated Slate `#1E293B`, Hairline `#243249`, Ice White `#E2E8F0`, Steel Slate `#94A3B8`, Electric Blue `#38BDF8`, Alert Red `#F87171`, Alert Amber `#FBBF24`, Signal Green `#34D399`. Inter for UI, JetBrains Mono for numerals. 12px card radius, 8px controls.
