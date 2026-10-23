# Concord (demo)

Interactive proof-of-concept for an agent consistency layer. Employees build agents in Claude and n8n. Agents doing the same job end up with different definitions. Concord connects read-only, compares those definitions and the answers already on record, and lets the owner publish one official definition. Builders adopt it themselves. Concord re-reads the project or the workflow to verify.

Live demo: https://concord-demo.space.fast/

All data is fictional (Northwind, 480 people). Everything runs client-side; there is no backend. Progress is kept in `localStorage` (key `concord-demo-v2`) and can be cleared with **Reset demo** (landing page footer, or the app sidebar). The hands-on flow and Watch it live share that store. If Customer health is already decided, the story says so and does not overwrite it.

## Routes
| Route | What |
|---|---|
| `#/` (or no hash) | Marketing landing page. The line under the hero is the product: security tools ask if an agent is safe; Concord asks if every agent gives the same answer. Two CTAs: **Request a consistency audit** and **Watch it live**. |
| `#/start` | Hands-on onboarding: workspace (default 301–1,000 people) → Connect Claude through the Compliance API and n8n through its REST API, both read-only → Scan (20 agents, 8 jobs, 6 conflicts; nothing is run) → Search → Resolve. |
| `#/search/<query>` | Search across every agent. Synonym and fuzzy matching, so "customer health", "custmer helth", "at risk accounts", or "how much revenue do we have" all work. Results show the definition Concord read and the answer already on record. |
| `#/resolve/<cid>` | Resolve as owner: pick a definition, write or combine your own, import a certified metric from dbt, Atlan, or Qontext, or mark a different job / valid variant. Publish a block, send suggested changes, and watch adoption over day 1, day 3, and day 6. Concord verifies by re-reading. |
| `#/watch` | **Watch it live**: guided story, about a minute. Same numbers as the model (35, 42, 17, 28, then 28; company score 53 → 68; this job 100). |
| `#/overview`, `#/agents`, `#/jobs`, `#/conflicts`, `#/conflicts/<cid>`, `#/blocks`, `#/integrations` | The app. Overview explains the consistency score. A fresh workspace is 53, with 6 open conflicts. After Customer health is adopted, the job is 100 and the company score is 68, with 5 conflicts still open. |
| `#/live` | Old route, redirects to `#/watch`. |

## Watch it live
A guided, autoplaying simulation in 8 steps. Concord never runs or edits an agent.

1. Read Claude through the Compliance API and n8n through its REST API. Dana’s Thursday chat already says 35. Concord cannot see a Claude project’s connectors.
2. Last week’s answers, side by side: 35, 42, 17, 28. Tom’s Monday run already posted to #cs-risk. Concord only read the log.
3. Definitions from instructions, a knowledge file, and workflow JSON. Dana’s source is a personal spreadsheet.
4. Same job, four definitions. Routed to Sara Klein, Head of RevOps.
5. Sara publishes Priya’s definition. She could have written her own or imported it. Suggested changes go to Dana, Maya, and Tom. Nothing is edited.
6. Dana starts to rebuild her agent. The org-wide MCP connector offers Customer health v2 before the spreadsheet.
7. Day 1: Concord re-reads Dana’s instructions and verifies her. Maya and Tom still have the suggestion.
8. Tom opens n8n and applies the suggestion himself. The AI step calls the block. The Slack post is untouched. Maya applied hers on day 3. Day 6, Concord re-reads Tom’s workflow. The job is 100. Company score 53 → 68.

Controls: play/pause (space), back/next (← →), restart, speed, clickable step markers. On phones the panels become tabs. **Explore the full app** writes the story into the shared store, unless the workspace already decided Customer health.

## Run locally
    npm install
    npm run dev

## Build
    npm run build      # static output in dist/ (relative base, can be hosted anywhere)
    npm run preview    # serves dist/ on :4173

## Scripts (Playwright; need `npm run preview` running and `npx playwright install chromium`)
- `test-onboarding.mjs [baseUrl] [shotDir]`: landing through resolve, dashboard, Watch it live, and reset, at 1280×800 and 390×844. Exits non-zero on failure.
- `test-watch.mjs [baseUrl]`: Watch it live timing, controls, explore, and the adoption timeline. Exits non-zero on failure.
- `shots.mjs`, `shots-onboarding.mjs`: high-res screenshots to /workspace/concord-shots/.
- `video.mjs [desktop|phone]` and `video-onboarding.mjs [desktop|phone]`: CDP screencast recordings.

## Code
- `src/model.js`: Northwind agents, jobs, conflicts, the consistency score, and the shared adoption rules.
- `src/main.js`: app shell, routing, persistence, and the dashboard screens.
- `src/onboard.js`: landing page, onboarding, search, and the resolve flow.
- `src/watch.js`: Watch it live.
- `src/style.css`: all styles.
