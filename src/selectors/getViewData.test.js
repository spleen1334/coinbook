import { describe, expect, it } from 'vitest';
import { buildViewData } from './getViewData.js';
import { DEFAULT_RATES, normalizePersistedState } from '../persistence/localState.js';

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
