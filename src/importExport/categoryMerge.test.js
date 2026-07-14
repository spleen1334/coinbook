import { describe, it, expect } from 'vitest';
import { mergeImportedCategories } from './categoryMerge.js';
import { hashCatColor } from '../utils/coin.js';

const current = [{ id: 'food', name: 'Food', color: '#8a5a3b' }];

describe('mergeImportedCategories', () => {
  it('merges a new category by name', () => {
    const { categories, catByName } = mergeImportedCategories(current, [{ name: 'Travel' }]);
    expect(categories.map((c) => c.name)).toEqual(['Food', 'Travel']);
    expect(catByName.get('travel')).toBe(categories[1].id);
  });

  it('deduplicates by case-insensitive name against existing categories', () => {
    const { categories, catByName } = mergeImportedCategories(current, [{ name: 'food' }]);
    expect(categories).toHaveLength(1);
    expect(catByName.get('food')).toBe('food');
  });

  it('deduplicates imported categories against each other', () => {
    const { categories } = mergeImportedCategories(current, [{ name: 'Travel' }, { name: 'travel' }]);
    expect(categories.filter((c) => c.name.toLowerCase() === 'travel')).toHaveLength(1);
  });

  it('preserves a safe source id when it does not collide', () => {
    const { categories } = mergeImportedCategories(current, [{ id: 'travel', name: 'Travel' }]);
    expect(categories.find((c) => c.name === 'Travel').id).toBe('travel');
  });

  it('accepts "__proto__" as a plain string id without polluting anything (safe because ids live in a Map)', () => {
    const { categories, catById } = mergeImportedCategories(current, [{ id: '__proto__', name: 'Sketchy' }]);
    const cat = categories.find((c) => c.name === 'Sketchy');
    expect(cat.id).toBe('__proto__');
    expect(catById.get('__proto__')).toBe('__proto__');
    expect({}.polluted).toBeUndefined();
  });

  it('does not let a formula-like or overlong source id through', () => {
    const { categories } = mergeImportedCategories(current, [{ id: '=cmd|/c calc', name: 'Formula' }]);
    expect(categories.find((c) => c.name === 'Formula').id).toMatch(/^custom_/);
  });

  it('derives a color from the category name when color is missing or invalid', () => {
    const { categories } = mergeImportedCategories(current, [{ name: 'NoColor' }]);
    expect(categories.find((c) => c.name === 'NoColor').color).toBe(hashCatColor('NoColor'));

    const { categories: categories2 } = mergeImportedCategories(current, [
      { name: 'BadColor', color: 'javascript:alert(1)' }
    ]);
    expect(categories2.find((c) => c.name === 'BadColor').color).toBe(hashCatColor('BadColor'));
  });

  it('derives the same color for the same name regardless of import order or position', () => {
    const { categories: a } = mergeImportedCategories(current, [{ name: 'Solo' }]);
    const { categories: b } = mergeImportedCategories(current, [
      { name: 'Filler1' },
      { name: 'Filler2' },
      { name: 'Solo' }
    ]);
    expect(a.find((c) => c.name === 'Solo').color).toBe(b.find((c) => c.name === 'Solo').color);
  });

  it('accepts a valid hex color', () => {
    const { categories } = mergeImportedCategories(current, [{ name: 'Hex', color: '#123456' }]);
    expect(categories.find((c) => c.name === 'Hex').color).toBe('#123456');
  });

  it('accepts a valid hsl color', () => {
    const { categories } = mergeImportedCategories(current, [{ name: 'Hsl', color: 'hsl(200, 32%, 34%)' }]);
    expect(categories.find((c) => c.name === 'Hsl').color).toBe('hsl(200, 32%, 34%)');
  });

  it('skips entries with an empty or missing name', () => {
    const { categories } = mergeImportedCategories(current, [{ name: '' }, { name: '   ' }, {}]);
    expect(categories).toHaveLength(1);
  });

  it('does not throw on non-object array entries', () => {
    expect(() => mergeImportedCategories(current, [null, 'garbage', 42, { name: 'Fine' }])).not.toThrow();
    const { categories } = mergeImportedCategories(current, [null, 'garbage', 42, { name: 'Fine' }]);
    expect(categories.map((c) => c.name)).toContain('Fine');
  });

  it('does not pollute Object.prototype via a __proto__ category name', () => {
    mergeImportedCategories(current, [{ name: '__proto__' }]);
    expect({}.polluted).toBeUndefined();
  });
});
