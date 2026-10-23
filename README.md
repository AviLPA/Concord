# Concord (demo)

Interactive proof-of-concept for an agent consistency layer: it maps every agent employees build (here, in Claude and n8n), detects agents doing the same job with conflicting definitions, rules, or sources, and lets the owner publish one official version.

Live demo: https://concord-demo.space.fast/

## Run locally
npm install
npm run dev

## Build
npm run build   # output in dist/

`shots.mjs` and `video.mjs` are Playwright scripts used to capture screenshots and the walkthrough video.
