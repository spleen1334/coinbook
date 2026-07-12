import { mergeImportedCategories } from './categoryMerge.js';

export function buildJsonExport(categories, expenses) {
  return JSON.stringify({ categories, expenses }, null, 2);
}

export function parseJsonImport(text, currentCategories, swatches, fallbackDate) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    throw new Error('Malformed JSON import');
  }
  if (!data || !Array.isArray(data.expenses)) throw new Error('JSON import missing expenses');

  const { categories, catByName, catById } = mergeImportedCategories(
    currentCategories,
    Array.isArray(data.categories) ? data.categories : [],
    swatches
  );
  const importTick = Date.now();
  const expenses = data.expenses.map((r, i) => ({
    id: 'imp' + importTick + '_' + i,
    amount: parseFloat(r.amount) || 0,
    date: r.date || fallbackDate,
    categoryId: catByName[(r.category || '').trim().toLowerCase()] || catById[r.categoryId] || 'other',
    note: r.note || ''
  }));
  return { categories, expenses };
}
