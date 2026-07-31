# Occupancy Dashboard
- **Route:** /occupancy
- **Page type:** dashboard (app shell)
- **Primary agent:** Occupancy Agent
- **Data source:** OCCUPANCY_RECORDS, FACILITIES, ALERTS

## Vibe & Purpose
Space intelligence: who's where, how full, and how to use space better. The Occupancy Agent turns sensor counts into utilization insight, heatmaps, and capacity forecasts. Supports workspace managers optimizing desks, meeting rooms, and common areas.

**PLATFORM:** Web, Desktop-first (responsive to Mobile/Tab)

**PAGE STRUCTURE:**
1. **Topbar:** facility selector, live clock, alert bell `4`, theme toggle, user menu.
2. **Sidebar:** Overview, Energy, Maintenance, Occupancy (active), Security, Cost, Intelligence, Alerts, Reports, Assets, Work Orders, Copilot, Settings.
3. **Primary Content Area:**
   - **Page header:** "Occupancy Intelligence" + subtitle "Monitored by the Occupancy Agent" + zone filter (All / Office Floors / Meeting Rooms / Common Areas / Parking) + date range + "LIVE" tag.
   - **KPI row (4 cards):**
     - Occupancy Rate `73%` (▲ 5% vs yesterday — amber near comfort ceiling)
     - Active Visitors `342` (▲ 18)
     - Seats Utilized `1,640 / 2,250` (72%)
     - Crowding Alerts `2` (amber)
   - **Building heatmap (left, 60%):** stylized floor plan of the facility with per-zone occupancy density overlay. Zones colored by utilization (green <60%, blue 60–75%, amber 75–90%, red >90%). Zone labels + count chips (e.g. "Open Plan A · 128/150"). Hover zone → tooltip with count, trend, forecast.
   - **Zone occupancy bars (right, 40%):** horizontal bars for Office Floors `82%`, Meeting Rooms `65%`, Common Areas `48%`, Parking `37%` — color-mapped, mono labels.
   - **Capacity forecast chart:** next 7 days projected occupancy (line) with 80% forecasting-accuracy band and peak markers (e.g. "Tue peak 11:00–14:00").
   - **Meeting room utilization table:** Room | Capacity | Avg. utilization | Bookings today | Status. 5 rows (e.g. "Boardroom B · 12 · 71% · 6 · Available").
   - **Space optimization recommendations (Occupancy Agent):**
     - "Consolidate floors 4–5 to floor 3 — free 22% space, save $4.5k/mo" (Apply)
     - "Convert 3 underused desks to focus pods" 
     - "Pre-release Boardroom B if unbooked by 10:00"
4. **Footer:** System status + last sync.

**Components & Real Data:**
- Heatmap with per-zone occupancy counts and status colors.
- Bars: Office 82, Meeting 65, Common 48, Parking 37 (%).
- Forecast line with 80% band + peak markers.
- Recommendations with impact chips.

**Interactions:**
- Zone filter drives heatmap + bars + forecast.
- Heatmap zone hover → tooltip; click → filters table + zoom.
- Forecast peak marker click → shows "Peak: Tue 11:00–14:00 · 88% capacity".
- Recommendation Apply → modal → toast.
- Table search + sort.

**States:**
- Loading skeletons; Empty: "No occupancy data for this zone"; Error banner; Live pulsing dot.
- Off-hours: heatmap dims with "Unoccupied hours" banner.

**Responsive Behavior:**
- **1280px+:** 4 KPIs; heatmap (60%) + bars (40%); forecast full-width; table + recommendations 2-col.
- **768px:** 2×2 KPIs; heatmap stacks; bars as 2-col grid; table full-width.
- **360px:** KPIs 1-col; heatmap renders simplified (top zones only); bars stack; table horizontal-scroll.

**Design Tokens:**
Signal Green `#34D399` (low util), Electric Blue `#38BDF8` (medium), Alert Amber `#FBBF24` (high/crowding), Alert Red `#F87171` (>90%), Panel Slate `#111C33`, Hairline `#243249`, Ice White `#E2E8F0`, Steel Slate `#94A3B8`. JetBrains Mono counts.
