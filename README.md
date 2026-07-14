# Coin Book — Expense Ledger (React + PWA)

A ledger-styled expense tracker with multi-currency support, EN/SR/RU UI text, day/week/month/year views, a category donut chart, CSV/JSON import-export, and configurable number formatting. Data stays in the browser (IndexedDB, with a `localStorage` fallback/migration path).

The app is a Vite + React Progressive Web App using `vite-plugin-pwa`. It can be built as a static site and installed from HTTPS or localhost.

## Commands

Requires Node 20.19+ (developed against 26.1.0 — see `.nvmrc`, run `nvm use` to match).

```bash
npm install
npm run dev
npm run build
npm run preview
```

Quality/formatting commands:

```bash
npm run lint
npm run lint:fix
npm run format
npm run format:check
npm run test          # Vitest, run once
npm run test:watch    # Vitest, watch mode
npm run verify:pwa    # builds root + /coinbook/ base paths, checks PWA artifacts
npm run check         # format:check + lint + test + verify:pwa — the full local gate
```

GitHub Pages project-site deployment:

```bash
npm run build:pages
npm run deploy
```

## Project structure

```text
coinbook-pwa/
  index.html            Vite entry HTML
  vite.config.js         Vite, React, PWA manifest/service worker config
  vitest.config.js        Vitest config (src/**/*.test.js)
  scripts/
    verify-pwa-build.mjs  Builds both base paths, checks manifest/SW/icons/asset paths
  public/icons/          PWA icons
  src/
    main.jsx             React root
    App.jsx               Class app shell: state, persistence hookup, event handlers, screen orchestration
    selectors/             Derived view-model builder (getViewData.js) — pure functions consumed by App.jsx
    hooks/                 Small stateful helpers used by App.jsx (e.g. the total-counter animator)
    components/            Stateless presentational screens and shared UI pieces, each with focused props
    App.css                Global styles and animations
    data/                  Static categories, translations, seed entries
    persistence/            IndexedDB/localStorage load/save + validation of stored records
    importExport/           JSON/CSV import-export and category merge helpers
    utils/                  Shared helpers: dates, money, CSV, downloads, category colors, input validation
    **/*.test.js             Vitest unit tests, co-located with the modules they cover
  docs/deployment.md      GitHub Pages and PWA deployment notes
```

`App.jsx` is a thin orchestrator: state, lifecycle, and event handlers live there, but derived view data lives in `selectors/getViewData.js` and every screen/modal is its own component taking explicit props — none of them receive the whole `App` instance or its raw state/view-model.

## Data and storage

- Runtime persistence tries IndexedDB first (`coinbook_v1_state` store), falling back to `localStorage` (same key) if IndexedDB is unavailable or fails, with a one-time migration from `localStorage` into IndexedDB.
- Stored state includes expenses, categories, language, currency, rates, number format, list grouping, sort directions, and selected period.
- Every persisted expense/category record is validated on load (`src/utils/validate.js` + `src/persistence/localState.js`): invalid dates, non-positive amounts, and unrecognized colors are dropped or self-healed rather than trusted as-is.
- Category colors are derived deterministically from the category name (`hashCatColor` in `src/utils/coin.js`), not from array position — the same name always produces the same color, and previously auto-colored or corrupted colors self-heal on the next load.
- JSON export intentionally includes only `{ categories, expenses }`.
- CSV import/export columns are `date,category,amount,note`.

## Testing

`npm test` runs the Vitest suite (100 tests as of this writing) covering:

- Input validation (`utils/validate.js`): dates, amounts, notes, colors, ids
- Period/date range and label math (`utils/period.js`, `utils/date.js`)
- CSV parsing and formula-injection escaping (`utils/csv.js`)
- Category merge/dedup, including prototype-pollution and unsafe-id handling (`importExport/categoryMerge.js`)
- Full CSV/JSON import/export round-trips (`importExport/csv.js`, `importExport/json.js`)
- Persisted-state normalization, including the IndexedDB→localStorage fallback path (`persistence/localState.js`)

There is no CI — `npm run check` (or just `npm test`) is the local gate before deploying. `npm run verify:pwa` additionally builds the app for both the root and `/coinbook/` base paths and checks the PWA artifacts (manifest, service worker, icons, no duplicate manifest/font tags, correctly-rooted asset paths).

## Documentation

- [Deployment](docs/deployment.md)
- [Remaining quality-improvement status](plan.md)
- [Open feature work](TODO.md)

## Notes

- Formatting uses Prettier: single quotes, semicolons, no trailing commas, 120-character print width.
- Accessibility (keyboard navigation, dialog semantics, accessible chart alternatives) is a known gap, intentionally deferred — see `plan.md`.
- GitHub Pages project builds require `VITE_BASE_PATH=/coinbook/`; see deployment docs for root/custom-domain notes.
