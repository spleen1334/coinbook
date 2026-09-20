import { describe, expect, it } from 'vitest';
import { getDefaultRecurrenceEnd, generateRecurringDates } from './recurrence.js';

describe('getDefaultRecurrenceEnd', () => {
  it('uses the last day of the selected start year', () => {
    expect(getDefaultRecurrenceEnd('2026-09-20')).toBe('2026-12-31');
  });
});

describe('generateRecurringDates', () => {
  it('includes both weekly bounds', () => {
    expect(generateRecurringDates('2026-01-01', '2026-01-15', 'weekly')).toEqual([
      '2026-01-01',
      '2026-01-08',
      '2026-01-15'
    ]);
  });

  it('keeps the original monthly day when shorter months intervene', () => {
    expect(generateRecurringDates('2026-01-31', '2026-04-30', 'monthly')).toEqual([
      '2026-01-31',
      '2026-02-28',
      '2026-03-31',
      '2026-04-30'
    ]);
  });

  it('clamps leap day only in non-leap years', () => {
    expect(generateRecurringDates('2024-02-29', '2028-02-29', 'yearly')).toEqual([
      '2024-02-29',
      '2025-02-28',
      '2026-02-28',
      '2027-02-28',
      '2028-02-29'
    ]);
  });

  it('rejects an end date before the start date', () => {
    expect(() => generateRecurringDates('2026-02-01', '2026-01-31', 'monthly')).toThrow('end date');
  });
});
