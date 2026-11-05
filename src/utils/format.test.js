import { describe, expect, it } from 'vitest';
import { convertAndFormat, convertAndFormatParts } from './format.js';
import { formatMoney, formatMoneyParts, formatNumber } from './money.js';
import { DEFAULT_RATES } from '../persistence/localState.js';

const fmt = { thousands: true, thousandsChar: '.', decimals: 2, decimalChar: ',' };

describe('currency conversion formatting', () => {
  it.each(['EUR', 'RSD', 'USD', 'RUB', 'CNY', 'XYZ'])(
    'shares string/parts formatting for %s with custom separators and rates',
    (currency) => {
      const rates = { [currency]: '2,5' };
      const amount = -1234.5;
      const value = amount * 2.5;
      expect(convertAndFormat(amount, currency, rates, fmt)).toBe(formatMoney(value, currency, fmt));
      expect(convertAndFormatParts(amount, currency, rates, fmt)).toEqual(formatMoneyParts(value, currency, fmt));
      expect(convertAndFormatParts(amount, currency, rates, fmt).amount).toBe('-3.086,25');
      expect(convertAndFormat(amount, currency, rates, fmt, false)).toBe('-3.086,25');
    }
  );

  it.each(['EUR', 'RSD', 'USD', 'RUB', 'CNY', 'XYZ'])('preserves rate fallback for %s', (currency) => {
    const value = 100 * (DEFAULT_RATES[currency] || 1);
    for (const rates of [undefined, {}, { [currency]: 0 }, { [currency]: -1 }, { [currency]: 'invalid' }]) {
      expect(convertAndFormat(100, currency, rates, fmt)).toBe(formatMoney(value, currency, fmt));
      expect(convertAndFormatParts(100, currency, rates, fmt)).toEqual(formatMoneyParts(value, currency, fmt));
      expect(convertAndFormat(100, currency, rates, fmt, false)).toBe(formatNumber(value, fmt));
    }
  });
});
