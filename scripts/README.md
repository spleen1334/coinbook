# Scripts

## Convert Monefy CSV to Coinbook CSV

```sh
node scripts/convert-monefy-to-coinbook.mjs [--dry-run] [--include-account] [--no-aliases] [input.csv] [output.csv]
```

Defaults:

- Input: `samples/private/monefy/Monefy.Data.13-07-2026.csv`
- Output: `samples/private/generated/coinbook-import.csv`

The script converts negative RSD Monefy rows to Coinbook import columns `date,category,amount,note`, using positive RSD base amounts without currency conversion. It skips `Štednja`/`Stednja` account rows, skips positive/zero and non-RSD rows, and creates the output directory when writing.
