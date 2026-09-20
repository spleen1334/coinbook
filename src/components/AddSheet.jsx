import { Fragment, useEffect, useRef, useState } from 'react';
import { coinFace, hashCatColor } from '../utils/coin.js';
import { scrollDeltaToReveal, visibleAreaForControl } from '../utils/focusVisibility.js';

export function AddSheet({
  t,
  isEditing,
  isClosing,
  currency,
  amount,
  onAmountChange,
  date,
  onDateChange,
  recurring,
  recurrenceFrequency,
  recurrenceEnd,
  recurrenceInvalid,
  onToggleRecurring,
  onRecurrenceFrequencyChange,
  onRecurrenceEndChange,
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
  onConfirmNewCategory,
  onCancelNewCategory,
  note,
  onNoteChange,
  noteSuggestions,
  onSelectNoteSuggestion,
  onClose,
  onSubmit
}) {
  const currencyMark = { USD: '$', EUR: '€', RSD: 'RSD', RUB: '₽', CNY: '¥' }[currency] || currency;
  const trimmedNewCatName = (newCatName || '').trim();
  const newCatPreviewColor = trimmedNewCatName ? hashCatColor(trimmedNewCatName) : '#c9b98f';
  const newCatPreviewInitial = trimmedNewCatName ? trimmedNewCatName.charAt(0).toUpperCase() : '?';
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMemoFocused, setIsMemoFocused] = useState(false);
  const [viewportMetrics, setViewportMetrics] = useState(null);
  const sheetRef = useRef(null);
  const amountRef = useRef(null);
  const dateRef = useRef(null);
  const actionsRef = useRef(null);
  const visibilityFrameRef = useRef(null);
  const memoFocusRef = useRef(false);

  const keepFocusedFieldVisible = () => {
    if (visibilityFrameRef.current) window.cancelAnimationFrame(visibilityFrameRef.current);

    visibilityFrameRef.current = window.requestAnimationFrame(() => {
      visibilityFrameRef.current = window.requestAnimationFrame(() => {
        const sheet = sheetRef.current;
        const target = document.activeElement;
        if (!sheet || !(target instanceof HTMLElement) || !sheet.contains(target)) return;

        const sheetRect = sheet.getBoundingClientRect();
        const actionsRect = memoFocusRef.current ? null : actionsRef.current?.getBoundingClientRect();
        const visibleArea = visibleAreaForControl(sheetRect, actionsRect);
        if (visibleArea.bottom <= visibleArea.top) return;

        const delta = scrollDeltaToReveal(target.getBoundingClientRect(), visibleArea);
        if (delta) sheet.scrollBy({ top: delta, behavior: 'auto' });
      });
    });
  };

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return undefined;

    const updateViewportMetrics = () => {
      const shell = sheetRef.current?.closest('.cb-phone');
      if (!shell) return;

      const shellRect = shell.getBoundingClientRect();
      const shellFillsViewport = Math.abs(shellRect.left) <= 1 && shellRect.width >= window.innerWidth - 1;
      if (!shellFillsViewport) {
        setViewportMetrics(null);
        return;
      }

      const height = Math.round(viewport.height);
      const offsetTop = Math.round(viewport.offsetTop);
      const viewportBottom = offsetTop + height;
      const bottomOffset = Math.max(0, Math.round(shellRect.bottom - viewportBottom));
      setViewportMetrics({ height, bottomOffset });
      keepFocusedFieldVisible();
    };
    updateViewportMetrics();
    window.addEventListener('resize', updateViewportMetrics);
    viewport.addEventListener('resize', updateViewportMetrics);
    viewport.addEventListener('scroll', updateViewportMetrics);
    return () => {
      window.removeEventListener('resize', updateViewportMetrics);
      viewport.removeEventListener('resize', updateViewportMetrics);
      viewport.removeEventListener('scroll', updateViewportMetrics);
    };
  }, []);

  useEffect(() => {
    keepFocusedFieldVisible();
  }, [categoryPickerOpen, addingCategory, noteSuggestions.length, isExpanded, isMemoFocused]);

  useEffect(
    () => () => {
      if (visibilityFrameRef.current) window.cancelAnimationFrame(visibilityFrameRef.current);
    },
    []
  );

  const focusNext = (event, nextRef) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    nextRef.current?.focus();
  };
  const preventExpenseSubmit = (event) => {
    if (event.key === 'Enter') event.preventDefault();
  };
  const setMemoEditing = (memoFocused) => {
    memoFocusRef.current = memoFocused;
    setIsMemoFocused(memoFocused);
  };
  const focusOtherField = () => {
    setMemoEditing(false);
    keepFocusedFieldVisible();
  };
  const focusMemo = () => {
    setMemoEditing(true);
    keepFocusedFieldVisible();
  };
  const sheetClassName = `cb-sheet${viewportMetrics ? ' cb-sheet-viewport' : ''}${
    isExpanded ? ' cb-sheet-expanded' : ''
  }`;

  return (
    <>
      <div
        className="cb-scrim"
        onClick={onClose}
        style={{ animation: isClosing ? 'cbFadeIn 0.2s ease-in reverse forwards' : 'cbFadeIn 0.15s ease-out' }}
      />
      <div
        ref={sheetRef}
        className={sheetClassName}
        style={{
          animation: isClosing ? 'cbSheetDown 0.22s ease-in forwards' : 'cbSheetUp 0.22s ease-out',
          '--cb-visual-viewport-height': viewportMetrics ? `${viewportMetrics.height}px` : undefined,
          '--cb-visual-viewport-bottom': viewportMetrics ? `${viewportMetrics.bottomOffset}px` : undefined
        }}
      >
        {viewportMetrics ? (
          <button
            type="button"
            className="cb-sheet-handle-btn"
            onClick={() => setIsExpanded((expanded) => !expanded)}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? t.collapseSheet : t.expandSheet}
            title={isExpanded ? t.collapseSheet : t.expandSheet}
          >
            <span className="cb-sheet-handle" />
            <span className="cb-sheet-handle-label">{isExpanded ? t.collapseSheet : t.expandSheet}</span>
          </button>
        ) : (
          <div className="cb-sheet-handle-btn" aria-hidden="true">
            <span className="cb-sheet-handle" />
          </div>
        )}
        <form
          className="cb-sheet-form"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <div className="cb-sheet-body">
            <div className="cb-sheet-heading">
              <div className="cb-sheet-title">{isEditing ? t.editEntry : t.newEntry}</div>
              <button type="button" className="cb-round-btn hover-delete" onClick={onClose} aria-label={t.close}>
                ✕
              </button>
            </div>

            <div className="cb-field-label">{t.amount}</div>
            <div className="cb-amount-input-wrap">
              <input
                ref={amountRef}
                type="number"
                name="amount"
                inputMode="decimal"
                enterKeyHint="next"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={onAmountChange}
                onFocus={focusOtherField}
                onKeyDown={(event) => focusNext(event, dateRef)}
                className="cb-input cb-input-amount"
              />
              <span className="cb-amount-currency" aria-label={currency} role="img" title={currency}>
                {currencyMark}
              </span>
            </div>

            <div className="cb-date-recurrence-row">
              <div className="cb-date-field">
                <div className="cb-field-label">{recurring ? t.startDate : t.date}</div>
                <input
                  ref={dateRef}
                  type="date"
                  name="date"
                  value={date}
                  onChange={onDateChange}
                  onFocus={focusOtherField}
                  className="cb-input cb-input-date"
                />
              </div>

              {!isEditing && (
                <div className="cb-recurrence-panel">
                  <button
                    type="button"
                    className={`cb-recurrence-toggle${recurring ? ' cb-recurrence-toggle-active' : ''}`}
                    onClick={onToggleRecurring}
                    onFocus={focusOtherField}
                    aria-pressed={recurring}
                    aria-label={t.recurringPayment}
                    title={t.recurringPayment}
                  >
                    <img
                      className="cb-recurrence-toggle-icon"
                      src={`${import.meta.env.BASE_URL}icons/recurring-payment.png`}
                      alt=""
                      aria-hidden="true"
                      draggable="false"
                    />
                  </button>
                </div>
              )}
            </div>

            {!isEditing && recurring && (
              <div className="cb-recurrence-options">
                <div className="cb-field-label">{t.frequency}</div>
                <div className="cb-recurrence-frequency" role="group" aria-label={t.frequency}>
                  {['weekly', 'monthly', 'yearly'].map((frequency) => (
                    <button
                      key={frequency}
                      type="button"
                      className={`cb-recurrence-frequency-option${
                        recurrenceFrequency === frequency ? ' cb-recurrence-frequency-option-active' : ''
                      }`}
                      onClick={() => onRecurrenceFrequencyChange(frequency)}
                      aria-pressed={recurrenceFrequency === frequency}
                    >
                      {t[frequency]}
                    </button>
                  ))}
                </div>
                <div className="cb-field-label">{t.endDate}</div>
                <input
                  type="date"
                  name="recurrence-end"
                  value={recurrenceEnd}
                  min={date}
                  onChange={onRecurrenceEndChange}
                  onFocus={focusOtherField}
                  className="cb-input cb-input-date"
                  aria-invalid={recurrenceInvalid}
                />
                {recurrenceInvalid && <div className="cb-field-error">{t.recurrenceDateError}</div>}
              </div>
            )}

            <div className="cb-field-label">{t.category}</div>
            <button
              type="button"
              className="cb-category-select hover-lift"
              onClick={onToggleCategoryPicker}
              onFocus={focusOtherField}
            >
              <div className="cb-coin-select-face" style={{ background: coinFace(selectedCategoryColor) }}>
                <div className="cb-coin-select-rim" />
                <span className="cb-coin-select-letter">{selectedCategoryLabel.charAt(0).toUpperCase()}</span>
              </div>
              <div style={{ flex: 1 }}>{selectedCategoryLabel}</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>{categoryPickerOpen ? '▴' : '▾'}</div>
            </button>

            {categoryPickerOpen && (
              <>
                <div className="cb-category-search-wrap">
                  <span aria-hidden="true">⌕</span>
                  <input
                    type="search"
                    value={categoryPickerQuery}
                    onChange={onCategoryPickerQueryChange}
                    onFocus={focusOtherField}
                    onKeyDown={preventExpenseSubmit}
                    placeholder="Search categories…"
                    aria-label="Search categories"
                    className="cb-category-search"
                  />
                </div>
                <div className="cb-category-grid">
                  {categoriesForPicker.map((cat, i) => {
                    const startsRest = i > 0 && categoriesForPicker[i - 1].favorite && !cat.favorite;
                    return (
                      <Fragment key={cat.id}>
                        {startsRest && <span className="cb-category-group-break" aria-hidden="true" />}
                        <span className="cb-category-chip-wrap">
                          <button
                            type="button"
                            className="cb-category-chip hover-lift"
                            onClick={cat.select}
                            style={{ background: cat.chipBg, color: cat.chipFg }}
                          >
                            <div className="cb-coin-chip-face" style={{ background: cat.face }}>
                              <div className="cb-coin-chip-rim" />
                              <span className="cb-coin-chip-letter">{cat.initial}</span>
                            </div>
                            {cat.name}
                          </button>
                          <button
                            type="button"
                            className="cb-category-star"
                            onClick={cat.toggleFavorite}
                            aria-pressed={cat.favorite}
                            aria-label={cat.favorite ? t.unfavoriteCategory : t.favoriteCategory}
                            title={cat.favorite ? t.unfavoriteCategory : t.favoriteCategory}
                          >
                            {cat.favorite ? '★' : '☆'}
                          </button>
                        </span>
                      </Fragment>
                    );
                  })}
                  <span className="cb-category-group-break cb-category-new-break" aria-hidden="true" />
                  <button
                    type="button"
                    className="cb-category-chip cb-category-chip-new hover-lift"
                    onClick={onStartNewCategory}
                  >
                    {t.newChip}
                  </button>
                </div>
              </>
            )}

            {addingCategory && (
              <div className="cb-new-cat-panel">
                <div className="cb-new-cat-input-row">
                  <div className="cb-new-cat-coin" style={{ background: coinFace(newCatPreviewColor) }}>
                    <div className="cb-new-cat-coin-rim" />
                    <span className="cb-new-cat-coin-letter">{newCatPreviewInitial}</span>
                  </div>
                  <input
                    type="text"
                    placeholder={t.newCatPlaceholder}
                    value={newCatName}
                    onChange={onNewCatNameChange}
                    onFocus={focusOtherField}
                    onKeyDown={preventExpenseSubmit}
                    className="cb-input"
                  />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="cb-btn-solid cb-btn-flex hover-lift" onClick={onConfirmNewCategory}>
                    {t.add}
                  </button>
                  <button type="button" className="cb-btn-outline cb-btn-flex hover-lift" onClick={onCancelNewCategory}>
                    {t.cancel}
                  </button>
                </div>
              </div>
            )}

            <div className="cb-field-label">{t.memo}</div>
            <div className="cb-memo-wrap">
              <input
                type="text"
                enterKeyHint="done"
                placeholder={t.memoPlaceholder}
                value={note}
                onChange={onNoteChange}
                onFocus={focusMemo}
                onBlur={() => setMemoEditing(false)}
                className="cb-input cb-input-memo"
                aria-autocomplete="list"
                aria-controls={noteSuggestions.length ? 'cb-note-suggestions' : undefined}
              />
              {noteSuggestions.length > 0 && (
                <div
                  id="cb-note-suggestions"
                  className="cb-note-suggestions"
                  role="listbox"
                  aria-label="Previous notes"
                >
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
          </div>

          <div ref={actionsRef} className={`cb-sheet-actions${isMemoFocused ? ' cb-sheet-actions-memo-editing' : ''}`}>
            <button type="submit" className="cb-stamp-btn hover-stamp" disabled={recurrenceInvalid}>
              <img
                className="cb-stamp-icon"
                src={`${import.meta.env.BASE_URL}icons/stamp-expense.png`}
                alt=""
                aria-hidden="true"
                draggable="false"
              />
              <span>{isEditing ? t.saveChanges : t.stampItIn}</span>
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
