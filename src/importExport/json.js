import { mergeImportedCategories } from './categoryMerge.js';
import { normalizeAmount, normalizeDateString, normalizeNote } from '../utils/validate.js';

export function buildJsonExport(categories, expenses) {
  return JSON.stringify({ categories, expenses }, null, 2);
}

export function parseJsonImport(text, currentCategories, fallbackDate) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    throw new Error('Malformed JSON import');
  }
  if (!data || !Array.isArray(data.expenses)) throw new Error('JSON import missing expenses');

  const { categories, catByName, catById } = mergeImportedCategories(
    currentCategories,
    Array.isArray(data.categories) ? data.categories : []
  );
  const importTick = Date.now();
  const expenses = data.expenses.map((raw, i) => {
    const r = raw && typeof raw === 'object' ? raw : {};
    const categoryName = typeof r.category === 'string' ? r.category.trim().toLowerCase() : '';
    return {
      id: 'imp' + importTick + '_' + i,
      amount: normalizeAmount(r.amount, 0),
      date: normalizeDateString(r.date, fallbackDate),
      categoryId: catByName.get(categoryName) || catById.get(r.categoryId) || 'other',
      note: normalizeNote(r.note)
    };
  });
  return { categories, expenses };
}
