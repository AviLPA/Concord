# Concord (private live-dashboard preview)

This tree is the **private live dashboard preview** (Spacefast v12): https://concord-live-dashboard.space.fast/

Positioning is answer consistency for AI agents. The home H1 is “Your teams' AI agents are giving different answers to the same question.” The footer is “Let everyone build. Keep every answer consistent.” The hero animates that question into four branches — 35, 42, 17, and 28 — then resolves to Sara Klein’s official answer, 28. In the dashboard the old Conflicts label is **Inconsistencies** (the route is still `#/conflicts`). Overview is a denser layout: greeting, four KPIs, the top inconsistency, the consistency score beside recent activity, then inconsistencies by owner, shared jobs, and official answers.

Agents and inconsistencies are built from a recorded n8n scan in `src/latest-scan.json` (`src/liveModel.js`). Concord reads those executions; it does not re-run the workflows. Progress is kept in `localStorage` (key `concord-live-preview-v1`). **Restart demo** asks for the demo password, then clears that key. The hands-on flow and the use case share the store. If the at-risk job is already decided, the story says so and does not overwrite it.

The public marketing site is separate and is not this snapshot.

## Routes
| Route | What |
|---|---|
| `#/` (or no hash) | Home. Sticky nav: Home, How it works, Use case, Pricing, About, Open the demo, and **Try it with sample data**. The hero is the branch-and-resolve animation for “How many accounts are at risk?” |
| `#/how` | How it works: Find, Show, Decide, and Confirm. |
| `#/pricing` | Three tiers. The Consistency Audit is free. Team and Enterprise say Talk to us. Prices are placeholders. No checkout. |
| `#/about` | Why agents answering the same question should give the same answer. Northwind-style labels on the sample jobs are illustrative. |
| `#/start` | Hands-on setup: workspace → connect Claude and n8n, both read-only → scan → search → resolve. |
| `#/search/<query>` | Search across every agent. Synonym and fuzzy matching. Results show the definition Concord read and the answer already on record. |
| `#/resolve/<cid>` | Resolve as owner: pick a definition, write or combine your own, or mark a different job / valid variant. |
| `#/watch` | **Use case**, inside the marketing layout. Click Next through each step. Nothing plays on its own. Four answers are 35, 42, 17, and 28. Sara signs off 28. |
| `#/overview`, `#/agents`, `#/jobs`, `#/conflicts`, `#/conflicts/<cid>`, `#/blocks`, `#/integrations` | The app. The sidebar label for `#/conflicts` is Inconsistencies. Rows come from the live n8n scan. |
| `#/live` | Old route, redirects to `#/watch`. |

## Showcase site (`site/`)
A standalone, calm brand site for investors and users, served at `/site/` (dev: `http://localhost:5173/site/`, built to `dist/site/index.html`). It's separate from the app, with its own HTML, CSS and JS. Its CTAs link into the app at `../#/start` and `../#/watch`.

- Five sections: hero (an animated conflict card where 35 / 42 / 17 converge to the official 28), the security-vs-consistency statement, how it works (three auto-advancing tabs over real app screenshots), a "How does Concord know it's the same question?" section (it reads team, owner, purpose and the decision an answer feeds: the same question within one team with different answers is a conflict, while across teams, such as a Sales vs CS health score, it can be an intended difference that Concord labels), integrations, and a closing CTA.
- Brand: a light Mist `#F3F6F4` background, Deep slate `#14232B` text, Mint `#6EE7A8` pill CTAs, green `#1F7A55` for agreement and red `#B83A2C` only for conflict. Headlines are in Manrope, body text in Inter.
- Animation respects `prefers-reduced-motion`.
- `node site/capture.mjs` regenerates the product screenshots in `site/assets/product/` (needs `npm run preview`).

## Use case
A click-through story. The user clicks Next and Back, or a step in the stepper. Each step is a short headline and one sentence. Animations play once when a step opens. Nothing advances on its own. There is no play, pause, or speed control.

**Explore the full app** writes the story into the shared store, unless the workspace already decided that job.

## Run locally
    npm install
    npm run dev

## Build
    npm run build      # static output in dist/ (relative base; fonts are inlined)
    npm run preview    # serves dist/ on :4173

## Scripts
`test-onboarding.mjs`, `test-watch.mjs`, `shots.mjs`, `shots-onboarding.mjs`, `video.mjs`, and `video-onboarding.mjs` are the earlier Playwright helpers. They were left in place and were not rewritten for this preview. They still look for the old landing CTA (`#/watch` in the hero), Watch it live play/pause/speed controls, and an unauthenticated reset, so they will not pass against this source.

## Code
- `src/latest-scan.json`: recorded n8n executions used as the live preview dataset.
- `src/liveModel.js`: turns that scan into agents, jobs, inconsistencies, and draft official answers.
- `src/model.js`: consistency score and shared adoption rules over the live rows.
- `src/main.js`: app shell, routing, persistence, and the dashboard screens.
- `src/onboard.js`: home (including the branch hero), onboarding, search, and the resolve flow.
- `src/watch.js`: click-through use case.
- `src/style.css`, `src/tokens.css`: styles. Overview density is `.ovp` / `.dash3`; the hero branches are `.ltree`.
- `src/brand.js`, `src/lead.js`: mark, status chips, and the contact form.
