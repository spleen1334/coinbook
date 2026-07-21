import { UI_TEXT, MONTHS_BY_LANGUAGE, MONTHS } from '../data/i18n.js';
import { CATEGORY_SWATCHES } from '../data/categories.js';
import { formatShortDate } from '../utils/date.js';
import { formatNumber } from '../utils/money.js';
import { coinFace } from '../utils/coin.js';

const CIRC = 2 * Math.PI * 38;
const INK = '#2c2416';
const ACCENT = '#b5432e';
const PAPER_FG = '#f4ecd8';

function buildAccentToggle(options, activeId, selectFn, { activeBorderWidth, activeShadowWidth, includeScale }) {
  return options.map((o) => {
    const active = activeId === o.id;
    const base = {
      ...o,
      select: selectFn(o.id),
      bg: active ? ACCENT : '#f4ecd8',
      fg: active ? PAPER_FG : '#8a7355',
      border: active ? `${activeBorderWidth}px solid #7a2a1c` : '1.5px solid rgba(44,36,22,0.25)',
      shadow: active ? `0 ${activeShadowWidth}px 0 #7a2a1c` : '0 1px 0 rgba(44,36,22,0.1)'
    };
    return includeScale ? { ...base, scale: active ? 'scale(1.03)' : 'scale(1)' } : base;
  });
}

function buildPillToggle(options, activeId, selectFn) {
  return options.map((o) => ({
    ...o,
    select: selectFn(o.id),
    bg: activeId === o.id ? INK : 'transparent',
    fg: activeId === o.id ? PAPER_FG : INK
  }));
}

function mkRow(app, r, catById, lang, cur) {
  const cat = catById[r.categoryId] || { id: 'other', name: 'Other', color: '#888' };
  const label = app.catLabel(cat);
  const isHovered = app.state.hoverCatId === cat.id;
  const isSwiping = app.state.swipingRowId === r.id;
  const offset = isSwiping ? app.state.swipeRowOffset : 0;
  return {
    id: r.id,
    catName: label,
    catInitial: label.charAt(0).toUpperCase(),
    catFace: coinFace(cat.color),
    note: r.note,
    hasNote: !!r.note,
    amountStr: app.convertAndFormat(r.amount, cur),
    amountParts: app.convertAndFormatParts(r.amount, cur),
    dateShort: formatShortDate(r.date, lang, MONTHS_BY_LANGUAGE, MONTHS),
    stampAnim: r.id === app.state.lastAddedId ? 'cbStampIn 0.35s ease-out' : 'none',
    requestDelete: (e) => {
      if (e && e.stopPropagation) e.stopPropagation();
      app.requestDelete(r.id);
    },
    requestEdit: () => app.requestEditEntry(r),
    swipeStart: (e) => app.rowSwipeStart(r.id, e),
    swipeMove: (e) => app.rowSwipeMove(r.id, e),
    swipeEnd: () => app.rowSwipeEnd(r.id),
    rowBg: isHovered ? 'rgba(181,67,46,0.12)' : '#f4ecd8',
    rowTransform: 'translateX(' + offset + 'px)' + (isHovered && !isSwiping ? ' scale(1.02)' : ''),
    rowTransition: isSwiping ? 'none' : 'transform 0.25s cubic-bezier(.34,1.56,.64,1), background 0.15s ease'
  };
}

function buildGroupedList(app, filtered, catById, lang, cur) {
  const sortByDate = (rows, dir = 'desc') =>
    rows.slice().sort((a, b) => (dir === 'asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)));
  const sortByAmount = (rows, dir = 'desc') =>
    rows
      .slice()
      .sort((a, b) =>
        dir === 'asc'
          ? a.amount - b.amount || a.date.localeCompare(b.date)
          : b.amount - a.amount || b.date.localeCompare(a.date)
      );

  const grouping = app.state.listGrouping;
  if (grouping === 'category') {
    const byCat = new Map();
    sortByAmount(filtered, app.state.categorySortDir).forEach((e) => {
      if (!byCat.has(e.categoryId)) byCat.set(e.categoryId, []);
      byCat.get(e.categoryId).push(e);
    });
    return Array.from(byCat.entries())
      .map(([catId, rows]) => {
        const cat = catById[catId] || { id: 'other', name: 'Other' };
        const sum = rows.reduce((s, r) => s + r.amount, 0);
        return {
          key: catId,
          dateLabel: app.catLabel(cat),
          totalStr: app.convertAndFormat(sum, cur),
          totalParts: app.convertAndFormatParts(sum, cur),
          showHeader: true,
          sortKey: sum,
          rows: rows.map((r) => ({ ...mkRow(app, r, catById, lang, cur), showDateInline: true }))
        };
      })
      .sort((a, b) => (app.state.categorySortDir === 'asc' ? a.sortKey - b.sortKey : b.sortKey - a.sortKey));
  }

  if (grouping === 'none') {
    return filtered.length
      ? [
          {
            key: 'all',
            dateLabel: '',
            showHeader: false,
            rows: sortByAmount(filtered, app.state.ungroupedSortDir).map((r) => ({
              ...mkRow(app, r, catById, lang, cur),
              showDateInline: true
            }))
          }
        ]
      : [];
  }

  const byDate = new Map();
  sortByDate(filtered, app.state.dateSortDir).forEach((e) => {
    if (!byDate.has(e.date)) byDate.set(e.date, []);
    byDate.get(e.date).push(e);
  });
  return Array.from(byDate.entries()).map(([date, rows]) => ({
    key: date,
    dateLabel: formatShortDate(date, lang, MONTHS_BY_LANGUAGE, MONTHS),
    showHeader: true,
    rows: rows.map((r) => ({ ...mkRow(app, r, catById, lang, cur), showDateInline: false }))
  }));
}

function buildPieSegments(app, filtered, catById, cur) {
  const catTotals = new Map();
  filtered.forEach((e) => {
    catTotals.set(e.categoryId, (catTotals.get(e.categoryId) || 0) + e.amount);
  });
  const catArr = Array.from(catTotals.entries())
    .map(([id, amt]) => ({ id, amt, cat: catById[id] || { id: 'other', name: 'Other', color: '#888' } }))
    .sort((a, b) => b.amt - a.amt);
  const total = filtered.reduce((s, e) => s + e.amount, 0);
  const hoverCatId = app.state.hoverCatId;

  let cum = 0;
  const pieSegments = catArr.map((c, idx) => {
    const pct = total > 0 ? (c.amt / total) * 100 : 0;
    const segLen = (pct / 100) * CIRC;
    const label = app.catLabel(c.cat);
    const isHovered = hoverCatId === c.id;
    const isDimmed = !!hoverCatId && !isHovered;
    const seg = {
      id: c.id,
      name: label,
      initial: label.charAt(0).toUpperCase(),
      face: coinFace(isDimmed ? '#c9b98f' : c.cat.color),
      amountStr: app.convertAndFormat(c.amt, cur),
      amountParts: app.convertAndFormatParts(c.amt, cur),
      pctStr: Math.round(pct) + '%',
      dasharray: segLen.toFixed(2) + ' ' + (CIRC - segLen).toFixed(2),
      dashoffset: (-cum).toFixed(2),
      strokeWidth: isHovered ? 23 : 19,
      strokeColor: isDimmed ? '#c9b98f' : c.cat.color,
      opacity: isDimmed ? 0.55 : 1,
      delayMs: idx * 70,
      legendBg: isHovered ? 'rgba(181,67,46,0.12)' : 'transparent',
      legendOpacity: isDimmed ? 0.45 : 1,
      onEnter: () => app.setHoverCat(c.id),
      onLeave: () => app.clearHoverCat()
    };
    cum += segLen;
    return seg;
  });

  const hoverCat = hoverCatId ? catArr.find((c) => c.id === hoverCatId) : null;
  return { pieSegments, hoverCat, total };
}

function buildCategoryPicker(app, catById) {
  const categoriesForPicker = app.state.categories.map((c) => {
    const selected = app.state.addCategoryId === c.id;
    const label = app.catLabel(c);
    return {
      id: c.id,
      name: label,
      initial: label.charAt(0).toUpperCase(),
      face: coinFace(c.color),
      select: () => app.setState({ addCategoryId: c.id, categoryPickerOpen: false }),
      chipBg: selected ? INK : 'transparent',
      chipFg: selected ? PAPER_FG : INK
    };
  });
  const selectedCatObj = catById[app.state.addCategoryId] || { id: 'unsure', name: "I don't know", color: '#888' };
  const selectedCatLabel = app.catLabel(selectedCatObj);
  const swatches = CATEGORY_SWATCHES.map((hex, i) => ({
    hex,
    select: () => app.setState({ newCatColor: i }),
    border: app.state.newCatColor === i ? '3px solid ' + INK : '1px solid rgba(0,0,0,0.2)'
  }));
  return { categoriesForPicker, selectedCatObj, selectedCatLabel, swatches };
}

function buildSettingsOptions(app, t) {
  const numberFormat = app.state.numberFormat;
  const thousandsToggle = buildPillToggle(
    [
      { id: true, label: t.on },
      { id: false, label: t.off }
    ],
    numberFormat.thousands,
    (id) => () => app.setNumberFormat({ thousands: id })
  );
  const thousandsCharOptions = buildPillToggle(
    [
      { id: ',', label: ',' },
      { id: '.', label: '.' }
    ],
    numberFormat.thousandsChar,
    (id) => () => app.setNumberFormat({ thousandsChar: id })
  );
  const decimalsOptions = buildPillToggle(
    [
      { id: 0, label: '0' },
      { id: 2, label: '2' }
    ],
    numberFormat.decimals,
    (id) => () => app.setNumberFormat({ decimals: id })
  );
  const decimalCharOptions = buildPillToggle(
    [
      { id: '.', label: '.' },
      { id: ',', label: ',' }
    ],
    numberFormat.decimalChar,
    (id) => () => app.setNumberFormat({ decimalChar: id })
  );
  const numberFormatPreview = formatNumber(1234.5, numberFormat);
  return {
    numberFormat,
    thousandsToggle,
    thousandsCharOptions,
    decimalsOptions,
    decimalCharOptions,
    numberFormatPreview
  };
}

export function buildViewData(app) {
  const lang = app.state.language;
  const cur = app.state.currency;
  const t = UI_TEXT[lang] || UI_TEXT.en;
  const catById = Object.create(null);
  app.state.categories.forEach((c) => {
    catById[c.id] = c;
  });

  const query = (app.state.searchQuery || '').trim().toLowerCase();
  const isSearching = query.length > 0;
  const filtered = app.getFilteredExpenses();
  const hasEntries = filtered.length > 0;

  const groupedList = buildGroupedList(app, filtered, catById, lang, cur);
  const { pieSegments, hoverCat, total } = buildPieSegments(app, filtered, catById, cur);
  const donutCenterLabel = hoverCat ? app.catLabel(hoverCat.cat) : t.totalSpent;
  const donutCenterValue = hoverCat
    ? app.convertAndFormat(hoverCat.amt, cur, false)
    : app.convertAndFormat(total, cur, false);
  const donutCenterCurrency = cur;

  const periods = buildAccentToggle(
    [
      { id: 'day', label: t.periodDay },
      { id: 'week', label: t.periodWeek },
      { id: 'month', label: t.periodMonth },
      { id: 'year', label: t.periodYear }
    ],
    app.state.period,
    (id) => () => app.selectPeriod(id),
    { activeBorderWidth: 2.5, activeShadowWidth: 3, includeScale: true }
  );

  const groupingSortMark = (id) => {
    if (id === 'date') return app.state.dateSortDir === 'desc' ? ' ↓' : ' ↑';
    if (id === 'category') return app.state.categorySortDir === 'desc' ? ' ↓' : ' ↑';
    return app.state.ungroupedSortDir === 'desc' ? ' ↓' : ' ↑';
  };
  const groupingOptionsBase = [
    { id: 'date', label: 'DATE' },
    { id: 'category', label: 'CATEGORY' },
    { id: 'none', label: 'UNGROUPED' }
  ].map((o) => ({ ...o, label: o.label + (app.state.listGrouping === o.id ? groupingSortMark(o.id) : '') }));
  const groupingOptions = buildAccentToggle(
    groupingOptionsBase,
    app.state.listGrouping,
    (id) => () => app.setListGrouping(id),
    { activeBorderWidth: 2, activeShadowWidth: 2, includeScale: false }
  );

  const { categoriesForPicker, selectedCatObj, selectedCatLabel, swatches } = buildCategoryPicker(app, catById);

  const languageOptions = buildPillToggle(
    [
      { id: 'en', label: 'EN' },
      { id: 'sr', label: 'СР' },
      { id: 'ru', label: 'РУ' }
    ],
    lang,
    (id) => () => app.setLanguage(id)
  );

  const currencyOptions = buildPillToggle(
    [
      { id: 'RSD', label: 'RSD' },
      { id: 'EUR', label: '€ EUR' },
      { id: 'USD', label: '$ USD' },
      { id: 'RUB', label: '₽ RUB' },
      { id: 'CNY', label: '¥ CNY' }
    ],
    cur,
    (id) => () => app.setCurrency(id)
  );

  const deleteModalId = app.state.deleteModalId;
  const deleteEntry = deleteModalId ? app.state.expenses.find((e) => e.id === deleteModalId) : null;
  const deleteCat = deleteEntry ? catById[deleteEntry.categoryId] || { id: 'other', name: 'Other' } : null;

  const settingsOptions = buildSettingsOptions(app, t);
  const rateOptions = ['USD', 'EUR', 'RUB', 'CNY'].map((code) => ({
    code,
    value: Object.prototype.hasOwnProperty.call(app.state.rateInputs || {}, code)
      ? app.state.rateInputs[code]
      : (1 / app.state.rates[code]).toFixed(2),
    rsdPerUnit: 1 / app.state.rates[code],
    onChange: (e) => app.setRate(code, e),
    onBlur: () => app.finishRateEditing(code)
  }));

  return {
    lang,
    cur,
    t,
    catById,
    isSearching,
    filtered,
    hasEntries,
    groupedList,
    pieSegments,
    periods,
    groupingOptions,
    donutCenterLabel,
    donutCenterValue,
    donutCenterCurrency,
    categoriesForPicker,
    selectedCatObj,
    selectedCatLabel,
    swatches,
    languageOptions,
    currencyOptions,
    deleteEntry,
    deleteCat,
    ...settingsOptions,
    rateOptions,
    contentAnim:
      app.state.lastAction === 'toHome'
        ? 'cbLedgerIn 0.55s cubic-bezier(.22,1,.36,1)'
        : app.state.lastAction === 'toGraph'
          ? 'cbChartIn 0.5s cubic-bezier(.22,1,.36,1)'
          : app.state.swipeDir > 0
            ? 'cbSlideInLeft 0.42s cubic-bezier(.2,.8,.3,1)'
            : app.state.swipeDir < 0
              ? 'cbSlideInRight 0.42s cubic-bezier(.2,.8,.3,1)'
              : 'cbFadeSlide 0.38s cubic-bezier(.2,.8,.3,1)'
  };
}
