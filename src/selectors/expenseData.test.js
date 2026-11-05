import { describe, expect, it } from 'vitest';
import { categoryLabel, createExpenseDataSelector, selectExpenseData } from './expenseData.js';
import { MONTHS_BY_LANGUAGE, MONTHS } from '../data/i18n.js';
import { formatShortDate } from '../utils/date.js';

const categories = [
  { id: 'food', name: 'Food' },
  { id: '__proto__', name: 'Custom prototype' }
];
const expenses = [
  { id: 'a', date: '2026-01-01', amount: 12.5, categoryId: 'food', note: 'Coffee beans' },
  { id: 'b', date: '2026-01-31', amount: 20, categoryId: '__proto__', note: 'Outside' },
  { id: 'c', date: '2026-02-01', amount: 5, categoryId: 'missing', note: '' }
];
const select = (query = '', language = 'en') =>
  selectExpenseData(expenses, categories, language, query, '2026-01-01', '2026-01-31');

describe('expense domain selection', () => {
  it('uses an inclusive date range only for empty normalized queries', () => {
    expect(select('  ').filtered).toEqual(expenses.slice(0, 2));
    expect(select().total).toBe(32.5);
    expect(select('2026-02-01').filtered).toContain(expenses[2]);
    expect(select('2026-02-01').total).toBe(5);
    expect(selectExpenseData([], [], 'en', '', '', '').total).toBe(0);
  });

  it.each(['coffee', 'cfe', '12.5', '2026-01-01', 'food'])('searches note/fuzzy/amount/ISO/category: %s', (query) => {
    expect(select(query).filtered).toContain(expenses[0]);
  });

  it.each([
    ['sr', 'Храна'],
    ['ru', 'Еда'],
    ['en', 'Food']
  ])('searches localized category and date in %s', (language, label) => {
    expect(select(label, language).filtered).toContain(expenses[0]);
    expect(
      select(formatShortDate(expenses[0].date, language, MONTHS_BY_LANGUAGE, MONTHS), language).filtered
    ).toContain(expenses[0]);
  });

  it('keeps unknown and inherited-property IDs safe', () => {
    expect(categoryLabel({ id: 'constructor', name: 'Custom' }, 'en')).toBe('Custom');
    expect(categoryLabel(categories[1], 'ru')).toBe('Custom prototype');
    expect(select('custom prototype').filtered).toContain(expenses[1]);
    expect(select('other').filtered).toContain(expenses[2]);
    expect(Object.getPrototypeOf(select().catById)).toBe(null);
    expect(select().catById.__proto__).toBe(categories[1]);
  });

  it('caches normalized queries and invalidates every relevant input', () => {
    const cached = createExpenseDataSelector();
    const args = [expenses, categories, 'en', ' COFFEE ', '2026-01-01', '2026-01-31'];
    const first = cached(...args);
    expect(cached(...args)).toBe(first);
    expect(cached(expenses, categories, 'en', 'coffee', args[4], args[5])).toBe(first);
    const replacements = [[...expenses], [...categories], 'sr', 'outside', '2026-01-02', '2026-02-01'];
    replacements.forEach((value, index) => {
      const before = cached(...args);
      const changed = [...args];
      changed[index] = value;
      expect(cached(...changed)).not.toBe(before);
    });
    const added = { ...expenses[0], id: 'new', amount: 100 };
    expect(cached([...expenses, added], categories, 'en', '', args[4], args[5]).total).toBe(132.5);
  });
});
