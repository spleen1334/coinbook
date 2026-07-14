import { PeriodIcon } from './PeriodIcon.jsx';
import { CoinScatter } from './CoinScatter.jsx';
import { CurrencyBadge } from './CurrencyBadge.jsx';
import { APP_ICON_URL } from '../utils/appIcon.js';

export function AppHeader({ app, s, v, t }) {
  const isSettings = s.screen === 'settings';
  const notSettings = !isSettings;
  const isGraph = s.screen === 'graph';
  const notSearching = !v.isSearching;
  const showChartNav = notSettings && isGraph;
  const showTicket = notSettings && !isGraph;
  const periodRowClass = isGraph ? 'cb-period-row cb-period-row-graph' : 'cb-period-row';

  const periodNav = (
    <div className={isGraph ? 'cb-period-nav cb-period-nav-compact' : 'cb-period-nav'}>
      <div className="cb-flourish" />
      <div className="cb-chevron hover-chevron" onClick={() => app.shiftPeriod(-1)}>
        ‹
      </div>
      <div className="cb-period-pill">{app.getPeriodLabel()}</div>
      <div className="cb-chevron hover-chevron" onClick={() => app.shiftPeriod(1)}>
        ›
      </div>
      <div className="cb-flourish" />
    </div>
  );

  const ledgerPeriodButton = (direction) => (
    <div
      className={`cb-ledger-period-arrow cb-ledger-period-arrow-${direction < 0 ? 'left' : 'right'} hover-chevron`}
      onClick={() => app.shiftPeriod(direction)}
    >
      <svg className="cb-ledger-period-arrow-icon" width="18" height="30" viewBox="0 0 18 30" aria-hidden="true">
        <path
          d={direction < 0 ? 'M13 4 5 15l8 11' : 'M5 4l8 11-8 11'}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );

  return (
    <div className={`cb-header ${isGraph ? 'cb-header-graph' : ''}`}>
      <div className="cb-gear hover-gear" onClick={app.goSettings}>
        ⚙
      </div>
      {notSettings && (
        <div className="cb-search-btn hover-chevron" onClick={app.toggleSearch}>
          <svg width="15" height="15" viewBox="0 0 15 15">
            <circle cx="6.5" cy="6.5" r="5" fill="none" stroke="#2c2416" strokeWidth="1.6" />
            <line x1="10.3" y1="10.3" x2="14" y2="14" stroke="#2c2416" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
      )}

      <div className="cb-brand">
        <img src={APP_ICON_URL} width="58" height="58" className="cb-brand-icon" alt="Coin Book" />
        <div style={{ textAlign: 'left' }}>
          <div className="cb-brand-title">COIN BOOK</div>
          <div className="cb-brand-sub">{t.subtitle}</div>
        </div>
      </div>

      {isSettings && <div style={{ height: 16 }} />}

      {notSettings && (
        <>
          {v.isSearching && (
            <div style={{ textAlign: 'center', padding: '10px 0 4px' }}>
              <div style={{ fontSize: 11, letterSpacing: 1, color: '#8a7355' }}>
                {v.filtered.length} {v.filtered.length === 1 ? 'result' : 'results'} for "{s.searchQuery}"
              </div>
            </div>
          )}

          {notSearching && (
            <>
              <div className={periodRowClass}>
                {v.periods.map((p) => (
                  <div
                    key={p.id}
                    className="cb-period-tab hover-lift"
                    onClick={p.select}
                    style={{
                      border: p.border,
                      background: p.bg,
                      color: p.fg,
                      boxShadow: p.shadow,
                      transform: p.scale
                    }}
                  >
                    <PeriodIcon id={p.id} />
                    {p.label}
                  </div>
                ))}
              </div>

              {showChartNav && <div className="cb-chart-period-wrap">{periodNav}</div>}

              {showTicket && (
                <div
                  className="cb-total-wrap"
                  onTouchStart={app.handleSwipeStart}
                  onTouchEnd={app.handleSwipeEnd}
                  onMouseDown={app.handleSwipeStart}
                  onMouseUp={app.handleSwipeEnd}
                >
                  {ledgerPeriodButton(-1)}
                  <div className="cb-ticket">
                    <CoinScatter tick={s.coinBurstTick} />
                    <div className="cb-total-label">{t.totalSpent}</div>
                    <div className="cb-total-value">
                      <span className="cb-total-amount">{app.convertAndFormat(s.displayedTotal, s.currency, false)}</span>
                      <CurrencyBadge currency={s.currency} size="md" />
                    </div>
                    <div className="cb-period-pill cb-period-pill-ticket">{app.getPeriodLabel()}</div>
                  </div>
                  {ledgerPeriodButton(1)}
                </div>
              )}
            </>
          )}
        </>
      )}

      <div className="cb-perforation" />
    </div>
  );
}
