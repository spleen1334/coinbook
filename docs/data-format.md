# Data Format

## Local storage

Runtime state is stored in `localStorage` under:

```text
coinbook_v1_state
```

The saved object includes settings as well as data:

```json
{
  "expenses": [],
  "categories": [],
  "language": "en",
  "currency": "USD",
  "rates": { "USD": 1, "EUR": 0.92, "RSD": 108.5 },
  "numberFormat": { "thousands": true, "thousandsChar": ",", "decimals": 2, "decimalChar": "." },
  "listGrouping": "date",
  "period": "month"
}
```

## JSON export/import

JSON export downloads only categories and expenses:

```json
{
  "categories": [{ "id": "food", "name": "Food", "color": "hsl(...)" }],
  "expenses": [{ "id": "e1", "amount": 12.5, "date": "2026-07-12", "categoryId": "food", "note": "Lunch" }]
}
```

Settings are not included in JSON export.

JSON import reads `categories` and `expenses`. Categories are merged by name. Imported expenses are prepended and assigned new ids. Expense category resolution uses imported `category` name when present, then `categoryId`, then `other`.

## CSV export/import

CSV columns are exactly:

```csv
date,category,amount,note
```

Export rows use ISO date, category display name, amount with two decimals, and note:

```csv
date,category,amount,note
2026-07-12,Food,12.50,Lunch
```

CSV import expects those headers, case-insensitive after trimming. Missing categories are created by category name. Imported expenses are prepended, assigned new ids, and default missing dates to today, missing/invalid amounts to `0`, and missing categories to `other`.
