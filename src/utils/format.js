import { formatNumber, formatMoney } from './money.js';
import { DEFAULT_RATES } from '../persistence/localState.js';

function resolveRate(rates, cur) {
  const storedRate = rates && rates[cur];
  const parsedRate = Number(String(storedRate).replace(',', '.'));
  const fallbackRate = DEFAULT_RATES[cur] || 1;
  return Number.isFinite(parsedRate) && parsedRate > 0 ? parsedRate : fallbackRate;
}

export function convertAndFormat(amount, cur, rates, numberFormat, includeCurrency = true) {
  const value = amount * resolveRate(rates, cur);
  return includeCurrency ? formatMoney(value, cur, numberFormat) : formatNumber(value, numberFormat);
}

export function convertAndFormatParts(amount, cur, rates, numberFormat) {
  const value = amount * resolveRate(rates, cur);
  const amountText = formatNumber(value, numberFormat);
  if (cur === 'EUR') return { amount: amountText, suffix: '€' };
  if (cur === 'RSD') return { prefix: 'RSD', amount: amountText };
  return { prefix: '$', amount: amountText };
}
