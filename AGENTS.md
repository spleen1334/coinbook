# Agent Guide

## Stack and commands

- Vite 5 + React 18 PWA, configured in `vite.config.js` with `vite-plugin-pwa`.
- Install/dev: `npm install`, `npm run dev`.
- Build/preview: `npm run build`, `npm run preview`.
- GitHub Pages project build/deploy: `npm run build:pages`, `npm run deploy`.
- Quality: `npm run lint`, `npm run lint:fix`, `npm run format`, `npm run format:check`, `npm run check`.
- No automated tests currently exist.

## Project structure

- `src/App.jsx`: class component that owns app state, persistence, import/export, derived view data, and screen orchestration.
- `src/components/`: stateless presentational components for ledger, chart, settings, add/edit sheet, icons, and coin animation.
- `src/data.js`: static category definitions, translations, swatches, seed data.
- `src/utils.js`: pure helpers for dates, money formatting, CSV parsing/escaping, downloads, and coin styling.
- `src/App.css`: global styles, responsive layout, animations.
- `public/icons/`: PWA icons referenced by manifest/service worker.
- `docs/`: architecture, deployment, data format, and formatting notes.

## Important invariants

- Local persistence key is `coinbook_v1_state`.
- Persisted local state includes settings; JSON export includes only `{ categories, expenses }`.
- CSV columns are `date,category,amount,note`.
- Imported expenses are prepended to existing expenses; imported categories are merged by name.
- Category ids, currency/rate handling, language keys, and number-format settings are user data compatibility points.

## PWA and base-path caveats

- `vite.config.js` derives `base`, manifest `start_url`, and manifest `scope` from `VITE_BASE_PATH`.
- GitHub Pages project-site builds use `VITE_BASE_PATH=/coinbook-pwa/` via `npm run build:pages`.
- Root/custom-domain deploys should use the default `/` base.
- Avoid hard-coded root asset paths; use Vite/base-aware URLs where needed.
- Service workers can serve stale cached assets after deploy; verify with a hard refresh, unregistering the SW, or clearing site data if behavior looks outdated.

## Safe refactor guidance

- Do not change behavior while moving code. Preserve storage schema, import/export shapes, generated ids, date formats, and screen interactions.
- Continue splitting `App.jsx` only in small, mechanical steps with validation after each step.
- Keep helpers pure when moving to `utils.js`; keep static copy/data in `data.js`.
- Treat CSS class names as behavior-adjacent because animations and responsive states depend on them.

## Validation expectations

- For documentation-only changes, no build is required unless requested.
- For code changes, run relevant checks; `npm run check` is the broad validation command.
- Do not claim tests pass: this repo currently has no test suite.
