import { MONTHS_BY_LANGUAGE, MONTHS } from '../data/i18n.js';
import { formatShortDate } from '../utils/date.js';

export function DeleteModal({ app, s, v, t }) {
  return (
    <>
      <div className="cb-scrim" onClick={app.cancelDeleteModal} />
      <div className="cb-modal">
        <div className="cb-modal-title">{t.voidPrompt}</div>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
          {v.deleteCat ? app.catLabel(v.deleteCat) : ''} —{' '}
          {v.deleteEntry ? app.convertAndFormat(v.deleteEntry.amount, s.currency) : ''}
        </div>
        <div style={{ fontSize: 12, color: '#8a7355', marginBottom: 18 }}>
          {v.deleteEntry ? formatShortDate(v.deleteEntry.date, s.language, MONTHS_BY_LANGUAGE, MONTHS) : ''}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="cb-modal-btn cb-modal-btn-danger hover-lift" onClick={app.confirmDeleteModal}>
            {t.yes}
          </div>
          <div className="cb-modal-btn cb-modal-btn-outline hover-lift" onClick={app.cancelDeleteModal}>
            {t.no}
          </div>
        </div>
      </div>
    </>
  );
}
