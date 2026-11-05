export function formatNumber(n, fmt) {
  fmt = fmt || { thousands: true, thousandsChar: ',', decimals: 2, decimalChar: '.' };
  const neg = n < 0;
  const fixed = Math.abs(n).toFixed(fmt.decimals);
  let [intPart, decPart] = fixed.split('.');
  if (fmt.thousands) intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, fmt.thousandsChar);
  let out = intPart;
  if (fmt.decimals > 0) out += fmt.decimalChar + decPart;
  return (neg ? '-' : '') + out;
}

const CURRENCY_FORMATS = {
  EUR: { suffix: '€', separator: ' ' },
  RSD: { prefix: 'RSD', separator: ' ' },
  USD: { prefix: '$', separator: '' },
  RUB: { prefix: '₽', separator: '' },
  CNY: { prefix: '¥', separator: '' }
};

function currencyFormat(currency) {
  return Object.hasOwn(CURRENCY_FORMATS, currency) ? CURRENCY_FORMATS[currency] : CURRENCY_FORMATS.USD;
}

export function formatMoneyParts(n, currency, fmt) {
  const { prefix, suffix } = currencyFormat(currency);
  const amount = formatNumber(n, fmt);
  // Parts intentionally omit spacing: the existing UI owns symbol layout.
  return prefix ? { prefix, amount } : { amount, suffix };
}

export function formatMoney(n, currency, fmt) {
  const parts = formatMoneyParts(n, currency, fmt);
  const { separator } = currencyFormat(currency);
  return parts.prefix ? parts.prefix + separator + parts.amount : parts.amount + separator + parts.suffix;
}
