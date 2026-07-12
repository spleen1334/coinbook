export function PeriodIcon({ id }) {
  if (id === 'day')
    return (
      <svg width="14" height="14" viewBox="0 0 14 14">
        <circle cx="7" cy="7" r="3" fill="currentColor" />
        <line x1="7" y1="0.5" x2="7" y2="2.2" stroke="currentColor" strokeWidth="1.3" />
        <line x1="7" y1="11.8" x2="7" y2="13.5" stroke="currentColor" strokeWidth="1.3" />
        <line x1="0.5" y1="7" x2="2.2" y2="7" stroke="currentColor" strokeWidth="1.3" />
        <line x1="11.8" y1="7" x2="13.5" y2="7" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    );
  if (id === 'week')
    return (
      <svg width="16" height="14" viewBox="0 0 16 14">
        <rect x="0" y="3" width="1.6" height="8" fill="currentColor" />
        <rect x="2.4" y="1" width="1.6" height="12" fill="currentColor" />
        <rect x="4.8" y="4" width="1.6" height="6" fill="currentColor" />
        <rect x="7.2" y="0" width="1.6" height="14" fill="currentColor" />
        <rect x="9.6" y="3" width="1.6" height="8" fill="currentColor" />
        <rect x="12" y="1" width="1.6" height="12" fill="currentColor" />
        <rect x="14.4" y="4" width="1.6" height="6" fill="currentColor" />
      </svg>
    );
  if (id === 'month')
    return (
      <svg width="14" height="14" viewBox="0 0 14 14">
        <rect x="0.5" y="1.5" width="13" height="12" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <line x1="0.5" y1="5" x2="13.5" y2="5" stroke="currentColor" strokeWidth="1.2" />
        <line x1="4" y1="0" x2="4" y2="2.5" stroke="currentColor" strokeWidth="1.2" />
        <line x1="10" y1="0" x2="10" y2="2.5" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  return (
    <svg width="14" height="14" viewBox="0 0 14 14">
      <circle cx="7" cy="7" r="6.3" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <line x1="7" y1="0.7" x2="7" y2="13.3" stroke="currentColor" strokeWidth="1.2" />
      <line x1="0.7" y1="7" x2="13.3" y2="7" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function GroupIcon({ id }) {
  if (id === 'date')
    return (
      <svg width="12" height="12" viewBox="0 0 14 14">
        <rect x="0.5" y="1.5" width="13" height="12" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <line x1="0.5" y1="5" x2="13.5" y2="5" stroke="currentColor" strokeWidth="1.2" />
        <line x1="4" y1="0" x2="4" y2="2.5" stroke="currentColor" strokeWidth="1.2" />
        <line x1="10" y1="0" x2="10" y2="2.5" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  if (id === 'category')
    return (
      <svg width="12" height="12" viewBox="0 0 14 14">
        <rect x="0.5" y="0.5" width="6" height="6" rx="1" fill="currentColor" />
        <rect x="7.5" y="0.5" width="6" height="6" rx="1" fill="currentColor" opacity="0.55" />
        <rect x="0.5" y="7.5" width="6" height="6" rx="1" fill="currentColor" opacity="0.55" />
        <rect x="7.5" y="7.5" width="6" height="6" rx="1" fill="currentColor" />
      </svg>
    );
  return (
    <svg width="14" height="12" viewBox="0 0 14 12">
      <rect x="0" y="1" width="14" height="1.8" rx="0.9" fill="currentColor" />
      <rect x="0" y="5.1" width="14" height="1.8" rx="0.9" fill="currentColor" />
      <rect x="0" y="9.2" width="14" height="1.8" rx="0.9" fill="currentColor" />
    </svg>
  );
}
