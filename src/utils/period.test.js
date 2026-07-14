import { describe, it, expect } from 'vitest';
import { getRange, getPeriodLabel } from './period.js';

const TODAY = new Date(2026, 6, 15); // 2026-07-15, a Wednesday
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const MONTHS_BY_LANGUAGE = { en: MONTHS };
const UI_TEXT = { en: { today: 'TODAY' } };

describe('getRange', () => {
  it('returns a single-day range for "day"', () => {
    expect(getRange('day', 0, TODAY)).toEqual(['2026-07-15', '2026-07-15']);
  });

  it('offsets by whole days for "day"', () => {
    expect(getRange('day', -1, TODAY)).toEqual(['2026-07-14', '2026-07-14']);
  });

  it('returns a trailing 7-day window for "week"', () => {
    expect(getRange('week', 0, TODAY)).toEqual(['2026-07-09', '2026-07-15']);
  });

  it('returns full calendar month bounds for "month"', () => {
    expect(getRange('month', 0, TODAY)).toEqual(['2026-07-01', '2026-07-31']);
  });

  it('handles month offset across a year boundary', () => {
    expect(getRange('month', 6, TODAY)).toEqual(['2027-01-01', '2027-01-31']);
  });

  it('returns full calendar year bounds for "year"', () => {
    expect(getRange('year', 0, TODAY)).toEqual(['2026-01-01', '2026-12-31']);
    expect(getRange('year', -1, TODAY)).toEqual(['2025-01-01', '2025-12-31']);
  });
});

describe('getPeriodLabel', () => {
  it('labels today as the today string for "day" with offset 0', () => {
    expect(getPeriodLabel('day', 0, 'en', TODAY, UI_TEXT, MONTHS_BY_LANGUAGE, MONTHS)).toBe('TODAY');
  });

  it('formats a non-today day label', () => {
    expect(getPeriodLabel('day', -1, 'en', TODAY, UI_TEXT, MONTHS_BY_LANGUAGE, MONTHS)).toBe("14 JUL '26");
  });

  it('formats a week label within the same month', () => {
    expect(getPeriodLabel('week', 0, 'en', TODAY, UI_TEXT, MONTHS_BY_LANGUAGE, MONTHS)).toBe("09 – 15 JUL '26");
  });

  it('formats a month label with zero-padded month number', () => {
    expect(getPeriodLabel('month', 0, 'en', TODAY, UI_TEXT, MONTHS_BY_LANGUAGE, MONTHS)).toBe('JUL (07) 2026');
  });

  it('formats a year label', () => {
    expect(getPeriodLabel('year', 0, 'en', TODAY, UI_TEXT, MONTHS_BY_LANGUAGE, MONTHS)).toBe('2026');
  });
});
