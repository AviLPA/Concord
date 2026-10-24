# Concord (demo)

Interactive proof-of-concept for an agent consistency layer. Employees build agents in Claude and n8n. Agents doing the same job end up with different definitions. Concord connects read-only, compares those definitions and the answers already on record, and lets the owner publish one official definition. Builders adopt it themselves. Concord re-reads the project or the workflow to verify.

Live demo: https://concord-demo.space.fast/

All data is fictional (Northwind, 480 people). Everything runs client-side; there is no backend. Progress is kept in `localStorage` (key `concord-demo-v2`) and can be cleared with **Reset demo** in the app sidebar. The hands-on flow and the walkthrough share that store. If Customer health is already decided, the story says so and does not overwrite it.

## Routes
| Route | What |
|---|---|
| `#/` (or no hash) | Marketing home. Sticky nav: Home, How it works, Walkthrough, Pricing, About, Open the demo, and **Try it with sample data**. The hero is the drift-then-snap chart (35, 42, 17, then 28) for “How many accounts are at risk this quarter?” Below it: the problem, from conflict to one official answer, the product illustration, and who it is built for. |
| `#/how` | How it works: Read, Detect, Decide, and Verify adoption. The $10k intentional-difference example lives here. |
| `#/pricing` | Three tiers. The Consistency Audit is free. Team and Enterprise say Contact us. The semantic layer is marked coming next. Prices are placeholders. No checkout. |
| `#/about` | Agents answering the same question should give the same answer. Why now, and three principles: read-only, owners decide, builders stay in charge. Northwind is fictional. |
| `#/start` | Hands-on onboarding: workspace (default 301–1,000 people) → Connect Claude through the Compliance API and n8n through its REST API, both read-only → Scan (20 agents, 8 jobs, 6 conflicts; nothing is run) → Search → Resolve. |
| `#/search/<query>` | Search across every agent. Synonym and fuzzy matching, so "customer health", "custmer helth", "at risk accounts", or "how much revenue do we have" all work. Results show the definition Concord read and the answer already on record. |
| `#/resolve/<cid>` | Resolve as owner: pick a definition, write or combine your own, import a certified metric from dbt, Atlan, or Qontext, or mark a different job / valid variant. Publish a block, send suggested changes, and watch adoption over day 1, day 3, and day 6. Concord verifies by re-reading. |
| `#/watch` | **Walkthrough**, inside the marketing layout. Click Next through each step. Nothing plays on its own. Dana gets 35. The nightly scan alerts Sara. Four answers are 35, 42, 17, and 28. Sara signs off 28. Daily scans end with all 4 agents agreeing on 28. |
| `#/overview`, `#/agents`, `#/jobs`, `#/conflicts`, `#/conflicts/<cid>`, `#/blocks`, `#/integrations` | The app. Overview explains the consistency score. A fresh workspace is 53, with 6 open conflicts. After Customer health is adopted, the job is 100 and the company score is 68, with 5 conflicts still open. |
| `#/live` | Old route, redirects to `#/watch`. |

## Walkthrough
A click-through story in six steps. The user clicks Next and Back, or a step in the stepper. Each step is a short headline and one sentence. Animations play once when a step opens. Nothing advances on its own. There is no play, pause, or speed control. The right panel is what Concord sees. On a phone that panel shows first, with a tab for the agent view. Scans run daily.

1. **Dana builds.** She asks the question and gets 35. The chat box is on screen only here.
2. **Night scan.** The scan finds Dana's agent on Customer health and shows the same 35.
3. **Four answers.** Dana's 35 sits with 42, 17, and 28. Renewal radar (RevOps · Claude, warehouse score) is 28. The left panel keeps Dana's chat, faded, with the note that her agent is one of four.
4. **Sara's alert.** Sara Klein gets the four answers: 35, 42, 17, and 28.
5. **Sara decides.** She signs off 28 as the official answer. Notes go to each builder.
6. **Daily scans.** Day 1 Dana updates. Day 3 Tom updates. Day 5 the Account health monitor still says 42. The CS team lead updates it. All 4 agents agree: 28.

Controls: Next, Back, and clickable step markers. Back is disabled on the first step. **Explore the full app** writes the story into the shared store, unless the workspace already decided Customer health. The hands-on app keeps its sidebar and shares the site header, with **Back to site**.

## Run locally
    npm install
    npm run dev

## Build
    npm run build      # static output in dist/ (relative base, can be hosted anywhere)
    npm run preview    # serves dist/ on :4173

## Scripts (Playwright; need `npm run preview` running and `npx playwright install chromium`)
- `test-onboarding.mjs [baseUrl] [shotDir]`: landing through resolve, dashboard, the walkthrough, and reset, at 1280×800 and 390×844. Exits non-zero on failure.
- `test-watch.mjs [baseUrl]`: walkthrough click-through, controls, explore, and the adoption timeline, at 1280×800, 390×844, and 360×740. Exits non-zero on failure.
- `shots.mjs`, `shots-onboarding.mjs`: high-res screenshots to /workspace/concord-shots/.
- `video.mjs [desktop|phone]` and `video-onboarding.mjs [desktop|phone]`: CDP screencast recordings.

## Code
- `src/model.js`: Northwind agents, jobs, conflicts, the consistency score, and the shared adoption rules.
- `src/main.js`: app shell, routing, persistence, and the dashboard screens.
- `src/onboard.js`: landing page, onboarding, search, and the resolve flow.
- `src/watch.js`: click-through walkthrough.
- `src/style.css`: all styles.
