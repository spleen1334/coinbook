import { describe, it, expect } from 'vitest';
import { buildJsonExport, parseJsonImport } from './json.js';
import { hashCatColor } from '../utils/coin.js';

const categories = [
  { id: 'food', name: 'Food', color: '#8a5a3b' },
  { id: 'other', name: 'Other', color: '#888888' }
];

describe('buildJsonExport', () => {
  it('serializes categories and expenses as pretty JSON', () => {
    const json = buildJsonExport(categories, [{ id: 'e1', amount: 1, date: '2026-07-01', categoryId: 'food' }]);
    expect(JSON.parse(json)).toEqual({
      categories,
      expenses: [{ id: 'e1', amount: 1, date: '2026-07-01', categoryId: 'food' }]
    });
  });
});

describe('parseJsonImport', () => {
  it('parses valid expenses', () => {
    const text = JSON.stringify({ expenses: [{ amount: 42.5, date: '2026-07-01', category: 'Food', note: 'Coffee' }] });
    const { expenses } = parseJsonImport(text, categories, '2026-01-01');
    expect(expenses[0]).toMatchObject({ amount: 42.5, date: '2026-07-01', categoryId: 'food', note: 'Coffee' });
  });

  it('throws on malformed JSON', () => {
    expect(() => parseJsonImport('{not json', categories, '2026-01-01')).toThrow();
  });

  it('throws when expenses is missing or not an array', () => {
    expect(() => parseJsonImport('{}', categories, '2026-01-01')).toThrow();
    expect(() => parseJsonImport(JSON.stringify({ expenses: 'nope' }), categories, '2026-01-01')).toThrow();
  });

  it('rejects a non-numeric or negative amount to 0', () => {
    const text = JSON.stringify({
      expenses: [
        { amount: 'nope', date: '2026-07-01', categoryId: 'food' },
        { amount: -5, date: '2026-07-01', categoryId: 'food' }
      ]
    });
    const { expenses } = parseJsonImport(text, categories, '2026-01-01');
    expect(expenses.map((e) => e.amount)).toEqual([0, 0]);
  });

  it('rejects an invalid or impossible date to the fallback date', () => {
    const text = JSON.stringify({
      expenses: [
        { amount: 1, date: 'garbage', categoryId: 'food' },
        { amount: 1, date: '2026-13-40', categoryId: 'food' }
      ]
    });
    const { expenses } = parseJsonImport(text, categories, '2026-01-01');
    expect(expenses.every((e) => e.date === '2026-01-01')).toBe(true);
  });

  it('resolves a categoryId of "__proto__" to the canonical "other" category without polluting Object', () => {
    const text = JSON.stringify({ expenses: [{ amount: 1, date: '2026-07-01', categoryId: '__proto__' }] });
    const { expenses } = parseJsonImport(text, categories, '2026-01-01');
    expect(expenses[0].categoryId).toBe('other');
    expect({}.polluted).toBeUndefined();
  });

  it('does not throw on a null entry or non-object entries in the expenses array', () => {
    const text = JSON.stringify({
      expenses: [null, 42, 'garbage', { amount: 1, date: '2026-07-01', categoryId: 'food' }]
    });
    expect(() => parseJsonImport(text, categories, '2026-01-01')).not.toThrow();
    const { expenses } = parseJsonImport(text, categories, '2026-01-01');
    expect(expenses).toHaveLength(4);
    expect(expenses[3].categoryId).toBe('food');
  });

  it('rejects a formula-like or unsafe imported category color', () => {
    const text = JSON.stringify({
      categories: [{ id: 'sketchy', name: 'Sketchy', color: 'javascript:alert(1)' }],
      expenses: []
    });
    const { categories: merged } = parseJsonImport(text, categories, '2026-01-01');
    expect(merged.find((c) => c.name === 'Sketchy').color).toBe(hashCatColor('Sketchy'));
  });
});
