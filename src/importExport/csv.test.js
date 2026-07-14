import { describe, it, expect } from 'vitest';
import { buildCsvExport, parseCsvImport } from './csv.js';

const categories = [
  { id: 'food', name: 'Food', color: '#8a5a3b' },
  { id: 'other', name: 'Other', color: '#888888' }
];

describe('buildCsvExport', () => {
  it('produces a header row and one row per expense', () => {
    const expenses = [{ date: '2026-07-01', categoryId: 'food', amount: 4.5, note: 'Coffee' }];
    const csv = buildCsvExport(categories, expenses);
    expect(csv).toBe('date,category,amount,note\n2026-07-01,Food,4.50,Coffee');
  });

  it('escapes a formula-like note to prevent spreadsheet injection', () => {
    const expenses = [{ date: '2026-07-01', categoryId: 'food', amount: 1, note: '=SUM(A1:A9)' }];
    const csv = buildCsvExport(categories, expenses);
    expect(csv).toContain("'=SUM(A1:A9)");
  });

  it('falls back to "Other" for an unknown categoryId', () => {
    const expenses = [{ date: '2026-07-01', categoryId: 'ghost', amount: 1, note: '' }];
    const csv = buildCsvExport(categories, expenses);
    expect(csv).toContain(',Other,');
  });
});

describe('parseCsvImport', () => {
  const header = 'date,category,amount,note';

  it('parses valid rows into expense records', () => {
    const text = `${header}\n2026-07-01,Food,42.50,Coffee`;
    const { expenses } = parseCsvImport(text, categories, '2026-01-01');
    expect(expenses).toHaveLength(1);
    expect(expenses[0]).toMatchObject({ amount: 42.5, date: '2026-07-01', categoryId: 'food', note: 'Coffee' });
  });

  it('throws when required headers are missing', () => {
    expect(() => parseCsvImport('a,b,c\n1,2,3', categories, '2026-01-01')).toThrow();
  });

  it('throws on an empty file', () => {
    expect(() => parseCsvImport('', categories, '2026-01-01')).toThrow();
  });

  it('rejects a non-numeric amount to 0 instead of crashing', () => {
    const text = `${header}\n2026-07-01,Food,not-a-number,note`;
    const { expenses } = parseCsvImport(text, categories, '2026-01-01');
    expect(expenses[0].amount).toBe(0);
  });

  it('rejects an invalid date to the fallback date', () => {
    const text = `${header}\nnot-a-date,Food,10,note`;
    const { expenses } = parseCsvImport(text, categories, '2026-01-01');
    expect(expenses[0].date).toBe('2026-01-01');
  });

  it('creates a new category for an unrecognized category name', () => {
    const text = `${header}\n2026-07-01,Travel,10,note`;
    const { categories: merged, expenses } = parseCsvImport(text, categories, '2026-01-01');
    expect(merged.some((c) => c.name === 'Travel')).toBe(true);
    expect(expenses[0].categoryId).toBe(merged.find((c) => c.name === 'Travel').id);
  });

  it('falls back to the canonical "other" category when category cell is blank', () => {
    const text = `${header}\n2026-07-01,,10,note`;
    const { expenses } = parseCsvImport(text, categories, '2026-01-01');
    expect(expenses[0].categoryId).toBe('other');
  });
});
