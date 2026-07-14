# Scripts

## Verify PWA build artifacts

```sh
npm run verify:pwa
```

Builds the app for both the root path (`/`) and the GitHub Pages base path (`/coinbook/`), then checks each build output for: manifest and service worker presence, all three icon files actually on disk (and referenced correctly from the manifest), exactly one `<link rel="manifest">` tag and one Google Fonts stylesheet link (no duplicates), and every local asset reference in `index.html` correctly rooted under the configured base path. Exits non-zero if any check fails.

## Convert Monefy CSV to Coinbook CSV

```sh
node scripts/convert-monefy-to-coinbook.mjs [--dry-run] [--include-account] [--no-aliases] [input.csv] [output.csv]
```

Defaults:

- Input: `samples/private/monefy/Monefy.Data.13-07-2026.csv`
- Output: `samples/private/generated/coinbook-import.csv`

The script converts negative RSD Monefy rows to Coinbook import columns `date,category,amount,note`, using positive RSD base amounts without currency conversion. It skips `Štednja`/`Stednja` account rows, skips positive/zero and non-RSD rows, and creates the output directory when writing.
