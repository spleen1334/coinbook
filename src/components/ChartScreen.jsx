export function ChartScreen({ anim, v, t }) {
  return (
    <div style={{ animation: anim }}>
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', padding: '14px 0 6px' }}>
        <div style={{ position: 'relative', width: 188, height: 188 }}>
          <svg
            width="188"
            height="188"
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
            <div style={{ fontSize: 9, letterSpacing: 1.5, color: '#8a7355', textAlign: 'center' }}>
              {v.donutCenterLabel}
            </div>
            <div
              style={{
                fontFamily: "'Special Elite',monospace",
                fontSize: 17,
                color: '#2c2416',
                textAlign: 'center',
                whiteSpace: 'nowrap'
              }}
            >
              {v.donutCenterValue}
            </div>
          </div>
        </div>
      </div>
      {!v.hasEntries && (
        <div className="cb-empty" style={{ padding: '20px 0' }}>
          {t.nothingToChart}
        </div>
      )}
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
          <div style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{seg.name}</div>
          <div style={{ fontSize: 12, color: '#8a7355' }}>{seg.pctStr}</div>
          <div style={{ fontSize: 13, fontWeight: 700, width: 66, textAlign: 'right' }}>{seg.amountStr}</div>
        </div>
      ))}
    </div>
  );
}
