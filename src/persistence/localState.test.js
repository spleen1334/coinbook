import { describe, it, expect, afterEach, vi } from 'vitest';
import { normalizePersistedState, pickPersistedState, loadPersistedState, DEFAULT_RATES } from './localState.js';
import { hashCatColor } from '../utils/coin.js';

describe('normalizePersistedState', () => {
  it('returns an empty object for non-object input', () => {
    expect(normalizePersistedState(null)).toEqual({});
    expect(normalizePersistedState(undefined)).toEqual({});
    expect(normalizePersistedState('garbage')).toEqual({});
  });

  it('passes through well-formed categories and expenses', () => {
    const out = normalizePersistedState({
      categories: [{ id: 'food', name: 'Food', color: '#8a5a3b' }],
      expenses: [{ id: 'e1', amount: 4.5, date: '2026-07-01', categoryId: 'food', note: 'Coffee' }]
    });
    expect(out.categories).toEqual([{ id: 'food', name: 'Food', color: '#8a5a3b' }]);
    expect(out.expenses).toEqual([{ id: 'e1', amount: 4.5, date: '2026-07-01', categoryId: 'food', note: 'Coffee' }]);
  });

  it('drops expense records with an invalid date instead of crashing', () => {
    const out = normalizePersistedState({
      expenses: [{ id: 'e1', amount: 5, date: 'garbage', categoryId: 'food' }]
    });
    expect(out.expenses).toEqual([]);
  });

  it('drops expense records with a non-finite or non-positive amount', () => {
    const out = normalizePersistedState({
      expenses: [
        { id: 'e1', amount: 'nope', date: '2026-07-01', categoryId: 'food' },
        { id: 'e2', amount: -5, date: '2026-07-01', categoryId: 'food' },
        { id: 'e3', amount: 0, date: '2026-07-01', categoryId: 'food' }
      ]
    });
    expect(out.expenses).toEqual([]);
  });

  it('drops expense records missing or duplicating an id', () => {
    const out = normalizePersistedState({
      expenses: [
        { amount: 5, date: '2026-07-01', categoryId: 'food' },
        { id: 'e1', amount: 5, date: '2026-07-01', categoryId: 'food' },
        { id: 'e1', amount: 10, date: '2026-07-02', categoryId: 'food' }
      ]
    });
    expect(out.expenses).toHaveLength(1);
    expect(out.expenses[0].id).toBe('e1');
  });

  it('reassigns an expense categoryId that does not match any known category to "other"', () => {
    const out = normalizePersistedState({
      categories: [{ id: 'food', name: 'Food', color: '#8a5a3b' }],
      expenses: [{ id: 'e1', amount: 5, date: '2026-07-01', categoryId: 'ghost' }]
    });
    expect(out.expenses[0].categoryId).toBe('other');
  });

  it('always treats "other" as a valid categoryId even with no categories array', () => {
    const out = normalizePersistedState({
      expenses: [{ id: 'e1', amount: 5, date: '2026-07-01', categoryId: 'other' }]
    });
    expect(out.expenses[0].categoryId).toBe('other');
  });

  it('does not throw on null or non-object entries in categories/expenses arrays', () => {
    expect(() =>
      normalizePersistedState({
        categories: [null, 42, 'garbage', { id: 'food', name: 'Food' }],
        expenses: [null, 42, 'garbage']
      })
    ).not.toThrow();
  });

  it('drops categories missing an id or name, and dedupes by id', () => {
    const out = normalizePersistedState({
      categories: [
        { id: 'food', name: 'Food' },
        { id: 'food', name: 'Food Duplicate' },
        { name: 'NoId' },
        { id: 'noname' }
      ]
    });
    expect(out.categories).toHaveLength(1);
    expect(out.categories[0].name).toBe('Food');
  });

  it('derives a color from the category name for an invalid category color', () => {
    const out = normalizePersistedState({
      categories: [{ id: 'food', name: 'Food', color: 'javascript:alert(1)' }]
    });
    expect(out.categories[0].color).toBe(hashCatColor('Food'));
  });

  it('preserves an explicit hex category color (the only color format the swatch picker produces)', () => {
    const out = normalizePersistedState({
      categories: [{ id: 'food', name: 'Food', color: '#123456' }]
    });
    expect(out.categories[0].color).toBe('#123456');
  });

  it('self-heals the poisoned #8a7355 fallback left over from an earlier bug, even though it is valid hex', () => {
    // A brief earlier version of the validator fell back to this exact hex value for every
    // category, and that got persisted to storage as if it were real data. It's not one of
    // CATEGORY_SWATCHES, so it can never be a genuine manual pick — must not be trusted just
    // because it happens to be hex.
    const out = normalizePersistedState({
      categories: [
        { id: 'bills', name: 'Bills', color: '#8a7355' },
        { id: 'food', name: 'Food', color: '#8a7355' },
        { id: 'gifts', name: 'Gifts', color: '#8a7355' }
      ]
    });
    const colors = out.categories.map((c) => c.color);
    expect(colors).toEqual([hashCatColor('Bills'), hashCatColor('Food'), hashCatColor('Gifts')]);
    expect(new Set(colors).size).toBe(3);
  });

  it('self-heals hsl() category colors to the current name-hash scheme on every load (regression: all categories collapsing to one color)', () => {
    // Any hsl() color — whether from the old index-based scheme or a previous
    // hash-based color for a category that has since been renamed — is
    // recomputed from the current name on every load, so it never goes stale.
    const out = normalizePersistedState({
      categories: [
        { id: 'food', name: 'Food', color: 'hsl(0, 32%, 34%)' },
        { id: 'fuel', name: 'Fuel', color: 'hsl(138, 32%, 34%)' },
        { id: 'bills', name: 'Bills', color: 'hsl(275, 32%, 34%)' }
      ]
    });
    const colors = out.categories.map((c) => c.color);
    expect(colors).toEqual([hashCatColor('Food'), hashCatColor('Fuel'), hashCatColor('Bills')]);
    expect(new Set(colors).size).toBe(3);
  });

  it('rejects an unrecognized sort direction and falls back to desc', () => {
    const out = normalizePersistedState({ dateSortDir: 'sideways' });
    expect(out.dateSortDir).toBe('desc');
  });

  it('accepts a valid sort direction', () => {
    const out = normalizePersistedState({ dateSortDir: 'asc' });
    expect(out.dateSortDir).toBe('asc');
  });

  it('migrates legacy RSD-denominated rates to the RSD=1 convention', () => {
    const out = normalizePersistedState({ rates: { RSD: 117.5, USD: 1, EUR: 0.92 } });
    expect(out.rates.RSD).toBe(1);
    expect(out.rates.USD).toBeCloseTo(1 / 117.5, 6);
    expect(out.rates.EUR).toBeCloseTo(0.92 / 117.5, 6);
  });

  it('falls back to DEFAULT_RATES for malformed rates', () => {
    const out = normalizePersistedState({ rates: 'garbage' });
    expect(out.rates).toEqual(DEFAULT_RATES);
  });
});

describe('pickPersistedState', () => {
  it('selects only the persisted fields', () => {
    const state = {
      expenses: [],
      categories: [],
      language: 'en',
      currency: 'RSD',
      rates: DEFAULT_RATES,
      numberFormat: {},
      listGrouping: 'date',
      period: 'month',
      dateSortDir: 'desc',
      categorySortDir: 'desc',
      ungroupedSortDir: 'desc',
      screen: 'home',
      searchQuery: 'should not leak through'
    };
    expect(pickPersistedState(state)).not.toHaveProperty('screen');
    expect(pickPersistedState(state)).not.toHaveProperty('searchQuery');
    expect(pickPersistedState(state)).toEqual({
      expenses: [],
      categories: [],
      language: 'en',
      currency: 'RSD',
      rates: DEFAULT_RATES,
      numberFormat: {},
      listGrouping: 'date',
      period: 'month',
      dateSortDir: 'desc',
      categorySortDir: 'desc',
      ungroupedSortDir: 'desc'
    });
  });
});

describe('loadPersistedState fallback behavior', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('resolves to an empty object when no storage is available (no window global)', async () => {
    await expect(loadPersistedState()).resolves.toEqual({});
  });

  it('falls back to localStorage data when IndexedDB is unavailable', async () => {
    const store = {
      [`coinbook_v1_state`]: JSON.stringify({
        language: 'sr',
        currency: 'EUR',
        expenses: [{ id: 'e1', amount: 5, date: '2026-07-01', categoryId: 'other' }]
      })
    };
    const fakeLocalStorage = {
      getItem: (key) => store[key] ?? null,
      setItem: (key, value) => {
        store[key] = value;
      },
      removeItem: (key) => {
        delete store[key];
      }
    };
    vi.stubGlobal('window', { localStorage: fakeLocalStorage });

    const state = await loadPersistedState();
    expect(state.language).toBe('sr');
    expect(state.currency).toBe('EUR');
    expect(state.expenses).toHaveLength(1);
  });
});
