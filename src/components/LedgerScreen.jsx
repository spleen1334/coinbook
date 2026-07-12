import React from 'react';
import { GroupIcon } from './PeriodIcon.jsx';

export function LedgerScreen({ anim, v, t }) {
  return (
    <div style={{ animation: anim }}>
      <div className="cb-group-row">
        {v.groupingOptions.map((g) => (
          <div
            key={g.id}
            className="cb-group-tab hover-lift"
            onClick={g.select}
            style={{ border: g.border, background: g.bg, color: g.fg, boxShadow: g.shadow }}
          >
            <GroupIcon id={g.id} />
            {g.label}
          </div>
        ))}
      </div>

      {v.hasEntries ? (
        v.groupedList.map((grp) => (
          <React.Fragment key={grp.key}>
            {grp.showHeader && (
              <div className="cb-group-header">
                <div className="cb-group-bar" />
                <div className="cb-group-label">{grp.dateLabel}</div>
                <div className="cb-group-rule" />
              </div>
            )}
            {grp.rows.map((row) => (
              <div key={row.id} className="cb-row-outer">
                <div className="cb-row-delete-bg">
                  <span>✕</span>
                </div>
                <div
                  className="cb-row hover-lift press-96"
                  onClick={row.requestEdit}
                  onTouchStart={row.swipeStart}
                  onTouchMove={row.swipeMove}
                  onTouchEnd={row.swipeEnd}
                  style={{
                    background: row.rowBg,
                    transform: row.rowTransform,
                    animation: row.stampAnim,
                    transition: row.rowTransition
                  }}
                >
                  <div className="cb-coin-badge-ring">
                    <div className="cb-coin-badge-face" style={{ background: row.catFace }}>
                      <div className="cb-coin-badge-rim" />
                      <span className="cb-coin-badge-letter">{row.catInitial}</span>
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{row.catName}</div>
                    {row.showDateInline && <div style={{ fontSize: 11, color: '#a8987a' }}>{row.dateShort}</div>}
                    {row.hasNote && <div style={{ fontSize: 12, color: '#7a6a55' }}>{row.note}</div>}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#b5432e', whiteSpace: 'nowrap' }}>
                    {row.amountStr}
                  </div>
                  <div className="cb-round-btn cb-round-btn-sm hover-delete press-96" onClick={row.requestDelete}>
                    ✕
                  </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))
      ) : (
        <div className="cb-empty">{t.noEntries}</div>
      )}
    </div>
  );
}
