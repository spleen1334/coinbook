export function ChartPeriodControls({ app, t, hidden }) {
  return (
    <div className={`cb-chart-period-controls${hidden ? ' cb-chart-period-controls-hidden' : ''}`} aria-hidden={hidden}>
      <button
        type="button"
        className="cb-ledger-period-arrow cb-ledger-period-arrow-left hover-chevron"
        aria-label={t.previousPeriod}
        tabIndex={hidden ? -1 : 0}
        onClick={() => app.shiftPeriod(-1)}
      >
        <svg className="cb-ledger-period-arrow-icon" width="18" height="30" viewBox="0 0 18 30" aria-hidden="true">
          <path
            d="M13 4 5 15l8 11"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <button
        type="button"
        className="cb-ledger-period-arrow cb-ledger-period-arrow-right hover-chevron"
        aria-label={t.nextPeriod}
        tabIndex={hidden ? -1 : 0}
        onClick={() => app.shiftPeriod(1)}
      >
        <svg className="cb-ledger-period-arrow-icon" width="18" height="30" viewBox="0 0 18 30" aria-hidden="true">
          <path
            d="M5 4l8 11-8 11"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
