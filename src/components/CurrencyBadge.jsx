const BADGE_TEXT = {
  USD: '$',
  EUR: '\u20ac',
  RSD: 'RSD',
  RUB: '₽',
  CNY: '¥'
};

export function CurrencyBadge({ currency, size = 'md', className = '' }) {
  const code = BADGE_TEXT[currency] ? currency : 'USD';
  const text = BADGE_TEXT[code];

  return (
    <span
      className={`cb-currency-badge cb-currency-badge-${code.toLowerCase()} cb-currency-badge-${size} ${className}`.trim()}
      role="img"
      aria-label={code}
      title={code}
    >
      <span className="cb-currency-badge-face">
        <span className="cb-currency-badge-rim" />
        <span className={`cb-currency-badge-letter ${code === 'RSD' ? 'cb-currency-badge-letter-rsd' : ''}`}>
          {text}
        </span>
      </span>
    </span>
  );
}
