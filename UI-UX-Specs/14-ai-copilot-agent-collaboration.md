# AI Copilot / Agent Collaboration
- **Route:** /copilot
- **Page type:** assistant/chat (app shell)
- **Primary agent:** Facility Intelligence Engine (orchestrates) + all 5 agents
- **Data source:** ALL tables (agents answer from live + historical data)

## Vibe & Purpose
Conversational control surface over the whole platform. Operators ask questions in plain language and the Copilot dispatches to the right agents — showing *which* agents collaborated and *what* they found, with source-cited answers. Think "chat with your building" plus transparency on the agent reasoning.

**PLATFORM:** Web, Desktop-first (responsive to Mobile/Tab)

**PAGE STRUCTURE:**
1. **Topbar:** facility selector, live clock, alert bell `4`, theme toggle, user menu.
2. **Sidebar:** Overview, Energy, Maintenance, Occupancy, Security, Cost, Intelligence, Alerts, Reports, Assets, Work Orders, Copilot (active), Settings.
3. **Primary Content Area:** (chat + agent activity rail)
   - **Chat header:** "Facility Copilot" + subtitle "5 agents standing by · Facility Intelligence Engine orchestrating" + "New conversation" button.
   - **Suggested prompts (when empty):** 4 chips — "Summarize today's energy anomalies", "Which assets are at risk this week?", "How can I cut costs next quarter?", "Show me occupancy for the last 7 days".
   - **Message thread:**
     - User message (right-aligned, Electric Blue accent bubble).
     - **Copilot reply (left):** 
       - Natural-language answer with inline mono figures (e.g. "Energy wastage is down **4%**; AHU-4 accounted for **$212/mo** of avoidable spend.")
       - Optional rendered mini-widget (small chart/table) inline.
        - **Agent collaboration strip:** chips showing which agents contributed — Energy Agent `✓ consulted`, Maintenance Agent `✓ consulted`, Cost Optimization Agent `✓ consulted`, with per-agent confidence. Expandable "Show reasoning" reveals the agents' internal notes and data citations (e.g. "Energy Agent: detected AHU-4 draw 18% above baseline at 14:32 (ENERGY_USAGE, Corporate HQ & IT Park)").
        - Action buttons: "Create work order", "Apply recommendation", "Go to Energy dashboard".
      - Sample exchange:
        - User: "What's driving my energy bill this month?"
        - Copilot: "HVAC is 45% of consumption. AHU-4 ran 14h during unoccupied windows, adding ~$212/mo. Recommended: schedule off-hours stop (apply?)." → chips: Energy Agent ✓, Maintenance Agent ✓, Cost Agent ✓ · reasoning expandable.
   - **Composer (bottom):** textarea (auto-grow), attach/context button, microphone (optional), Send button; hint text "Ask about energy, assets, occupancy, security, or costs". Typing indicator + agent "working on it" pulse while streaming.
   - **Agent activity rail (right, desktop):** live list — "Energy Agent → querying ENERGY_USAGE…", "Maintenance Agent → scoring 12 assets…", "Security Agent → verified perimeter logs ✓", "Cost Optimization Agent → estimating avoidable spend…", completed ticks; collapsed behind a tab on mobile.
4. **Footer:** "Answers cite live data · Agents act only on your approval".

**Components & Real Data:**
- Chat bubbles with mono figures.
- Inline mini-widgets (sparkline/donut/table).
- Agent collaboration chips + expandable reasoning with citations.
- Action buttons on replies.
- Agent activity rail with live status.
- Suggested prompt chips.

**Interactions:**
- Send → optimistic user bubble → streaming copilot reply → agent chips populate as each finishes.
- "Show reasoning" expands agent notes + data citations with `file/table:row` style refs.
- Action buttons trigger the same modals/toasts as the dashboards.
- Suggested chip click → prefills composer.
- New conversation resets thread + activity rail.
- Context attach (e.g. "with asset AHU-4") scopes the conversation.

**States:**
- Loading: typing indicator + activity rail animating; Streaming: partial text with caret; Empty: suggestions shown; Error: red retry banner; Offline: "Agents offline — replies limited to local cache".
- Reasoning unavailable: "No reasoning trace for cached answer".

**Responsive Behavior:**
- **1280px+:** chat (flexible) + activity rail (280px) side-by-side; composer full-width.
- **768px:** activity rail collapses into a horizontal top strip; chat full-width.
- **360px:** single column; suggestions wrap; agent chips wrap to 2-per-line; action buttons stack full-width; composer remains fixed above keyboard with safe-area padding.

**Design Tokens:**
Electric Blue `#38BDF8` user/actions, Violet Insight `#A78BFA` intelligence/reasoning, Signal Green `#34D399` agent-success ticks, Alert Amber `#FBBF24` agent-caution, Panel Slate `#111C33` bubbles, Hairline `#243249`, Ice White `#E2E8F0`, Steel Slate `#94A3B8`. JetBrains Mono for all inline figures + citations.
