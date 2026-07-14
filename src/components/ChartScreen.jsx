import { CurrencyBadge } from './CurrencyBadge.jsx';

export function ChartScreen({ anim, v, t }) {
  return (
    <div className="cb-chart-screen" style={{ animation: anim }}>
      <div className="cb-chart-hero">
        <div className="cb-chart-donut-wrap">
          <svg
            width="204"
            height="204"
            viewBox="0 0 100 100"
            style={{
              transform: 'rotate(-90deg)',
              filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.2))',
              animation: 'cbPieIn 0.45s ease-out'
            }}
          >
            <circle cx="50" cy="50" r="38" fill="none" stroke="#dcd0ae" strokeWidth="19" />
            {v.pieSegments.map((seg) => (
              <circle
                key={seg.id}
                onMouseEnter={seg.onEnter}
                onMouseLeave={seg.onLeave}
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke={seg.strokeColor}
                strokeWidth={seg.strokeWidth}
                strokeDasharray={seg.dasharray}
                strokeDashoffset={seg.dashoffset}
                strokeLinecap="butt"
                opacity={seg.opacity}
                style={{
                  cursor: 'pointer',
                  transition: 'stroke-width 0.15s ease, opacity 0.15s ease, stroke 0.15s ease',
                  animation: `cbSegFade 0.45s ease-out ${seg.delayMs}ms both`
                }}
              />
            ))}
          </svg>
          <div className="cb-donut-center">
            <div className="cb-donut-label">{v.donutCenterLabel}</div>
            <div className="cb-donut-value">
              <span className="cb-donut-amount">{v.donutCenterValue}</span>
              <CurrencyBadge currency={v.donutCenterCurrency} size="sm" />
            </div>
          </div>
        </div>
      </div>
      <div className="cb-chart-list">
        {!v.hasEntries && <div className="cb-empty cb-chart-empty">{t.nothingToChart}</div>}
        {v.pieSegments.map((seg) => (
          <div
            key={seg.id}
            className="cb-legend-row"
            onMouseEnter={seg.onEnter}
            onMouseLeave={seg.onLeave}
            style={{ background: seg.legendBg, opacity: seg.legendOpacity }}
          >
            <div className="cb-coin-legend-face" style={{ background: seg.face }}>
              <div className="cb-coin-legend-rim" />
              <span className="cb-coin-legend-letter">{seg.initial}</span>
            </div>
            <div className="cb-legend-name">{seg.name}</div>
            <div className="cb-legend-percent">{seg.pctStr}</div>
            <div className="cb-legend-amount">{seg.amountParts.amount}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
