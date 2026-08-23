import { describe, expect, it } from 'vitest';
import { getAmountBand } from './amountBand.js';

describe('getAmountBand', () => {
  it.each([
    [0, 'white'],
    [40000, 'white'],
    [40000.01, 'blue'],
    [80000, 'blue'],
    [80000.01, 'green'],
    [100000, 'green'],
    [100000.01, 'yellow'],
    [125000, 'yellow'],
    [125000.01, 'dark-red'],
    [150000, 'dark-red'],
    [150000.01, 'bright-red'],
    [200000, 'bright-red'],
    [200000.01, 'burgundy']
  ])('assigns %s to %s', (amount, band) => {
    expect(getAmountBand(amount)).toBe(band);
  });
});
