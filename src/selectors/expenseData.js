import { CATEGORY_NAMES_BY_LANGUAGE, MONTHS_BY_LANGUAGE, MONTHS } from '../data/i18n.js';
import { formatShortDate } from '../utils/date.js';
import { fuzzyMatch } from '../utils/search.js';

export function categoryLabel(cat, language) {
  const names = CATEGORY_NAMES_BY_LANGUAGE[language] || CATEGORY_NAMES_BY_LANGUAGE.en;
  return Object.hasOwn(names, cat.id) ? names[cat.id] : cat.name;
}

export function selectExpenseData(expenses, categories, language, query, start, end) {
  const catById = Object.create(null);
  categories.forEach((cat) => {
    catById[cat.id] = cat;
  });
  const normalizedQuery = (query || '').trim().toLowerCase();
  const filtered = expenses.filter((expense) => {
    if (!normalizedQuery) return expense.date >= start && expense.date <= end;
    const cat = catById[expense.categoryId] || { id: 'other', name: 'Other' };
    const hay = [
      expense.note,
      categoryLabel(cat, language),
      formatShortDate(expense.date, language, MONTHS_BY_LANGUAGE, MONTHS),
      expense.date,
      String(expense.amount)
    ]
      .join(' ')
      .toLowerCase();
    return fuzzyMatch(normalizedQuery, hay);
  });
  return { catById, filtered, total: filtered.reduce((sum, expense) => sum + expense.amount, 0) };
}

export function createExpenseDataSelector() {
  let previousArgs;
  let result;
  return (expenses, categories, language, query, start, end) => {
    const args = [expenses, categories, language, (query || '').trim().toLowerCase(), start, end];
    if (!previousArgs || args.some((arg, i) => arg !== previousArgs[i])) {
      result = selectExpenseData(...args);
      previousArgs = args;
    }
    return result;
  };
}
