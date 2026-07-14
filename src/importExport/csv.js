import { csvEscape, parseCsv } from '../utils/csv.js';
import { mergeImportedCategories } from './categoryMerge.js';

export function buildCsvExport(categories, expenses) {
  const catById = new Map();
  categories.forEach((c) => {
    catById.set(c.id, c);
  });
  const rows = [['date', 'category', 'amount', 'note']];
  expenses.forEach((e) => {
    rows.push([e.date, (catById.get(e.categoryId) || { name: 'Other' }).name, e.amount.toFixed(2), e.note || '']);
  });
  return rows.map((r) => r.map(csvEscape).join(',')).join('\n');
}

export function parseCsvImport(text, currentCategories, swatches, fallbackDate) {
  const rows = parseCsv(text);
  if (!rows.length) throw new Error('CSV import missing header');
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const dIdx = header.indexOf('date'),
    cIdx = header.indexOf('category'),
    aIdx = header.indexOf('amount'),
    nIdx = header.indexOf('note');
  if (dIdx < 0 || cIdx < 0 || aIdx < 0 || nIdx < 0) throw new Error('CSV import missing required headers');

  const catNames = new Set(
    rows
      .slice(1)
      .map((r) => (r[cIdx] || '').trim())
      .filter(Boolean)
  );
  const { categories, catByName } = mergeImportedCategories(
    currentCategories,
    Array.from(catNames).map((name) => ({ name })),
    swatches
  );
  const importTick = Date.now();
  const expenses = rows.slice(1).map((r, i) => ({
    id: 'imp' + importTick + '_' + i,
    amount: parseFloat(r[aIdx]) || 0,
    date: r[dIdx] || fallbackDate,
    categoryId: catByName.get((r[cIdx] || '').trim().toLowerCase()) || 'other',
    note: r[nIdx] || ''
  }));
  return { categories, expenses };
}
