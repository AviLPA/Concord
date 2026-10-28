# Concord (demo)

Interactive proof-of-concept for an agent consistency layer. Employees build agents in Claude, n8n and more; Concord connects read-only, maps every agent, finds agents doing the same job that give different answers, and lets the owner publish one official definition that every agent calls over MCP.

Live demo: https://concord-demo.space.fast/

All data is fictional ("Northwind", 400 people). Everything runs client-side; there is no backend. Progress is kept in `localStorage` (key `concord-demo-v1`) and can be cleared with **Reset demo** (landing page footer, or the app sidebar).

## Routes
| Route | What |
|---|---|
| `#/` (or no hash) | Marketing landing page: hero with two equal CTAs (**Get started**, **▶ Watch it live**), the problem (35 / 42 / 17 / 28 from the demo company), how it works, integrations (Claude and n8n available, others "coming soon"), built for RevOps / Data / AI CoE. No logos, testimonials, pricing or real-world stats. |
| `#/start` | Hands-on onboarding (no autoplay): 1 Create workspace → 2 Connect Claude (org-admin consent, read-only scopes) and n8n (instance URL + API key, Test connection) → 3 Scan (streams in 47 agents, groups them into 14 jobs, surfaces 7 conflicts; Skip available) → 4 Search → 5 Resolve. A one-line guide bar always says what to do next. |
| `#/search/<query>` | Search across every agent (also from the app top bar). Synonym and fuzzy matching, so "customer health", "custmer helth", "how many accounts are at risk?" or "how much revenue do we have" all work. Results show every agent doing the job, with builder, definition/source and answer side by side; disagreements highlighted. |
| `#/resolve/<cid>` | Resolve as owner: compare definitions, pick or edit one, add a reason, publish as an official MCP block, notify builders / rewire and watch answers converge; adoption and consistency score update. |
| `#/watch` | **Watch it live**: guided 8-step simulation (unchanged; see below). Reachable from the landing hero, first item in the app sidebar, the top bar, onboarding header and the end of onboarding. |
| `#/overview`, `#/agents`, `#/jobs`, `#/conflicts`, `#/conflicts/<cid>`, `#/blocks`, `#/integrations` | The app. The Overview shows a setup checklist (Connect, Scan, Search, Resolve first conflict) until it is done, and reflects what you did (score 71 → 86 after resolving Customer health). |
| `#/live` | Old route, redirects to `#/watch`. |

## Showcase site (`site/`)
A standalone, animated brand and story site for investors and users, served at `/site/` (dev: `http://localhost:5173/site/`, built to `dist/site/index.html`). It's separate from the app: its own HTML, CSS and JS, with no shared code. Its CTAs link into the app at `../#/start` and `../#/watch`.

- Sections: hero (animated convergence of 35 / 42 / 17 / 28 → 28), problem, solution, a scroll-driven product walkthrough using real app screenshots, how it works, who it's for, why now / vision / roadmap, and a CTA.
- Brand: "concord" wordmark with a convergence mark (`site/assets/mark.svg`); Concord Violet `#7C6CFF`, Unison Mint `#3FE0A5` for agreement, Dissonance Coral `#FF6B5E` for conflict; Inter Tight, Instrument Serif italic accents, JetBrains Mono.
- Animation respects `prefers-reduced-motion`.
- `node site/capture.mjs` regenerates the product screenshots in `site/assets/product/` (needs `npm run preview`).

## Watch it live
A guided, autoplaying simulation in 8 steps:

1. Dana (Sales Ops) builds a "Q4 at-risk accounts" agent in Claude, in plain words → Concord detects the new agent.
2. She pastes her own at-risk definition and a personal spreadsheet → Concord reads instructions and sources, read-only.
3. Her agent answers "35 accounts" → Concord matches it to the Customer health job alongside Maya's and Priya's Claude agents and Tom's n8n workflow.
4. Concord asks all four the same question: 35 / 42 / 17 / 28 → conflict flagged.
5. The conflict is routed to the owner, Sara Klein, who picks the official definition.
6. Customer health v2 is published as an official block over MCP.
7. Dana's agent is rewired; asked again, it answers 28 (adoption 2/4).
8. Tom's n8n workflow and Maya's agent are rewired → all four agree, consistency 71 → 86.

Controls: play/pause (space), back/next (← →), restart, speed, clickable step markers. On phones the panels become tabs. The wrap-up card's **Explore the full app** opens the dashboard with the result applied.

## Run locally
    npm install
    npm run dev

## Build
    npm run build      # static output in dist/ (relative base, can be hosted anywhere)
    npm run preview    # serves dist/ on :4173

## Scripts (Playwright; need `npm run preview` running and `npx playwright install chromium`)
- `test-onboarding.mjs [baseUrl] [shotDir]`: end-to-end test at 1280×800 and 390×844: landing → Get started → connect both → scan → search (chip, free text, typo) → resolve → dashboard; persistence; landing → Watch it live → wrap-up → Explore; Reset. Fails on console errors, horizontal scroll or raw template text.
- `test-watch.mjs`: detailed test of the Watch it live mode (timing, controls, explore).
- `shots.mjs`, `shots-onboarding.mjs`: high-res screenshots to /workspace/concord-shots/.
- `video.mjs [desktop|phone]`: records the Watch it live walkthrough. `video-onboarding.mjs [desktop|phone]`: records the hands-on onboarding. Both use CDP screencast frames plus a fake cursor and captions, then ffmpeg.

## Code
- `src/main.js`: app shell, data, routing, persistence, and app screens (Overview, Agents, Jobs, Conflicts, Official blocks, Integrations).
- `src/onboard.js`: landing page, onboarding (workspace, connect modals, scan), search, resolve flow, setup checklist.
- `src/watch.js`: the Watch it live mode (step/beat timeline engine, chat and backend renderers).
- `src/style.css`: all styles.
