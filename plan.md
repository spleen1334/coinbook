# Quality Improvements — Status

The quality-improvement pass tracked here is complete. For reference, what was done:

- `App.jsx` decomposed into `selectors/`, `hooks/`, and extracted render components (`Splash`, `AppHeader`, `AppFooter`, `DeleteModal`, `DeleteAllModal`, `SearchPopup`).
- `AddSheet` and `SettingsScreen` now take focused props/callbacks instead of the whole `app`/`s`/`v`.
- Import file-reading orchestration deduplicated (`readFileText` + `importFile` in `App.jsx`); currency conversion/rate parsing consolidated in `utils/format.js`.
- Persisted-state normalization validates individual expense/category records (`src/utils/validate.js`, `src/persistence/localState.js`), not just top-level snapshot fields; invalid/corrupt colors, dates, amounts, and ids are dropped or self-healed rather than trusted.
- Category colors are derived deterministically from name (`hashCatColor` in `utils/coin.js`) instead of array position, and self-heal on load for previously auto-colored or corrupted data.
- Manual category creation now rejects case-insensitive duplicates, matching import-merge behavior.
- `340px` minimum-width constraint removed; scrollbar affordances restored with a themed thin scrollbar instead of being globally hidden.
- Vitest test suite added (100 tests) covering persistence, imports/exports, dates, and validation. No CI — tests run locally via `npm test`.
- ESLint's `no-unused-vars` re-enabled for real (the actual cause of it being off was missing `react/jsx-uses-vars`, not the rule itself).
- `npm run verify:pwa` checks both base paths (root and `/coinbook/`) build correctly with no duplicate manifest/font tags and correctly-rooted asset paths.

## Intentionally not planned

- Accessibility work (keyboard navigation on `<div>`-based interactive elements, dialog semantics/focus management, chart data as an accessible table, touch target sizing) — deferred by request.
- GitHub Actions CI — deferred by request; `npm run check` is the local pre-deploy gate.
- Manual deployment with `npm run deploy` remains the intended deployment workflow.
