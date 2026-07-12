# Coin Book — Expense Ledger (React + PWA)

A ledger-styled expense tracker with multi-currency support, EN/SR/RU UI text, day/week/month/year views, a category donut chart, CSV/JSON import-export, and configurable number formatting. Data stays in the browser through `localStorage`.

The app is a Vite + React Progressive Web App using `vite-plugin-pwa`. It can be built as a static site and installed from HTTPS or localhost.

## Commands

Requires Node 20.19+.

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
npm run check
```

GitHub Pages project-site deployment:

```bash
npm run build:pages
npm run deploy
```

## Project structure

```text
coinbook-pwa/
  index.html          Vite entry HTML
  vite.config.js      Vite, React, PWA manifest/service worker config
  public/icons/       PWA icons
  src/
    main.jsx          React root
    App.jsx           Class app shell: state, persistence, handlers, derived view data
    components/       Stateless presentational screens and shared UI pieces
    App.css           Global styles and animations
    data/             Static categories, translations, seed entries
    persistence/      Local storage load/save helpers
    importExport/     JSON/CSV import-export and category merge helpers
    utils/            Shared helpers for dates, money, CSV, downloads, visuals
  docs/deployment.md  GitHub Pages and PWA deployment notes
```

The first component split is complete: `src/components/` contains stateless presentational screens and UI pieces. `src/App.jsx` still owns state transitions, derived view data, and screen orchestration; persistence and import/export normalization live in focused helper folders.

## Data and storage

- Runtime persistence uses `localStorage` key `coinbook_v1_state`.
- Stored state includes expenses, categories, language, currency, rates, number format, list grouping, and selected period.
- JSON export intentionally includes only `{ categories, expenses }`.
- CSV import/export columns are `date,category,amount,note`.

## Documentation

- [Deployment](docs/deployment.md)

## Notes

- Formatting uses Prettier: single quotes, semicolons, no trailing commas, 120-character print width.
- No automated tests currently exist. Use lint, format check, and production build as validation.
- GitHub Pages project builds require `VITE_BASE_PATH=/coinbook-pwa/`; see deployment docs for root/custom-domain notes.
