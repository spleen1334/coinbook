# Agent Guide

## Stack and commands

- Vite 6 + React 19 PWA, configured in `vite.config.js` with `vite-plugin-pwa`.
- Node 20.19+ is required by the Vite/React plugin toolchain.
- Install/dev: `npm install`, `npm run dev`.
- Build/preview: `npm run build`, `npm run preview`.
- GitHub Pages project-site build/deploy: `npm run build:pages`, `npm run deploy`.
- Quality automation uses npm scripts: `npm run lint`, `npm run lint:fix`, `npm run format`, `npm run format:check`, `npm run fix`, `npm run check`. Use `npm run fix` for routine automated repairs and `npm run check` as the complete non-mutating pre-handoff gate.
- Tests: Vitest, colocated `*.test.js` files; run with `npm test`.

## Delivery workflow

- Start every change from a new branch created from current `main`; do all work and review on that branch. Update the version and add the dated `CHANGELOG.md` entry there before approval.
- After approval, merge the branch into `main`, run `npm run check` on the merge commit, create an annotated release tag there, then push both `main` and the tag.
- Only then check out that tag from `main` and run `npm run deploy`. It builds the `/coinbook/` base path and publishes the result to GitHub Pages.
- Do not deploy directly from a feature branch or before approval, merge, tag, and push.

## Mobile-only product constraint

- Coin Book is designed exclusively for mobile phones and portrait PWA use. Desktop layouts are out of scope.
- When opened in a desktop browser, preserve the centered phone-sized shell rather than introducing desktop-specific layouts, navigation, interactions, or wide-screen optimizations.
- Treat touch targets, narrow phone widths, safe areas, the on-screen keyboard, and the Visual Viewport API behavior as primary UI constraints. Preserve the portrait manifest orientation and installed-PWA behavior.
- Validate UI changes at a 390×844 phone viewport and a narrower phone viewport; use desktop only to confirm the mobile frame remains centered.

## Project structure

- `src/App.jsx`: class component that owns app state, handlers, and screen orchestration.
- `src/components/`: mostly presentational components for ledger, chart, settings, add/edit sheet, icons, and coin animation; `AddSheet` also owns transient viewport/focus UI state.
- `src/selectors/`: pure derived view-model builders consumed by `App.jsx`.
- `src/data/`: static category definitions, translations, swatches, seed data.
- `src/persistence/`: IndexedDB-first state load/save helpers with localStorage fallback and migration.
- `src/importExport/`: JSON/CSV import-export and category merge helpers.
- `src/utils/`: pure helpers for dates, money formatting, CSV parsing/escaping, downloads, and coin styling.
- `src/App.css`: global styles, responsive layout, animations.
- `public/icons/`: PWA icons referenced by manifest/service worker.
- `docs/deployment.md`: GitHub Pages and PWA deployment notes.

## Important invariants

- Local persistence key is `coinbook_v1_state`.
- Persisted local state includes settings; JSON export includes only `{ categories, expenses }`.
- CSV columns are `date,category,amount,note`.
- Imported expenses are prepended to existing expenses; imported categories are merged by name.
- Category ids, currency/rate handling, language keys, and number-format settings are user data compatibility points.
- Categories carry a `favorite` boolean. JSON export/import preserves it; CSV does not (CSV has no favorite column, so categories created via CSV import are always non-favorite, and importing never clears an existing category's favorite flag).

## PWA and base-path caveats

- `vite.config.js` derives `base`, manifest `start_url`, and manifest `scope` from `VITE_BASE_PATH`.
- GitHub Pages project-site builds use `VITE_BASE_PATH=/coinbook/` via `npm run build:pages`.
- Root/custom-domain deploys should use the default `/` base.
- Avoid hard-coded root asset paths; use Vite/base-aware URLs where needed.
- Service workers can serve stale cached assets after deploy; verify with a hard refresh, unregistering the SW, or clearing site data if behavior looks outdated.

## Safe refactor guidance

- Do not change behavior while moving code. Preserve storage schema, import/export shapes, generated ids, date formats, and screen interactions.
- Continue splitting `App.jsx` only in small, mechanical steps with validation after each step.
- Keep helpers pure when moving within `src/utils/`; keep static copy/data in `src/data/`.
- Treat CSS class names as behavior-adjacent because animations and responsive states depend on them.

## Validation expectations

- For documentation-only changes, no build is required unless requested.
- For code changes, run relevant checks; `npm run check` is the broad validation command.
- Run `npm test` and confirm it passes before claiming a change is validated.
