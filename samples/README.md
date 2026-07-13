# Samples and import/export fixtures

This directory is for organizing import/export data used while developing Coinbook.

## Directory layout

- `private/monefy/` — personal Monefy exports. Ignored by git.
- `private/coinbook/` — personal Coinbook exports/backups. Ignored by git.
- `private/generated/` — generated conversion/import/export files. Ignored by git.
- `public/` — safe, anonymized fixtures that may be committed if needed.

Keep real financial data under `samples/private/` only. Do not commit personal exports.

The current Monefy sample was moved to:

`samples/private/monefy/Monefy.Data.13-07-2026.csv`
