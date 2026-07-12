import { coinFace } from '../utils/coin.js';

export function AddSheet({ app, s, v, t }) {
  return (
    <>
      <div
        className="cb-scrim"
        onClick={app.requestCloseAdd}
        style={{ animation: s.sheetClosing ? 'cbFadeIn 0.2s ease-in reverse forwards' : 'cbFadeIn 0.15s ease-out' }}
      />
      <div
        className="cb-sheet"
        style={{ animation: s.sheetClosing ? 'cbSheetDown 0.22s ease-in forwards' : 'cbSheetUp 0.22s ease-out' }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 0' }}>
          <div className="cb-sheet-handle" />
        </div>
        <div style={{ padding: '12px 20px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontFamily: "'Special Elite',monospace", fontSize: 19 }}>
              {s.editingId ? t.editEntry : t.newEntry}
            </div>
            <div className="cb-round-btn hover-delete" onClick={app.requestCloseAdd}>
              ✕
            </div>
          </div>

          <div className="cb-field-label">{t.amount}</div>
          <input
            type="number"
            name="amount"
            inputMode="decimal"
            enterKeyHint="done"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={s.addAmount}
            onChange={app.onAmountInput}
            className="cb-input cb-input-amount"
          />

          <div className="cb-field-label">{t.date}</div>
          <input
            type="date"
            name="date"
            value={s.addDate}
            onChange={app.onDateInput}
            className="cb-input cb-input-date"
          />

          <div className="cb-field-label">{t.category}</div>
          <div className="cb-category-select hover-lift" onClick={app.toggleCategoryPicker}>
            <div
              key={v.selectedCatObj.id}
              className="cb-coin-select-face"
              style={{ background: coinFace(v.selectedCatObj.color) }}
            >
              <div className="cb-coin-select-rim" />
              <span className="cb-coin-select-letter">{v.selectedCatLabel.charAt(0).toUpperCase()}</span>
            </div>
            <div style={{ flex: 1 }}>{v.selectedCatLabel}</div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>{s.categoryPickerOpen ? '\u25b4' : '\u25be'}</div>
          </div>

          {s.categoryPickerOpen && (
            <div className="cb-category-grid">
              {v.categoriesForPicker.map((cat) => (
                <div
                  key={cat.id}
                  className="cb-category-chip hover-lift"
                  onClick={cat.select}
                  style={{ background: cat.chipBg, color: cat.chipFg }}
                >
                  <div className="cb-coin-chip-face" style={{ background: cat.face }}>
                    <div className="cb-coin-chip-rim" />
                    <span className="cb-coin-chip-letter">{cat.initial}</span>
                  </div>
                  {cat.name}
                </div>
              ))}
              <div className="cb-category-chip cb-category-chip-new hover-lift" onClick={app.startNewCategory}>
                {t.newChip}
              </div>
            </div>
          )}

          {s.addingCategory && (
            <div className="cb-new-cat-panel">
              <input
                type="text"
                placeholder={t.newCatPlaceholder}
                value={s.newCatName}
                onChange={app.onNewCatNameInput}
                className="cb-input"
                style={{ marginBottom: 8 }}
              />
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                {v.swatches.map((sw, i) => (
                  <div
                    key={i}
                    className="cb-swatch hover-swatch"
                    onClick={sw.select}
                    style={{ background: sw.hex, border: sw.border }}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div className="cb-btn-solid cb-btn-flex hover-lift" onClick={app.confirmNewCategory}>
                  {t.add}
                </div>
                <div className="cb-btn-outline cb-btn-flex hover-lift" onClick={app.cancelNewCategory}>
                  {t.cancel}
                </div>
              </div>
            </div>
          )}

          <div className="cb-field-label">{t.memo}</div>
          <input
            type="text"
            placeholder={t.memoPlaceholder}
            value={s.addNote}
            onChange={app.onNoteInput}
            className="cb-input cb-input-memo"
          />

          <div className="cb-stamp-btn hover-stamp" onClick={app.submitAdd}>
            {s.editingId ? t.saveChanges : t.stampItIn}
          </div>
        </div>
      </div>
    </>
  );
}
