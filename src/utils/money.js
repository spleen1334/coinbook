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

export function formatMoney(n, currency, fmt) {
  const numStr = formatNumber(n, fmt);
  switch (currency) {
    case 'EUR':
      return numStr + ' €';
    case 'RSD':
      return 'RSD ' + numStr;
    case 'USD':
    default:
      return '$' + numStr;
  }
}
