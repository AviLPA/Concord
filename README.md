# Concord (demo)

Interactive proof-of-concept for an agent consistency layer. Employees build agents in Claude and n8n. Agents doing the same job end up with different definitions. Concord connects read-only, compares those definitions and the answers already on record, and lets the owner publish one official definition. Builders adopt it themselves. Concord re-reads the project or the workflow to verify.

Live demo: https://concord-demo.space.fast/

All data is fictional (Northwind, 480 people). Everything runs client-side; there is no backend. Progress is kept in `localStorage` (key `concord-demo-v2`) and can be cleared with **Reset demo** (landing page footer, or the app sidebar). The hands-on flow and the walkthrough share that store. If Customer health is already decided, the story says so and does not overwrite it.

## Routes
| Route | What |
|---|---|
| `#/` (or no hash) | Marketing home. Sticky nav: Home, How it works, Walkthrough, Pricing, About, Sign in, and **Request a consistency audit**. The line under the hero is the product: security tools ask if an agent is safe; Concord asks if every agent gives the same answer. |
| `#/how` | How it works, in plain language: read, detect, decide, verify adoption. |
| `#/pricing` | Three tiers. The Consistency Audit is free. Team and Enterprise say Contact us. Prices are placeholders. No checkout. |
| `#/about` | Mission, why now, and three principles: read-only, owners decide, publish into the tools you already use. Northwind is fictional. |
| `#/start` | Hands-on onboarding: workspace (default 301–1,000 people) → Connect Claude through the Compliance API and n8n through its REST API, both read-only → Scan (20 agents, 8 jobs, 6 conflicts; nothing is run) → Search → Resolve. |
| `#/search/<query>` | Search across every agent. Synonym and fuzzy matching, so "customer health", "custmer helth", "at risk accounts", or "how much revenue do we have" all work. Results show the definition Concord read and the answer already on record. |
| `#/resolve/<cid>` | Resolve as owner: pick a definition, write or combine your own, import a certified metric from dbt, Atlan, or Qontext, or mark a different job / valid variant. Publish a block, send suggested changes, and watch adoption over day 1, day 3, and day 6. Concord verifies by re-reading. |
| `#/watch` | **Walkthrough**, inside the marketing layout. Click Next through each step. Nothing plays on its own. Dana uses an agent, that night's scan shows the same 35, other people's agents answer 42, 17, and 28, Sara alerts, and later daily scans check. |
| `#/overview`, `#/agents`, `#/jobs`, `#/conflicts`, `#/conflicts/<cid>`, `#/blocks`, `#/integrations` | The app. Overview explains the consistency score. A fresh workspace is 53, with 6 open conflicts. After Customer health is adopted, the job is 100 and the company score is 68, with 5 conflicts still open. |
| `#/live` | Old route, redirects to `#/watch`. |

## Walkthrough
A click-through story in three acts and six steps. The user clicks Next and Back, or a step in the stepper. Animations play once when a step opens. Nothing advances on its own. There is no play, pause, or speed control. Concord never runs or edits an agent, and it does not sit in the chat. The right panel is always what Concord sees. Scans are daily by default, and can be set to run more often.

1. **Dana builds.** She asks how many accounts are at risk in her Claude project and gets 35. Concord does not interrupt. The chat box is on screen only here.
2. **Night scan.** Concord finds the new agent, matches Customer health, and shows the same question and the same line: Dana's agent answered 35.
3. **Four answers.** Dana's 35 is marked as the one just seen. Three other agents answer the same question: the CS team lead's Account health monitor (42), Tom's n8n workflow (17), and the RevOps warehouse score (28). Each card names the owner, team, and tool, plus a short definition.
4. **Sara's alert.** A notification to Sara Klein: Customer health, 4 agents, 4 different answers.
5. **Sara decides.** In Concord she marks 28, the warehouse score. Concord sends each builder a note. It does not change anyone's agent.
6. **Daily scans.** Day 1 Dana updates. Day 3 Tom edits his n8n workflow himself. Day 5 the Account health monitor still says 42, so Concord alerts again. The CS team lead updates it after that and matches last. Daily monitoring keeps running.

Controls: Next, Back, and clickable step markers. On phones the panels become tabs. **Explore the full app** writes the story into the shared store, unless the workspace already decided Customer health. The hands-on app keeps its sidebar and shares the site header, with **Back to site**.

## Run locally
    npm install
    npm run dev

## Build
    npm run build      # static output in dist/ (relative base, can be hosted anywhere)
    npm run preview    # serves dist/ on :4173

## Scripts (Playwright; need `npm run preview` running and `npx playwright install chromium`)
- `test-onboarding.mjs [baseUrl] [shotDir]`: landing through resolve, dashboard, the walkthrough, and reset, at 1280×800 and 390×844. Exits non-zero on failure.
- `test-watch.mjs [baseUrl]`: walkthrough click-through, controls, explore, and the adoption timeline. Exits non-zero on failure.
- `shots.mjs`, `shots-onboarding.mjs`: high-res screenshots to /workspace/concord-shots/.
- `video.mjs [desktop|phone]` and `video-onboarding.mjs [desktop|phone]`: CDP screencast recordings.

## Code
- `src/model.js`: Northwind agents, jobs, conflicts, the consistency score, and the shared adoption rules.
- `src/main.js`: app shell, routing, persistence, and the dashboard screens.
- `src/onboard.js`: landing page, onboarding, search, and the resolve flow.
- `src/watch.js`: click-through walkthrough.
- `src/style.css`: all styles.
