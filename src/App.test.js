import { describe, expect, it } from 'vitest';
import App from './App.jsx';
import { parseJsonImport } from './importExport/json.js';
import { buildViewData } from './selectors/getViewData.js';

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
