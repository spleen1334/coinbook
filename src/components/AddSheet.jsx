import { coinFace } from '../utils/coin.js';

export function AddSheet({
  t,
  isEditing,
  isClosing,
  amount,
  onAmountChange,
  date,
  onDateChange,
  selectedCategoryColor,
  selectedCategoryLabel,
  categoryPickerOpen,
  onToggleCategoryPicker,
  categoryPickerQuery,
  onCategoryPickerQueryChange,
  categoriesForPicker,
  addingCategory,
  onStartNewCategory,
  newCatName,
  onNewCatNameChange,
  swatches,
  onConfirmNewCategory,
  onCancelNewCategory,
  note,
  onNoteChange,
  noteSuggestions,
  onSelectNoteSuggestion,
  onClose,
  onSubmit
}) {
  return (
    <>
      <div
        className="cb-scrim"
        onClick={onClose}
        style={{ animation: isClosing ? 'cbFadeIn 0.2s ease-in reverse forwards' : 'cbFadeIn 0.15s ease-out' }}
      />
      <div
        className="cb-sheet"
        style={{ animation: isClosing ? 'cbSheetDown 0.22s ease-in forwards' : 'cbSheetUp 0.22s ease-out' }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 0' }}>
          <div className="cb-sheet-handle" />
        </div>
        <div style={{ padding: '12px 20px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontFamily: "'Special Elite',monospace", fontSize: 19 }}>
              {isEditing ? t.editEntry : t.newEntry}
            </div>
            <div className="cb-round-btn hover-delete" onClick={onClose}>
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
            value={amount}
            onChange={onAmountChange}
            className="cb-input cb-input-amount"
          />

          <div className="cb-field-label">{t.date}</div>
          <input type="date" name="date" value={date} onChange={onDateChange} className="cb-input cb-input-date" />

          <div className="cb-field-label">{t.category}</div>
          <div className="cb-category-select hover-lift" onClick={onToggleCategoryPicker}>
            <div className="cb-coin-select-face" style={{ background: coinFace(selectedCategoryColor) }}>
              <div className="cb-coin-select-rim" />
              <span className="cb-coin-select-letter">{selectedCategoryLabel.charAt(0).toUpperCase()}</span>
            </div>
            <div style={{ flex: 1 }}>{selectedCategoryLabel}</div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>{categoryPickerOpen ? '▴' : '▾'}</div>
          </div>

          {categoryPickerOpen && (
            <>
              <div className="cb-category-search-wrap">
                <span aria-hidden="true">⌕</span>
                <input
                  type="search"
                  value={categoryPickerQuery}
                  onChange={onCategoryPickerQueryChange}
                  placeholder="Search categories…"
                  aria-label="Search categories"
                  className="cb-category-search"
                />
              </div>
              <div className="cb-category-grid">
                {categoriesForPicker.map((cat) => (
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
                <div className="cb-category-chip cb-category-chip-new hover-lift" onClick={onStartNewCategory}>
                  {t.newChip}
                </div>
              </div>
            </>
          )}

          {addingCategory && (
            <div className="cb-new-cat-panel">
              <input
                type="text"
                placeholder={t.newCatPlaceholder}
                value={newCatName}
                onChange={onNewCatNameChange}
                className="cb-input"
                style={{ marginBottom: 8 }}
              />
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                {swatches.map((sw, i) => (
                  <div
                    key={i}
                    className="cb-swatch hover-swatch"
                    onClick={sw.select}
                    style={{ background: sw.hex, border: sw.border }}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div className="cb-btn-solid cb-btn-flex hover-lift" onClick={onConfirmNewCategory}>
                  {t.add}
                </div>
                <div className="cb-btn-outline cb-btn-flex hover-lift" onClick={onCancelNewCategory}>
                  {t.cancel}
                </div>
              </div>
            </div>
          )}

          <div className="cb-field-label">{t.memo}</div>
          <div className="cb-memo-wrap">
            <input
              type="text"
              placeholder={t.memoPlaceholder}
              value={note}
              onChange={onNoteChange}
              className="cb-input cb-input-memo"
              aria-autocomplete="list"
              aria-controls={noteSuggestions.length ? 'cb-note-suggestions' : undefined}
            />
            {noteSuggestions.length > 0 && (
              <div id="cb-note-suggestions" className="cb-note-suggestions" role="listbox" aria-label="Previous notes">
                {noteSuggestions.map((suggestion) => (
                  <button
                    type="button"
                    role="option"
                    aria-selected="false"
                    key={suggestion}
                    className="cb-note-suggestion"
                    onClick={() => onSelectNoteSuggestion(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="cb-stamp-btn hover-stamp" onClick={onSubmit}>
            <svg className="cb-stamp-icon" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path d="M4 3.5h10v4H4zM6 7.5h6v3H6z" fill="none" stroke="currentColor" strokeWidth="1.4" />
              <path
                d="M3 10.5h12v3H3zM5 13.5h8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
            <span>{isEditing ? t.saveChanges : t.stampItIn}</span>
          </div>
        </div>
      </div>
    </>
  );
}
