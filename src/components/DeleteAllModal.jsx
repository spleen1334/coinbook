export function DeleteAllModal({ app, s, t }) {
  return (
    <>
      <div className="cb-scrim" onClick={app.cancelDeleteAll} />
      <div className="cb-modal cb-modal-danger">
        <div className="cb-modal-title">{t.deleteAll}</div>
        <div style={{ fontSize: 12.5, color: '#6b5636', marginBottom: 14, lineHeight: 1.5 }}>{t.deleteAllWarn}</div>
        <input
          type="text"
          placeholder={t.typeYesPlaceholder}
          value={s.deleteAllText}
          onChange={app.onDeleteAllTextInput}
          className="cb-input cb-input-danger"
        />
        <div style={{ display: 'flex', gap: 10 }}>
          <div
            className="cb-modal-btn cb-modal-btn-danger"
            style={{
              opacity: s.deleteAllText === 'Yes' ? 1 : 0.4,
              cursor: s.deleteAllText === 'Yes' ? 'pointer' : 'default'
            }}
            onClick={app.confirmDeleteAll}
          >
            {t.eraseEverything}
          </div>
          <div className="cb-modal-btn cb-modal-btn-outline hover-lift" onClick={app.cancelDeleteAll}>
            {t.cancel}
          </div>
        </div>
      </div>
    </>
  );
}
