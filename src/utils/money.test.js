import { describe, it, expect } from 'vitest';
import { formatNumber, formatMoney, formatMoneyParts } from './money.js';

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
  it.each([
    ['EUR', '10.00 €', { amount: '10.00', suffix: '€' }],
    ['RSD', 'RSD 10.00', { prefix: 'RSD', amount: '10.00' }],
    ['USD', '$10.00', { prefix: '$', amount: '10.00' }],
    ['RUB', '₽10.00', { prefix: '₽', amount: '10.00' }],
    ['CNY', '¥10.00', { prefix: '¥', amount: '10.00' }],
    ['XYZ', '$10.00', { prefix: '$', amount: '10.00' }],
    ['constructor', '$10.00', { prefix: '$', amount: '10.00' }]
  ])('formats %s strings and keeps the existing unspaced parts shape', (currency, text, parts) => {
    expect(formatMoney(10, currency, fmt)).toBe(text);
    expect(formatMoneyParts(10, currency, fmt)).toEqual(parts);
  });
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
