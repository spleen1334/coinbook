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
        <rect x="1" y="2" width="14" height="10.5" rx="1.7" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <line x1="1" y1="5" x2="15" y2="5" stroke="currentColor" strokeWidth="1.2" />
        <line x1="4" y1="0.8" x2="4" y2="3.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="12" y1="0.8" x2="12" y2="3.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="3.3" cy="8" r="0.75" fill="currentColor" />
        <circle cx="5.6" cy="8" r="0.75" fill="currentColor" />
        <circle cx="7.9" cy="8" r="0.75" fill="currentColor" />
        <circle cx="10.2" cy="8" r="0.75" fill="currentColor" />
        <circle cx="12.5" cy="8" r="0.75" fill="currentColor" />
        <path
          d="M3.1 10.5h9.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.55"
        />
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
      <rect x="1" y="1.7" width="12" height="11.3" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <line x1="1" y1="5" x2="13" y2="5" stroke="currentColor" strokeWidth="1.2" />
      <line x1="4" y1="0.6" x2="4" y2="3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="10" y1="0.6" x2="10" y2="3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <rect x="3" y="6.5" width="2.7" height="2" rx="0.4" fill="currentColor" />
      <rect x="8.3" y="6.5" width="2.7" height="2" rx="0.4" fill="currentColor" opacity="0.72" />
      <rect x="3" y="9.8" width="2.7" height="2" rx="0.4" fill="currentColor" opacity="0.72" />
      <rect x="8.3" y="9.8" width="2.7" height="2" rx="0.4" fill="currentColor" />
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
