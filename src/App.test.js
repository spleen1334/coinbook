import { describe, expect, it, vi } from 'vitest';
import App from './App.jsx';
import { parseJsonImport } from './importExport/json.js';
import { buildViewData } from './selectors/getViewData.js';
import { normalizePersistedState } from './persistence/localState.js';
import { UI_TEXT } from './data/i18n.js';
import * as recurrence from './utils/recurrence.js';

vi.mock('./utils/chaChing.js', () => ({ playChaChing: vi.fn() }));

function submissionApp(overrides = {}) {
  const app = new App({});
  app.setState = (update) => {
    const next = typeof update === 'function' ? update(app.state, app.props) : update;
    app.state = { ...app.state, ...next };
  };
  app.showToast = vi.fn();
  app.requestExpenseTotalReplay = vi.fn();
  app.state = {
    ...app.state,
    expenses: [],
    showAdd: true,
    addAmount: '12.345',
    addDate: '2026-02-28',
    addCategoryId: 'food',
    addNote: '  lunch  ',
    ...overrides
  };
  return app;
}

function expectRoundtrip(app) {
  expect(normalizePersistedState({ categories: app.state.categories, expenses: app.state.expenses }).expenses).toEqual(
    app.state.expenses
  );
}

describe('App entry submission', () => {
  it('adds canonical values that survive reload', () => {
    const app = submissionApp();
    app.submitAdd();
    expect(app.state.showAdd).toBe(false);
    expect(app.state.expenses[0]).toMatchObject({ amount: 12.35, note: 'lunch', date: '2026-02-28' });
    expectRoundtrip(app);
  });

  it('edits in place and preserves recurrence metadata', () => {
    const existing = {
      id: 'e1',
      amount: 5,
      date: '2026-01-01',
      categoryId: 'food',
      note: '',
      recurrence: { seriesId: 'r1', frequency: 'monthly', startDate: '2026-01-01', endDate: '2026-03-01' }
    };
    const app = submissionApp({ editingId: 'e1', expenses: [existing] });
    app.submitAdd();
    expect(app.state.expenses[0]).toEqual({ ...existing, amount: 12.35, date: '2026-02-28', note: 'lunch' });
    expectRoundtrip(app);
  });

  it('adds a recurring series in order with canonical values', () => {
    const app = submissionApp({
      addRecurring: true,
      addRecurrenceFrequency: 'monthly',
      addRecurrenceEnd: '2026-04-30'
    });
    app.submitAdd();
    expect(app.state.expenses.map((entry) => entry.date)).toEqual(['2026-02-28', '2026-03-28', '2026-04-28']);
    expect(app.state.lastAddedId).toBe(app.state.expenses[0].id);
    expectRoundtrip(app);
  });

  it.each([
    [{ addAmount: 'Infinity' }, 'invalidAmountToast'],
    [{ addAmount: '1000000000001' }, 'invalidAmountToast'],
    [{ addAmount: '0' }, 'invalidAmountToast'],
    [{ addAmount: '-2' }, 'invalidAmountToast'],
    [{ addAmount: '0.004' }, 'invalidAmountToast'],
    [{ addDate: '2026-02-30' }, 'invalidDateToast'],
    [{ addNote: 'x'.repeat(301) }, 'noteTooLongToast'],
    [{ addRecurring: true, addRecurrenceFrequency: 'daily', addRecurrenceEnd: '2026-03-01' }, 'invalidRecurrenceToast'],
    [{ addRecurring: true, addRecurrenceEnd: '2026-02-30' }, 'invalidRecurrenceToast'],
    [{ addRecurring: true, addRecurrenceEnd: '2026-02-01' }, 'invalidRecurrenceToast']
  ])('rejects invalid submission %# without mutating expenses', (overrides, message) => {
    const existing = { id: 'e1', amount: 5, date: '2026-01-01', categoryId: 'food', note: '' };
    const app = submissionApp({ ...overrides, expenses: [existing], editingId: 'e1', language: 'ru' });
    const expenses = app.state.expenses;
    app.submitAdd();
    expect(app.state.expenses).toBe(expenses);
    expect(app.state.showAdd).toBe(true);
    expect(app.requestExpenseTotalReplay).not.toHaveBeenCalled();
    expect(app.showToast).toHaveBeenCalledWith(UI_TEXT.ru[message], 'error');
  });

  it('accepts a 300 character trimmed note', () => {
    const app = submissionApp({ addNote: `  ${'x'.repeat(300)}  ` });
    app.submitAdd();
    expect(app.state.expenses[0].note).toBe('x'.repeat(300));
    expectRoundtrip(app);
  });

  it('rejects an empty generated series without replay or changes', () => {
    const spy = vi.spyOn(recurrence, 'generateRecurringDates').mockReturnValueOnce([]);
    const app = submissionApp({ addRecurring: true, addRecurrenceEnd: '2026-03-01' });
    app.submitAdd();
    expect(app.state.expenses).toEqual([]);
    expect(app.state.showAdd).toBe(true);
    expect(app.requestExpenseTotalReplay).not.toHaveBeenCalled();
    expect(app.showToast).toHaveBeenCalledWith(UI_TEXT.en.invalidRecurrenceToast, 'error');
    spy.mockRestore();
  });
});

describe('App category labels after JSON import', () => {
  it.each([
    ['en', 'Food'],
    ['sr', 'Храна'],
    ['ru', 'Еда']
  ])('keeps inherited-property IDs and translated built-ins safe in %s render models', (language, foodLabel) => {
    // Instantiate without mounting: no DOM, lifecycle timers, or mocked label logic.
    const app = new App({});
    const date = app.state.addDate;
    const categories = [
      { id: '__proto__', name: 'Custom prototype', color: '#123456' },
      { id: 'constructor', name: 'Custom constructor', color: '#654321' }
    ];
    const imported = parseJsonImport(
      JSON.stringify({
        categories,
        expenses: [...categories, { id: 'food' }].map((cat) => ({
          categoryId: cat.id,
          amount: 10,
          date
        }))
      }),
      app.state.categories,
      date
    );
    app.state = { ...app.state, ...imported, language, listGrouping: 'category', addCategoryId: '__proto__' };

    for (const cat of categories) {
      expect(imported.categories.find((c) => c.id === cat.id)?.name).toBe(cat.name);
      expect(imported.expenses.some((e) => e.categoryId === cat.id)).toBe(true);
      expect(app.catLabel(cat)).toBe(cat.name);
    }
    expect(app.catLabel({ id: 'food', name: 'Not the translated name' })).toBe(foodLabel);

    const view = buildViewData(app);
    const expectedLabels = [...categories.map((cat) => cat.name), foodLabel];
    expect(view.groupedList.map((group) => group.dateLabel)).toEqual(expect.arrayContaining(expectedLabels));
    expect(view.groupedList.flatMap((group) => group.rows.map((row) => row.catName))).toEqual(
      expect.arrayContaining(expectedLabels)
    );
    expect(view.pieSegments.map((segment) => segment.name)).toEqual(expect.arrayContaining(expectedLabels));
    expect(view.categoriesForPicker.map((cat) => cat.name)).toEqual(expect.arrayContaining(expectedLabels));
    expect(view.selectedCatLabel).toBe('Custom prototype');
  });
});
