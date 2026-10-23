# Concord (demo)

Interactive proof-of-concept for an agent consistency layer. Concord maps every agent employees build (here, in Claude and n8n), finds agents doing the same job with conflicting definitions, rules or sources, and lets the owner publish one official version that every agent calls over MCP.

Live demo: https://concord-demo.space.fast/

All data is fictional ("Northwind", 400 people). Everything runs client-side; there is no backend.

## Watch it live (start here)
The landing page leads with **▶ Watch it live** (also in the sidebar and top bar, route `#/watch`). It is a guided, autoplaying simulation in 8 steps:

1. Dana (Sales Ops) builds a "Q4 at-risk accounts" agent in Claude, in plain words → Concord detects the new agent.
2. She pastes her own at-risk definition and a personal spreadsheet → Concord reads instructions and sources, read-only.
3. Her agent answers "35 accounts" → Concord matches it to the Customer health job alongside Maya's and Priya's Claude agents and Tom's n8n workflow.
4. Concord asks all four the same question: 35 / 42 / 17 / 28 → conflict flagged.
5. The conflict is routed to the owner, Sara Klein, who picks the official definition.
6. Customer health v2 is published as an official block over MCP.
7. Dana's agent is rewired; asked again, it answers 28 (adoption 2/4).
8. Tom's n8n workflow and Maya's agent are rewired → all four agree, consistency 71 → 86.

Left panel: a generic chat labelled "Built in Claude". Right panel: Concord's backend event log. A narration bar explains every step. Controls: play/pause (space), back/next (← →), restart, speed (1×, 1.5×, 2×, 0.75×), and clickable step markers. On phones the panels become tabs that follow the action. The wrap-up card's **Explore the full app** opens the dashboard with the result applied (Dana's agent in the inventory, conflict resolved, score 86).

## Run locally
    npm install
    npm run dev

## Build
    npm run build      # static output in dist/ (relative base, can be hosted anywhere)
    npm run preview    # serves dist/ on :4173

## Scripts (Playwright; need `npm run preview` running and `npx playwright install chromium`)
- `test-watch.mjs`: end-to-end test of the live mode at 1280×800 and 390×844 (full run, controls, explore).
- `shots.mjs`: high-res screenshots to /workspace/concord-shots/.
- `video.mjs [desktop|phone]`: records the walkthrough with a fake cursor and captions (CDP screencast frames, then ffmpeg).

## Code
- `src/main.js`: app shell, data, and screens (Overview, Agents, Jobs, Conflicts, Official blocks, Integrations).
- `src/watch.js`: the Watch it live mode (step/beat timeline engine, chat and backend renderers).
- `src/style.css`: all styles.
