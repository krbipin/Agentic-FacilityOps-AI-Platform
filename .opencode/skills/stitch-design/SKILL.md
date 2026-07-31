---
name: stitch-design
description: Generate and edit UI screens with Google Stitch MCP. Use when generating pages from UI-UX-Specs/*.md, enhancing prompts for Stitch, creating/updating .stitch/DESIGN.md, or managing the Stitch project/design system.
---

# Stitch Design Workflow

Generate high-fidelity, consistent UI screens via the Stitch MCP server.

## 1. Design System First

- `.stitch/DESIGN.md` is the source of truth for look & feel.
- If the Stitch project does not yet have a design system, call `create_design_system` with the tokens from `.stitch/DESIGN.md` so every screen matches.
- Use `list_design_systems` / `list_projects` to find the active project + design system before generating.

## 2. Prompt Enhancement Pipeline

Before calling any Stitch generation tool, enhance the source prompt:

1. **Context:** read the relevant `UI-UX-Specs/*.md` page spec and the matching module data in `AGENTS.md` §7 (canonical milestone metrics).
2. **Vibe:** open with the page's purpose/mood in one paragraph (e.g. "Precise, observant, command-center facility operations").
3. **Platform:** declare `**PLATFORM:** Web, Desktop-first (responsive to Mobile/Tab)`.
4. **Structure:** use the numbered **PAGE STRUCTURE** template (Header → Sidebar/Nav → Primary Content Area → Footer), each block describing components, sample data, and interactions.
5. **Tokens:** reference roles from `.stitch/DESIGN.md` (Panel Slate, Electric Blue, Signal Green, mono numerics, 12px card radius) rather than raw hex in every prompt — the design system carries them.

## 3. Generate a Screen

Call `generate_screen_from_text` with:

```json
{
  "projectId": "<project-id>",
  "prompt": "<enhanced prompt from step 2>",
  "designSystem": "<design-system-id if found>",
  "deviceType": "DESKTOP"
}
```

Use `MOBILE` / `TABLET` only when a responsive variant is explicitly requested.

## 4. Refine

- Prefer `edit_screens` for targeted fixes over regenerating.
- Formulate edits with location + visual + structure, e.g. "In the Energy KPI row, make the Efficiency Score card's value Signal Green and add a ▼ 2% delta tag."

## 5. Download Assets

Save the returned `htmlCode.downloadUrl` and `screenshot.downloadUrl` into `.stitch/designs/<page-slug>.html` and `.png` (e.g. `energy-dashboard.html`). Ensure the directory exists first.

## 6. Prompt Format Reference

```markdown
[Overall vibe, mood, and purpose of the page]

**PLATFORM:** Web, Desktop-first (responsive to Mobile/Tab)

**PAGE STRUCTURE:**
1. **Header:** [navigation + branding + live status]
2. **Sidebar / Nav:** [collapsible icon nav]
3. **Primary Content Area:** [component-by-component breakdown with sample data]
4. **Footer:** [meta + system status]
```
