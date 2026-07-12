# Architecture

Coin Book is a static Vite + React PWA. `src/main.jsx` mounts the app, `vite.config.js` configures React and `vite-plugin-pwa`, and the generated service worker provides offline caching for built assets.

## App shell

- `src/App.jsx` is currently a single React class component.
- It renders the PWA shell, splash state, home ledger, graph view, settings view, add/edit flows, category picker, and import/export controls.
- Navigation is internal state (`screen`, period selection, offsets), not a router.

## State responsibilities

`App.jsx` owns user state and UI state, including:

- expenses and categories
- language, currency, exchange rates, number formatting, list grouping, selected period
- add/edit form fields, modal states, search state, hover/swipe/animation state, toast state
- persistence snapshots and timers/animation cleanup

## Data modules

- `src/data.js` contains static category definitions, color swatches, starter seed entries, month names, translated category names, and UI translations.
- Seed expenses are generated relative to the current date on first load.

## Utilities

`src/utils.js` contains small helpers for date formatting, default category colors, coin gradient styling, number/money formatting, short dates, file downloads, CSV escaping, fuzzy matching, and CSV parsing.

## CSS

`src/App.css` contains global app styles, layout, coin/ledger visual treatment, responsive behavior, hover/press states, and keyframe animations. CSS class names are tightly coupled to JSX markup.

## Persistence

State is persisted to `localStorage` under `coinbook_v1_state`. The saved object includes expenses, categories, language, currency, rates, number format, list grouping, and period. Corrupt or unavailable storage is ignored.

## Import/export

- JSON export downloads `{ categories, expenses }` only.
- JSON import merges categories and prepends imported expenses.
- CSV export uses `date,category,amount,note`.
- CSV import expects the same headers, creates missing categories by name, and prepends imported expenses.

## Screens

- Home: period summary, ledger list, search, add/edit expense interactions.
- Graph: category breakdown/donut chart for the active period.
- Settings: language, currency/rates, number format, list grouping, import/export, destructive reset.

## Known maintainability risks

- `App.jsx` mixes rendering, state transitions, persistence, data transformation, and UI effects.
- Large CSS and JSX coupling makes broad renames risky.
- Import/export and storage formats are implicit compatibility contracts.
- There is no automated test suite; rely on lint, formatting, builds, and manual smoke checks.
