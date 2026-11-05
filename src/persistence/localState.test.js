import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  normalizePersistedState,
  pickPersistedState,
  loadPersistedState,
  savePersistedStateAsync,
  STORAGE_KEY,
  DEFAULT_RATES
} from './localState.js';
import { hashCatColor } from '../utils/coin.js';
import { formatNumber } from '../utils/money.js';

describe('normalizePersistedState', () => {
  it.each([null, false, 42, {}, [], '__proto__', 'constructor', 'toString', 'invalid'])(
    'omits unsupported enum settings %j',
    (value) => {
      expect(normalizePersistedState({ language: value, currency: value, listGrouping: value, period: value })).toEqual(
        {}
      );
    }
  );

  it('preserves every supported enum setting', () => {
    for (const [key, values] of Object.entries({
      language: ['en', 'sr', 'ru'],
      currency: ['RSD', 'EUR', 'USD', 'RUB', 'CNY'],
      listGrouping: ['date', 'category', 'none'],
      period: ['day', 'week', 'month', 'year']
    })) {
      for (const value of values) expect(normalizePersistedState({ [key]: value })).toEqual({ [key]: value });
    }
  });

  it('fills partial number formats with safe defaults without adding settings to old snapshots', () => {
    expect(normalizePersistedState({})).not.toHaveProperty('numberFormat');
    expect(normalizePersistedState({ numberFormat: { decimals: 0 } }).numberFormat).toEqual({
      thousands: true,
      thousandsChar: ',',
      decimals: 0,
      decimalChar: '.'
    });
  });

  it.each([
    null,
    false,
    999,
    'invalid',
    [],
    { thousands: 'false', thousandsChar: {}, decimals: 999, decimalChar: [] },
    { thousands: 0, thousandsChar: ' ', decimals: '2', decimalChar: '__proto__' },
    { decimals: -1 },
    { decimals: 1 },
    { decimals: 2.5 },
    { decimals: NaN }
  ])('normalizes malformed number format %j before rendering', (numberFormat) => {
    const normalized = normalizePersistedState({ numberFormat }).numberFormat;
    expect(normalized).toEqual({ thousands: true, thousandsChar: ',', decimals: 2, decimalChar: '.' });
    expect(() => formatNumber(1234.5, normalized)).not.toThrow();
    expect(formatNumber(1234.5, normalized)).toBe('1,234.50');
  });

  it('preserves all supported number-format combinations', () => {
    for (const thousands of [true, false]) {
      for (const thousandsChar of [',', '.']) {
        for (const decimals of [0, 2]) {
          for (const decimalChar of ['.', ',']) {
            const numberFormat = { thousands, thousandsChar, decimals, decimalChar };
            const normalized = normalizePersistedState({ numberFormat }).numberFormat;
            expect(normalized).toEqual(numberFormat);
            expect(formatNumber(1234.5, normalized)).toBe(formatNumber(1234.5, numberFormat));
          }
        }
      }
    }
  });

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
    expect(out.categories).toEqual([{ id: 'food', name: 'Food', color: '#8a5a3b', favorite: false }]);
    expect(out.expenses).toEqual([{ id: 'e1', amount: 4.5, date: '2026-07-01', categoryId: 'food', note: 'Coffee' }]);
  });

  it('preserves valid recurrence metadata and drops malformed recurrence metadata', () => {
    const out = normalizePersistedState({
      expenses: [
        {
          id: 'e1',
          amount: 10,
          date: '2026-01-01',
          categoryId: 'other',
          recurrence: { seriesId: 'r1', frequency: 'monthly', startDate: '2026-01-01', endDate: '2026-12-31' }
        },
        {
          id: 'e2',
          amount: 10,
          date: '2026-01-08',
          categoryId: 'other',
          recurrence: { seriesId: 'r2', frequency: 'sometimes', startDate: '2026-01-01', endDate: '2026-12-31' }
        }
      ]
    });
    expect(out.expenses[0].recurrence).toEqual({
      seriesId: 'r1',
      frequency: 'monthly',
      startDate: '2026-01-01',
      endDate: '2026-12-31'
    });
    expect(out.expenses[1]).not.toHaveProperty('recurrence');
  });

  it('defaults favorite to false when the key is absent (old-snapshot upgrade)', () => {
    const out = normalizePersistedState({
      categories: [{ id: 'food', name: 'Food', color: '#8a5a3b' }]
    });
    expect(out.categories[0].favorite).toBe(false);
  });

  it('preserves favorite: true', () => {
    const out = normalizePersistedState({
      categories: [{ id: 'food', name: 'Food', color: '#8a5a3b', favorite: true }]
    });
    expect(out.categories[0].favorite).toBe(true);
  });

  it('coerces a non-boolean favorite value to false', () => {
    const out = normalizePersistedState({
      categories: [
        { id: 'a', name: 'A', favorite: 'yes' },
        { id: 'b', name: 'B', favorite: 1 },
        { id: 'c', name: 'C', favorite: {} }
      ]
    });
    expect(out.categories.map((c) => c.favorite)).toEqual([false, false, false]);
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

  it('migrates only the known prior USD/EUR defaults', () => {
    const out = normalizePersistedState({ rates: { USD: 0.0097202, EUR: 0.00852051, RUB: 0.75, CNY: 0.08 } });
    expect(out.rates.USD).toBe(DEFAULT_RATES.USD);
    expect(out.rates.EUR).toBe(DEFAULT_RATES.EUR);
    expect(out.rates.RUB).toBe(0.75);
    expect(out.rates.CNY).toBe(0.08);
  });

  it('preserves genuine custom USD/EUR rates during migration', () => {
    const out = normalizePersistedState({ rates: { USD: 1 / 99.5, EUR: 1 / 121.25 } });
    expect(out.rates.USD).toBe(1 / 99.5);
    expect(out.rates.EUR).toBe(1 / 121.25);
  });
});

describe('pickPersistedState', () => {
  it('selects only the persisted fields', () => {
    const state = {
      expenses: [],
      categories: [{ id: 'food', name: 'Food', color: '#8a5a3b', favorite: true }],
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
      categories: [{ id: 'food', name: 'Food', color: '#8a5a3b', favorite: true }],
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

// Transaction completion is controlled separately from request success, as in IDB.
function fakeStorage({ initial, failWrites = false, manual = false } = {}) {
  let snapshot = initial;
  const writes = [];
  const completions = [];
  const local = new Map();
  const localStorage = {
    getItem: vi.fn((key) => local.get(key) ?? null),
    setItem: vi.fn((key, value) => local.set(key, value)),
    removeItem: vi.fn((key) => local.delete(key))
  };
  const db = {
    close: vi.fn(),
    transaction: vi.fn(() => {
      const tx = {
        objectStore: () => ({
          get: () => {
            const request = {};
            queueMicrotask(() => {
              request.result = snapshot;
              request.onsuccess();
            });
            return request;
          },
          put: (value) => {
            writes.push(value);
            const request = {};
            const complete = () => {
              if (failWrites) {
                tx.error = new Error('write failed');
                tx.onabort();
              } else {
                snapshot = value;
                request.onsuccess();
                tx.oncomplete();
              }
            };
            if (manual) completions.push(complete);
            else queueMicrotask(complete);
            return request;
          }
        })
      };
      return tx;
    })
  };
  const indexedDB = {
    open: vi.fn(() => {
      const request = {};
      queueMicrotask(() => {
        request.result = db;
        request.onsuccess();
      });
      return request;
    })
  };
  vi.stubGlobal('window', { localStorage, indexedDB });
  return { local, localStorage, writes, completions, db, indexedDB };
}

describe('durable persistence', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('writes the unchanged snapshot schema to localStorage after an IDB transaction abort', async () => {
    const storage = fakeStorage({ failWrites: true });
    const state = { language: 'sr', expenses: [], screen: 'settings' };
    await expect(savePersistedStateAsync(state)).resolves.toBe(true);
    expect(JSON.parse(storage.local.get(STORAGE_KEY))).toEqual({ language: 'sr', expenses: [] });
    expect(storage.db.close).toHaveBeenCalled();
    await expect(loadPersistedState()).resolves.toEqual({ language: 'sr', expenses: [] });
    expect(storage.local.has(STORAGE_KEY)).toBe(true);
  });

  it('reports failure when both backends reject writes', async () => {
    const storage = fakeStorage({ failWrites: true });
    storage.localStorage.setItem.mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    await expect(savePersistedStateAsync({ language: 'sr' })).resolves.toBe(false);
  });

  it('reports failure when neither backend is available', async () => {
    vi.stubGlobal('window', {});
    await expect(savePersistedStateAsync({ language: 'sr' })).resolves.toBe(false);
  });

  it('overwrites stale fallback when cleanup after an IDB save fails', async () => {
    const storage = fakeStorage({ initial: { language: 'en' } });
    storage.local.set(STORAGE_KEY, JSON.stringify({ language: 'en' }));
    storage.localStorage.removeItem.mockImplementation(() => {
      throw new Error('removal blocked');
    });
    await expect(savePersistedStateAsync({ language: 'sr' })).resolves.toBe(true);
    expect(JSON.parse(storage.local.get(STORAGE_KEY))).toEqual({ language: 'sr' });
    await expect(loadPersistedState()).resolves.toEqual({ language: 'sr' });
  });

  it('reports failure if stale fallback can neither be removed nor overwritten', async () => {
    const storage = fakeStorage();
    storage.local.set(STORAGE_KEY, JSON.stringify({ language: 'en' }));
    storage.localStorage.removeItem.mockImplementation(() => {
      throw new Error('removal blocked');
    });
    storage.localStorage.setItem.mockImplementation(() => {
      throw new Error('write blocked');
    });
    await expect(savePersistedStateAsync({ language: 'sr' })).resolves.toBe(false);
    expect(JSON.parse(storage.local.get(STORAGE_KEY))).toEqual({ language: 'en' });
  });

  it('chains saves arriving between the drain and settlement and returns their outcome', async () => {
    const storage = fakeStorage({ manual: true, failWrites: true });
    let boundaryCaller;
    storage.localStorage.setItem.mockImplementationOnce((key, value) => {
      storage.local.set(key, value);
      // This job runs after the drain returns, before its settlement handler.
      queueMicrotask(() => {
        boundaryCaller = savePersistedStateAsync({ language: 'sr' });
      });
    });
    const first = savePersistedStateAsync({ language: 'en' });
    let settled = false;
    first.then(() => {
      settled = true;
    });
    await vi.waitFor(() => expect(storage.completions).toHaveLength(1));
    storage.completions.shift()();
    await vi.waitFor(() => expect(storage.writes).toHaveLength(2));
    expect(boundaryCaller).toBe(first);
    expect(settled).toBe(false);
    storage.localStorage.setItem.mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    storage.completions.shift()();
    await expect(first).resolves.toBe(false);
    await expect(boundaryCaller).resolves.toBe(false);
  });

  it('prefers newer fallback data over stale IDB and cleans up only after migration commits', async () => {
    const storage = fakeStorage({ initial: { language: 'en' }, manual: true });
    storage.local.set(STORAGE_KEY, JSON.stringify({ language: 'sr' }));
    const loading = loadPersistedState();
    await vi.waitFor(() => expect(storage.completions).toHaveLength(1));
    expect(storage.local.has(STORAGE_KEY)).toBe(true);
    storage.completions.shift()();
    await expect(loading).resolves.toEqual({ language: 'sr' });
    expect(storage.local.has(STORAGE_KEY)).toBe(false);
    await expect(loadPersistedState()).resolves.toEqual({ language: 'sr' });
  });

  it.each(['not json', '{}'])('ignores invalid or empty fallback %s', async (raw) => {
    const storage = fakeStorage({ initial: { language: 'en' } });
    storage.local.set(STORAGE_KEY, raw);
    await expect(loadPersistedState()).resolves.toEqual({ language: 'en' });
    expect(storage.writes).toHaveLength(0);
  });

  it('serializes saves and coalesces queued snapshots to the latest one', async () => {
    const storage = fakeStorage({ manual: true });
    const first = savePersistedStateAsync({ language: 'en' });
    await vi.waitFor(() => expect(storage.completions).toHaveLength(1));
    const middle = savePersistedStateAsync({ language: 'sr' });
    const latest = savePersistedStateAsync({ language: 'ru' });
    expect(middle).toBe(first);
    expect(latest).toBe(first);
    expect(storage.writes.map((state) => state.language)).toEqual(['en']);
    storage.completions.shift()();
    await vi.waitFor(() => expect(storage.completions).toHaveLength(1));
    expect(storage.writes.map((state) => state.language)).toEqual(['en', 'ru']);
    storage.completions.shift()();
    await expect(first).resolves.toBe(true);
    await expect(loadPersistedState()).resolves.toEqual({ language: 'ru' });
  });

  it('returns the latest outcome, not success from an older queued save', async () => {
    const storage = fakeStorage({ manual: true, failWrites: true });
    const saving = savePersistedStateAsync({ language: 'en' });
    await vi.waitFor(() => expect(storage.completions).toHaveLength(1));
    savePersistedStateAsync({ language: 'sr' });
    storage.completions.shift()();
    await vi.waitFor(() => expect(storage.completions).toHaveLength(1));
    storage.localStorage.setItem.mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    storage.completions.shift()();
    await expect(saving).resolves.toBe(false);
    expect(JSON.parse(storage.local.get(STORAGE_KEY))).toEqual({ language: 'en' });
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
