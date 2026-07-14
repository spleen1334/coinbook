import { describe, it, expect } from 'vitest';
import { pad, isoOf, formatShortDate } from './date.js';

describe('pad', () => {
  it('pads single digits with a leading zero', () => {
    expect(pad(5)).toBe('05');
    expect(pad(12)).toBe('12');
  });
});

describe('isoOf', () => {
  it('formats a Date as YYYY-MM-DD', () => {
    expect(isoOf(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(isoOf(new Date(2026, 11, 31))).toBe('2026-12-31');
  });
});

describe('formatShortDate', () => {
  const months = ['JAN', 'FEB', 'MAR'];
  const byLang = { en: months };

  it('formats an ISO date using the language month list', () => {
    expect(formatShortDate('2026-02-14', 'en', byLang, months)).toBe("14 FEB '26");
  });

  it('falls back to the default months list for an unknown language', () => {
    expect(formatShortDate('2026-03-01', 'xx', byLang, months)).toBe("01 MAR '26");
  });
});
