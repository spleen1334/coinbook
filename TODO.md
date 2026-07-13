# Todo

## 1. Move persisted app data from localStorage to IndexedDB

Status: Implemented initial IndexedDB snapshot persistence with async hydration, localStorage fallback, and safe one-time localStorage migration. Manual validation checklist below remains useful for follow-up verification.

Current app state is stored under the `coinbook_v1_state` localStorage key. As data grows, migrate durable app data to IndexedDB while preserving existing user data.

### Implementation plan

1. Audit current persistence
   - Review `src/persistence/` and every caller of load/save helpers.
   - Confirm the persisted shape for settings, categories, and expenses.
   - Keep JSON export unchanged: `{ categories, expenses }`.

2. Choose an IndexedDB wrapper strategy
   - Prefer a small internal wrapper around native IndexedDB unless a dependency is clearly worth it.
   - Define database name, version, object stores, indexes, and upgrade path.
   - Preserve compatibility points: category ids, currency/rate settings, language keys, number-format settings, expense date format, and generated ids.

3. Build the IndexedDB persistence layer
   - Add async load/save helpers for settings, categories, and expenses.
   - Handle database initialization, upgrades, errors, and unavailable IndexedDB fallback behavior.
   - Keep pure data transforms separate from browser storage APIs.

4. Add one-time migration from localStorage
   - On first IndexedDB load, read `coinbook_v1_state` from localStorage.
   - Validate and normalize the existing state before writing it to IndexedDB.
   - Mark migration complete only after a successful IndexedDB write.
   - Do not delete the localStorage backup until the migration path is proven safe.

5. Update app initialization and saving
   - Convert app bootstrapping to handle async persistence.
   - Ensure saves are debounced or batched if needed to avoid excessive writes.
   - Keep screen interactions and import/export behavior unchanged.

6. Validate
   - Run `npm run check`.
   - Manually verify first load with existing localStorage data, fresh install with no data, data edits, reload persistence, JSON export/import, CSV import/export, and PWA behavior after refresh.

## 2. Add Monify import support

Add an importer for data exported from the Monify app. Sample inspected: `samples/private/monefy/Monefy.Data.13-07-2026.csv`.

### Sample findings

- Format: one simple CSV table, 4,441 data rows plus one header row.
- Header: `date,account,category,amount,currency,converted amount,currency,description`.
- The header contains two `currency` columns:
  - Column 5 is the original transaction currency.
  - Column 7 is the converted-amount currency.
- Dates use `DD/MM/YYYY`, with sample range `12/08/2019` through `11/07/2026`.
- Amounts use comma thousands separators, often quoted, for example `"-16,000"`.
- 4,427 rows are negative expense rows; 14 rows are positive balance/savings/deposit/correction rows.
- Accounts found: `Keš` and `Štednja`.
- Original currencies found: mostly `RSD`, plus `EUR` rows on the savings account.
- Converted currency is always `RSD` in the sample, but converted EUR amounts appear numerically equal to EUR amounts, so do not blindly trust converted amount without confirming Monefy export semantics.
- Categories found: 49 unique names. Common ones include `Food`, `Taxi`, `Entertainment`, `Eating out`, `Gifts`, `Health`, `Sports`, `Bills`, `Gmz`, `Motori`, `Job`, `House`, `Medicine`, `Digital`, and `Education`.
- Several Monefy category names need either direct import as custom categories or optional mapping to existing Coinbook categories, for example `Communications` → `Communication`, `Gmz` → `Games`, `Kultura` → `Culture`, `Čajevi` → `Tea`, `Motori` → `Motorcycles`, `Gorivo` → `Fuel`, `Streljana` → `Shooting range`, `Porodica` → `Family`, `Hobi` → `Hobbies`, `Food Junk` → `Junk` or custom `Food Junk`.
- Coinbook's current generic CSV importer is not enough because it expects `date,category,amount,note`, uses ISO-like dates as-is, and `parseFloat("-16,000")` would incorrectly parse `-16` instead of `-16000`.

### Implementation plan

1. Collect and inspect sample export
   - Done for `samples/private/monefy/Monefy.Data.13-07-2026.csv`.
   - Confirm desired treatment for positive rows and EUR savings-account rows before implementation.

2. Map Monify data to Coinbook data
   - Map Monefy negative rows to Coinbook expenses.
   - Convert date from `DD/MM/YYYY` to Coinbook's existing date format.
   - Parse amount by removing comma thousands separators, then store the absolute expense amount if Coinbook expects positive expense amounts.
   - Map `description` to Coinbook `note`.
   - Ignore `account` initially, or append it to the note only if the user wants account provenance preserved.
   - Prefer original `amount`/currency for same-currency rows; clarify whether EUR savings rows should be skipped, imported, or converted manually.
   - Map Monify categories to Coinbook categories, merging by name when appropriate.
   - Decide whether to apply alias mappings for near-matching categories or import every unknown Monefy category as a custom category.
   - Decide how to handle unsupported Monefy concepts such as accounts, positive balances/deposits, corrections, transfers, income, recurring transactions, tags, or multiple currencies.

3. Implement parser and validation
   - Add a Monefy-specific parser under `src/importExport/`, for example `monefyCsv.js`.
   - Detect the Monefy format by the 8-column header, including duplicate `currency` columns and `converted amount`.
   - Keep parsing logic pure and covered by deterministic fixtures if tests are added later.
   - Reject invalid rows with useful errors; do not partially corrupt existing data.
   - Include summary counts: imported expenses, skipped positive rows, skipped unsupported-currency rows, created categories, merged categories.

4. Integrate with import UI
   - Add a Monefy import option or auto-detect the format if reliable.
   - Preview or summarize imported counts if feasible.
   - Preserve existing behavior: imported expenses are prepended and categories are merged by name.

5. Validate
   - Test using the provided Monify export sample.
   - Verify dates, amounts, categories, notes, duplicate handling, and import/export compatibility.
   - Run `npm run check`.

### Waiting on input

- Desired handling for Monefy positive rows: skip them, import as negative/positive adjustments, or create income/support later.
- Desired handling for account names: ignore them, store them in notes, or extend the app model later.
- Desired handling for EUR savings rows and whether converted amount should be trusted.
- Preference for category aliases versus importing exact Monefy category names as custom categories.

## 3. Add reusable conversion script for Monefy CSV exports

Status: Implemented reusable Node ESM conversion script with dry-run, account metadata, alias controls, summary output, and private generated output path.

Create a `scripts/` directory with a rerunnable script that converts private Monefy CSV exports into Coinbook's import format.

### Implementation plan

1. Add scripts workspace
   - Create `scripts/` for checked-in utility scripts.
   - Keep real input/output data in `samples/private/`, not in `scripts/`.
   - Document expected input and output paths.

2. Build conversion script
   - Add a script such as `scripts/convert-monefy-to-coinbook.mjs`.
   - Input: `samples/private/monefy/*.csv` or an explicit input path argument.
   - Output: `samples/private/generated/coinbook-import.csv` or an explicit output path argument.
   - Convert Monefy rows to Coinbook CSV columns: `date,category,amount,note`.
   - Convert dates from `DD/MM/YYYY` to Coinbook's app date format.
   - Parse comma-thousands amounts correctly.
   - Use negative rows as expenses and output amounts in the sign/shape expected by Coinbook import.
   - Map `description` to `note`.
   - Optionally include account/currency in the note if needed for traceability.

3. Add conversion options
   - Allow category alias mapping for known Monefy → Coinbook category differences.
   - Allow skipping positive balance/deposit/correction rows by default.
   - Allow a dry-run/summary mode that reports imported rows, skipped rows, categories, currencies, and date range.

4. Validate
   - Run the script against `samples/private/monefy/Monefy.Data.13-07-2026.csv`.
   - Confirm generated output imports through Coinbook's existing CSV importer.
   - Keep generated output under `samples/private/generated/` so it is ignored by git.
