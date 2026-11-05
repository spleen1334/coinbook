import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App.jsx';
import { buildViewData } from './getViewData.js';
import { DEFAULT_RATES, normalizePersistedState } from '../persistence/localState.js';

function realApp() {
  const app = new App({});
  app.state = {
    ...app.state,
    period: 'year',
    categories: [
      { id: 'food', name: 'Food', color: '#123456' },
      { id: 'constructor', name: 'Custom', color: '#654321' }
    ],
    expenses: [
      { id: 'a', amount: 10, date: '2026-01-01', categoryId: 'food', note: 'Coffee' },
      { id: 'b', amount: 10, date: '2026-01-02', categoryId: 'constructor', note: '' },
      { id: 'c', amount: 10, date: '2026-01-02', categoryId: 'food', note: '' }
    ]
  };
  return app;
}

describe('cached real App view models', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 15, 12));
  });
  afterEach(() => vi.useRealTimers());

  it('reuses models with zero extra formatter calls on animation/toast frames', () => {
    const app = realApp();
    const formatter = vi.spyOn(app, 'convertAndFormat');
    const first = app.getViewData();
    const count = formatter.mock.calls.length;
    expect(count).toBeGreaterThan(0);
    app.state = { ...app.state, displayedTotal: 99, coinBurstTick: 5, toastMsg: 'Saved', toastVariant: 'error' };
    expect(app.getViewData()).toBe(first);
    expect(app.getViewData().groupedList).toBe(first.groupedList);
    expect(app.getViewData().pieSegments).toBe(first.pieSegments);
    expect(formatter).toHaveBeenCalledTimes(count);
    expect(first.catById).toBe(app.getExpenseData().catById);
  });

  it.each([
    ['language', 'sr'],
    ['currency', 'EUR'],
    ['rates', { ...DEFAULT_RATES, EUR: 0.1 }],
    ['numberFormat', { thousands: false, decimals: 0, decimalChar: '.', thousandsChar: ',' }],
    ['rateInputs', { EUR: 'new' }],
    ['period', 'month'],
    ['listGrouping', 'category'],
    ['dateSortDir', 'asc'],
    ['categorySortDir', 'asc'],
    ['ungroupedSortDir', 'asc'],
    ['hoverCatId', 'food'],
    ['swipingRowId', 'a'],
    ['swipeRowOffset', 20],
    ['lastAddedId', 'a'],
    ['addCategoryId', 'constructor'],
    ['deleteModalId', 'a'],
    ['lastAction', 'toGraph'],
    ['swipeDir', 1],
    ['searchQuery', 'Coffee'],
    ['periodOffset', -1]
  ])('invalidates on %s', (key, value) => {
    const app = realApp();
    const first = app.getViewData();
    app.state = { ...app.state, [key]: value };
    const next = app.getViewData();
    expect(next).not.toBe(first);
    // Fresh builds intentionally create new callbacks; compare their render data.
    expect(JSON.parse(JSON.stringify(next))).toEqual(JSON.parse(JSON.stringify(buildViewData(app))));
  });

  it.each(['expenses', 'categories'])('invalidates immutable %s updates', (key) => {
    const app = realApp();
    const first = app.getViewData();
    app.state = { ...app.state, [key]: [...app.state[key]] };
    expect(app.getViewData()).not.toBe(first);
  });

  it('characterizes date/category/amount ordering, ties, totals, and empty results', () => {
    const app = realApp();
    const ids = () => app.getViewData().groupedList.map((group) => group.rows.map((row) => row.id));
    expect(ids()).toEqual([['b', 'c'], ['a']]);
    app.state = { ...app.state, dateSortDir: 'asc' };
    expect(ids()).toEqual([['a'], ['b', 'c']]);
    app.state = { ...app.state, listGrouping: 'category' };
    expect(ids()).toEqual([['c', 'a'], ['b']]);
    app.state = { ...app.state, categorySortDir: 'asc' };
    expect(ids()).toEqual([['b'], ['a', 'c']]);
    app.state = { ...app.state, listGrouping: 'none' };
    expect(ids()).toEqual([['b', 'c', 'a']]);
    app.state = { ...app.state, ungroupedSortDir: 'asc' };
    expect(ids()).toEqual([['a', 'b', 'c']]);
    expect(app.getViewData().donutCenterValue).toBe('30.00');
    expect(app.getViewData().pieSegments.map((seg) => seg.name)).toEqual(['Food', 'Custom']);
    app.state = { ...app.state, searchQuery: 'no such note xyz' };
    expect(app.getViewData().groupedList).toEqual([]);
    expect(app.getViewData().pieSegments).toEqual([]);
    expect(app.getViewData().hasEntries).toBe(false);
  });

  it('invalidates across midnight and keeps cached callbacks functional', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1, 23, 59));
    const app = realApp();
    app.state = { ...app.state, period: 'day' };
    const first = app.getViewData();
    const edit = vi.spyOn(app, 'requestEditEntry').mockImplementation(() => {});
    first.groupedList[0].rows[0].requestEdit();
    expect(edit).toHaveBeenCalledWith(app.state.expenses[0]);
    vi.setSystemTime(new Date(2026, 0, 2, 0, 1));
    expect(app.getViewData()).not.toBe(first);
    expect(app.getViewData().filtered.map((e) => e.id)).toEqual(['b', 'c']);
  });
});

function makeApp(rates, overrides = {}) {
  const app = {
    state: {
      language: 'en',
      currency: 'RSD',
      rates,
      rateInputs: {},
      searchQuery: '',
      categories: [],
      expenses: [],
      period: 'month',
      periodOffset: 0,
      listGrouping: 'date',
      dateSortDir: 'desc',
      categorySortDir: 'desc',
      ungroupedSortDir: 'desc',
      hoverCatId: null,
      lastAction: null,
      swipeDir: 0,
      numberFormat: { thousands: true, thousandsChar: ',', decimals: 2, decimalChar: '.' },
      addCategoryId: null,
      ...overrides
    },
    getFilteredExpenses: () => [],
    getExpenseData: () => {
      const catById = Object.create(null);
      app.state.categories.forEach((cat) => {
        catById[cat.id] = cat;
      });
      const filtered = app.getFilteredExpenses();
      return { catById, filtered, total: filtered.reduce((sum, expense) => sum + expense.amount, 0) };
    },
    catLabel: (cat) => cat.name,
    convertAndFormat: () => '',
    setLanguage: () => {},
    setCurrency: () => {},
    selectPeriod: () => {},
    setListGrouping: () => {},
    setNumberFormat: () => {},
    setRate: () => {},
    finishRateEditing: () => {},
    setState: () => {},
    toggleCategoryFavorite: () => {}
  };
  return app;
}

describe('settings exchange-rate view data', () => {
  it('exposes defaults as RSD per foreign currency unit', () => {
    const options = buildViewData(makeApp(DEFAULT_RATES)).rateOptions;
    expect(Object.fromEntries(options.map((r) => [r.code, Number(r.value)]))).toEqual({
      USD: expect.closeTo(102.73, 2),
      EUR: expect.closeTo(117.36, 2),
      RUB: expect.closeTo(1.3, 2),
      CNY: expect.closeTo(15.17, 2)
    });
    expect(Object.fromEntries(options.map((r) => [r.code, r.value]))).toEqual({
      USD: '102.73',
      EUR: '117.36',
      RUB: '1.30',
      CNY: '15.17'
    });
  });

  it('keeps existing USD/EUR persisted rates and adds safe new fallbacks', () => {
    const rates = normalizePersistedState({ rates: { USD: 1 / 100, EUR: 1 / 120 } }).rates;
    const options = buildViewData(makeApp(rates)).rateOptions;
    expect(options.find((r) => r.code === 'USD').value).toBe('100.00');
    expect(options.find((r) => r.code === 'EUR').value).toBe('120.00');
    expect(Number(options.find((r) => r.code === 'RUB').value)).toBeCloseTo(1.3, 2);
    expect(Number(options.find((r) => r.code === 'CNY').value)).toBeCloseTo(15.17, 2);
  });
});

describe('category picker ordering', () => {
  const cat = (id, favorite) => ({ id, name: id, color: '#8a5a3b', favorite });

  it('sorts favorites first, preserving insertion order within each group', () => {
    const categories = [cat('a', false), cat('b', true), cat('c', false), cat('d', true)];
    const picker = buildViewData(makeApp(DEFAULT_RATES, { categories })).categoriesForPicker;
    expect(picker.map((c) => c.id)).toEqual(['b', 'd', 'a', 'c']);
  });

  it('leaves an all-favorite list unchanged', () => {
    const categories = [cat('a', true), cat('b', true)];
    const picker = buildViewData(makeApp(DEFAULT_RATES, { categories })).categoriesForPicker;
    expect(picker.map((c) => c.id)).toEqual(['a', 'b']);
  });

  it('leaves a no-favorite list unchanged', () => {
    const categories = [cat('a', false), cat('b', false)];
    const picker = buildViewData(makeApp(DEFAULT_RATES, { categories })).categoriesForPicker;
    expect(picker.map((c) => c.id)).toEqual(['a', 'b']);
  });

  it('exposes a toggleFavorite handler that calls app.toggleCategoryFavorite with the id and stops propagation', () => {
    const app = makeApp(DEFAULT_RATES, { categories: [cat('a', false)] });
    let calledWith = null;
    app.toggleCategoryFavorite = (id) => {
      calledWith = id;
    };
    const picker = buildViewData(app).categoriesForPicker;
    let stopped = false;
    picker[0].toggleFavorite({ stopPropagation: () => (stopped = true) });
    expect(calledWith).toBe('a');
    expect(stopped).toBe(true);
  });
});

describe('ledger recurrence view data', () => {
  it('labels recurring rows and renames the ungrouped tab to amount', () => {
    const app = makeApp(DEFAULT_RATES, {
      categories: [{ id: 'food', name: 'Food', color: '#8a5a3b', favorite: false }],
      expenses: [
        {
          id: 'e1',
          amount: 10,
          date: '2026-01-01',
          categoryId: 'food',
          recurrence: { seriesId: 'r1', frequency: 'monthly', startDate: '2026-01-01', endDate: '2026-12-31' }
        }
      ]
    });
    app.getFilteredExpenses = () => app.state.expenses;
    app.convertAndFormatParts = () => ({ amount: '10.00' });
    const view = buildViewData(app);
    expect(view.groupingOptions.find((option) => option.id === 'none').label).toBe('AMOUNT');
    expect(view.groupedList[0].rows[0]).toMatchObject({ isRecurring: true, recurrenceLabel: 'Repeats monthly' });
  });
});
