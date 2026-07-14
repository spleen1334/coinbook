import { APP_ICON_URL } from '../utils/appIcon.js';

export function Splash({ fadingOut = false }) {
  return (
    <div className="cb-splash" style={{ opacity: fadingOut ? 0 : 1 }}>
      <div className="cb-splash-badge">
        <div className="cb-splash-ring" />
        <img src={APP_ICON_URL} width="88" height="88" className="cb-splash-icon" alt="" />
        <div className="cb-splash-coins" aria-hidden="true">
          <span className="cb-splash-coin cb-splash-coin-a" />
          <span className="cb-splash-coin cb-splash-coin-b" />
          <span className="cb-splash-coin cb-splash-coin-c" />
        </div>
      </div>
      <div className="cb-splash-title">COIN BOOK</div>
      <div className="cb-splash-sub">— EXPENSE LEDGER —</div>
    </div>
  );
}
