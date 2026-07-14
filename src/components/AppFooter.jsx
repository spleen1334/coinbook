export function AppFooter({ app, s, t }) {
  const isHome = s.screen === 'home';
  const isGraph = s.screen === 'graph';

  return (
    <div className="cb-footer">
      <div
        className="cb-nav-btn hover-nav press-96"
        onClick={app.goHome}
        style={{ color: isHome ? '#b5432e' : '#8a7355' }}
      >
        <div
          className="cb-nav-icon-wrap"
          style={{
            background: isHome ? 'rgba(181,67,46,0.14)' : 'transparent',
            transform: isHome ? 'scale(1.08)' : 'scale(1)'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16">
            <rect x="1" y="2" width="14" height="2" rx="1" fill="currentColor" />
            <rect x="1" y="7" width="14" height="2" rx="1" fill="currentColor" />
            <rect x="1" y="12" width="9" height="2" rx="1" fill="currentColor" />
          </svg>
        </div>
        <div className="cb-nav-label">{t.navLedger}</div>
      </div>
      <div className="cb-fab hover-fab press-fab" onClick={app.openAdd}>
        +
      </div>
      <div
        className="cb-nav-btn hover-nav press-96"
        onClick={app.goGraph}
        style={{ color: isGraph ? '#b5432e' : '#8a7355' }}
      >
        <div
          className="cb-nav-icon-wrap"
          style={{
            background: isGraph ? 'rgba(181,67,46,0.14)' : 'transparent',
            transform: isGraph ? 'scale(1.08)' : 'scale(1)'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="6.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
            <path d="M8 8 L8 1.4 A6.6 6.6 0 0 1 13.7 11 Z" fill="currentColor" />
          </svg>
        </div>
        <div className="cb-nav-label">{t.navChart}</div>
      </div>
    </div>
  );
}
