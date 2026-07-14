import { describe, it, expect } from 'vitest';
import { formatNumber, formatMoney } from './money.js';

const fmt = { thousands: true, thousandsChar: ',', decimals: 2, decimalChar: '.' };

describe('formatNumber', () => {
  it('formats with thousands separator and decimals', () => {
    expect(formatNumber(1234.5, fmt)).toBe('1,234.50');
  });

  it('respects custom separator characters', () => {
    expect(formatNumber(1234.5, { thousands: true, thousandsChar: '.', decimals: 2, decimalChar: ',' })).toBe(
      '1.234,50'
    );
  });

  it('omits decimals when decimals is 0', () => {
    expect(formatNumber(1234.5, { thousands: true, thousandsChar: ',', decimals: 0, decimalChar: '.' })).toBe('1,235');
  });

  it('formats negative numbers with a leading minus', () => {
    expect(formatNumber(-42.5, fmt)).toBe('-42.50');
  });

  it('omits the thousands separator when disabled', () => {
    expect(formatNumber(1234.5, { thousands: false, thousandsChar: ',', decimals: 2, decimalChar: '.' })).toBe(
      '1234.50'
    );
  });
});

describe('formatMoney', () => {
  it('formats EUR with a trailing symbol', () => {
    expect(formatMoney(10, 'EUR', fmt)).toBe('10.00 €');
  });

  it('formats RSD with a leading code', () => {
    expect(formatMoney(10, 'RSD', fmt)).toBe('RSD 10.00');
  });

  it('formats USD (and unknown currencies) with a leading $', () => {
    expect(formatMoney(10, 'USD', fmt)).toBe('$10.00');
    expect(formatMoney(10, 'XYZ', fmt)).toBe('$10.00');
  });
});
