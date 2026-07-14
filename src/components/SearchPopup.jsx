export function SearchPopup({ app, s, v }) {
  return (
    <>
      <div className="cb-scrim cb-scrim-invisible" onClick={app.closeSearch} />
      <div className="cb-search-popup">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="text"
            placeholder="Search notes, categories, dates…"
            value={s.searchQuery}
            onChange={app.onSearchInput}
            autoFocus
            className="cb-input cb-input-pill"
          />
          <div className="cb-round-btn hover-delete" onClick={app.closeSearch}>
            ✕
          </div>
        </div>
        {v.isSearching && (
          <div style={{ fontSize: 10.5, letterSpacing: 1, color: '#8a7355', marginTop: 8, paddingLeft: 4 }}>
            {v.filtered.length} {v.filtered.length === 1 ? 'result' : 'results'}
          </div>
        )}
      </div>
    </>
  );
}
