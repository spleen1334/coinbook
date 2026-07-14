import { describe, it, expect } from 'vitest';
import {
  isValidDateString,
  normalizeDateString,
  normalizeAmount,
  normalizeNote,
  normalizeColor,
  normalizeIdString
} from './validate.js';

describe('isValidDateString', () => {
  it('accepts a well-formed calendar date', () => {
    expect(isValidDateString('2026-07-14')).toBe(true);
  });

  it('rejects malformed strings', () => {
    expect(isValidDateString('not-a-date')).toBe(false);
    expect(isValidDateString('2026/07/14')).toBe(false);
    expect(isValidDateString('')).toBe(false);
    expect(isValidDateString(null)).toBe(false);
    expect(isValidDateString(20260714)).toBe(false);
  });

  it('rejects impossible calendar dates (rolled over by Date)', () => {
    expect(isValidDateString('2026-13-40')).toBe(false);
    expect(isValidDateString('2026-02-30')).toBe(false);
  });

  it('accepts a leap day only in a leap year', () => {
    expect(isValidDateString('2024-02-29')).toBe(true);
    expect(isValidDateString('2025-02-29')).toBe(false);
  });
});

describe('normalizeDateString', () => {
  it('passes through a valid date', () => {
    expect(normalizeDateString('2026-07-14', '2000-01-01')).toBe('2026-07-14');
  });

  it('falls back on invalid input', () => {
    expect(normalizeDateString('garbage', '2000-01-01')).toBe('2000-01-01');
    expect(normalizeDateString(undefined, '2000-01-01')).toBe('2000-01-01');
  });
});

describe('normalizeAmount', () => {
  it('accepts positive finite numbers and rounds to cents', () => {
    expect(normalizeAmount(42.5)).toBe(42.5);
    expect(normalizeAmount('12.345')).toBe(12.35);
  });

  it('rejects non-finite, zero, negative, and absurd values', () => {
    expect(normalizeAmount('not-a-number', -1)).toBe(-1);
    expect(normalizeAmount(NaN, -1)).toBe(-1);
    expect(normalizeAmount(Infinity, -1)).toBe(-1);
    expect(normalizeAmount(0, -1)).toBe(-1);
    expect(normalizeAmount(-5, -1)).toBe(-1);
    expect(normalizeAmount(1e13, -1)).toBe(-1);
  });

  it('defaults the fallback to 0', () => {
    expect(normalizeAmount('nope')).toBe(0);
  });
});

describe('normalizeNote', () => {
  it('trims and caps length', () => {
    expect(normalizeNote('  hello  ')).toBe('hello');
    expect(normalizeNote('x'.repeat(400)).length).toBe(300);
  });

  it('returns empty string for non-string input', () => {
    expect(normalizeNote(null)).toBe('');
    expect(normalizeNote(42)).toBe('');
    expect(normalizeNote(undefined)).toBe('');
  });
});

describe('normalizeColor', () => {
  it('accepts 3 and 6 digit hex colors', () => {
    expect(normalizeColor('#abc', '#fallback')).toBe('#abc');
    expect(normalizeColor('#aabbcc', '#fallback')).toBe('#aabbcc');
  });

  it('rejects non-hex values, including injection attempts', () => {
    expect(normalizeColor('javascript:alert(1)', '#fallback')).toBe('#fallback');
    expect(normalizeColor('red', '#fallback')).toBe('#fallback');
    expect(normalizeColor('url(evil)', '#fallback')).toBe('#fallback');
    expect(normalizeColor(null, '#fallback')).toBe('#fallback');
  });
});

describe('normalizeIdString', () => {
  it('trims valid strings', () => {
    expect(normalizeIdString('  food  ')).toBe('food');
  });

  it('rejects empty or non-string values', () => {
    expect(normalizeIdString('')).toBe(null);
    expect(normalizeIdString('   ')).toBe(null);
    expect(normalizeIdString(null)).toBe(null);
    expect(normalizeIdString(42)).toBe(null);
  });
});
