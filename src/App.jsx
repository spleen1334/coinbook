import React from 'react';
import { CAT_DEFS, SWATCHES, SEED, MONTHS, MONTHS_BY_LANG, CAT_NAMES_BY_LANG, I18N } from './data.js';
import {
  pad,
  isoOf,
  defaultCatColor,
  coinFace,
  formatNum,
  fmtMoney,
  fmtShort,
  downloadFile,
  csvEscape,
  fuzzyMatch,
  parseCsv
} from './utils.js';

const STORAGE_KEY = 'coinbook_v1_state';
const TODAY = new Date();
const CIRC = 2 * Math.PI * 38;
const APP_BASE_URL = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');
const APP_ICON_URL = `${APP_BASE_URL}icons/icon.png`;

function buildSeedExpenses() {
  return SEED.map((s, i) => {
    const [amount, dayOffset, categoryId, note] = s;
    const d = new Date(TODAY);
    d.setDate(d.getDate() + dayOffset);
    return { id: 'e' + i, amount, date: isoOf(d), categoryId, note };
  });
}

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      period: 'month',
      periodOffset: 0,
      screen: 'home',
      language: 'en',
      currency: 'USD',
      rates: { USD: 1, EUR: 0.92, RSD: 108.5 },
      numberFormat: { thousands: true, thousandsChar: ',', decimals: 2, decimalChar: '.' },
      listGrouping: 'date',
      hoverCatId: null,
      searchOpen: false,
      searchQuery: '',
      showAdd: false,
      deleteModalId: null,
      lastAddedId: null,
      editingId: null,
      addAmount: '',
      addDate: isoOf(TODAY),
      addCategoryId: 'food',
      addNote: '',
      addingCategory: false,
      newCatName: '',
      newCatColor: 0,
      deleteAllOpen: false,
      deleteAllText: '',
      categoryPickerOpen: false,
      toastMsg: null,
      showSplash: true,
      splashFadingOut: false,
      displayedTotal: 0,
      coinBurstTick: 0,
      swipeDir: 0,
      swipeTick: 0,
      lastAction: null,
      swipingRowId: null,
      swipeRowOffset: 0,
      sheetClosing: false,
      categories: CAT_DEFS.map((c, i) => ({ id: c.id, name: c.name, color: defaultCatColor(i) })),
      expenses: buildSeedExpenses()
    };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (Array.isArray(saved.expenses)) this.state.expenses = saved.expenses;
        if (Array.isArray(saved.categories)) this.state.categories = saved.categories;
        if (saved.language) this.state.language = saved.language;
        if (saved.currency) this.state.currency = saved.currency;
        if (saved.rates) this.state.rates = saved.rates;
        if (saved.numberFormat) this.state.numberFormat = saved.numberFormat;
        if (saved.listGrouping) this.state.listGrouping = saved.listGrouping;
        if (saved.period) this.state.period = saved.period;
      }
    } catch (err) {
      /* ignore corrupt/unavailable storage */
    }
  }

  componentDidMount() {
    this._splashFadeTimer = setTimeout(() => this.setState({ splashFadingOut: true }), 1400);
    this._splashTimer = setTimeout(() => this.setState({ showSplash: false }), 1800);
    this._lastTotal = this.computeFilteredTotal();
    this.animateTotal(this._lastTotal);
    const s = this.state;
    this._persistSnapshot = {
      expenses: s.expenses,
      categories: s.categories,
      language: s.language,
      currency: s.currency,
      rates: s.rates,
      numberFormat: s.numberFormat,
      listGrouping: s.listGrouping,
      period: s.period
    };
  }

  componentWillUnmount() {
    if (this._splashFadeTimer) clearTimeout(this._splashFadeTimer);
    if (this._splashTimer) clearTimeout(this._splashTimer);
    if (this._toastTimer) clearTimeout(this._toastTimer);
    if (this._totalRaf) cancelAnimationFrame(this._totalRaf);
    if (this._totalFallback) clearTimeout(this._totalFallback);
    if (this._sheetCloseTimer) clearTimeout(this._sheetCloseTimer);
  }

  componentDidUpdate() {
    const s = this.state;
    const prev = this._persistSnapshot;
    if (
      !prev ||
      prev.expenses !== s.expenses ||
      prev.categories !== s.categories ||
      prev.language !== s.language ||
      prev.currency !== s.currency ||
      prev.rates !== s.rates ||
      prev.numberFormat !== s.numberFormat ||
      prev.listGrouping !== s.listGrouping ||
      prev.period !== s.period
    ) {
      this.persist();
    }
    this._persistSnapshot = {
      expenses: s.expenses,
      categories: s.categories,
      language: s.language,
      currency: s.currency,
      rates: s.rates,
      numberFormat: s.numberFormat,
      listGrouping: s.listGrouping,
      period: s.period
    };

    const newTotal = this.computeFilteredTotal();
    if (this._lastTotal === undefined || Math.abs(newTotal - this._lastTotal) > 1e-9) {
      this._lastTotal = newTotal;
      this.animateTotal(newTotal, this._countFromZero);
      this._countFromZero = false;
      this.setState((s2) => ({ coinBurstTick: (s2.coinBurstTick || 0) + 1 }));
    }
  }

  // ---------- data helpers ----------

  getRange() {
    const y = TODAY.getFullYear(),
      m = TODAY.getMonth(),
      d = TODAY.getDate();
    const off = this.state.periodOffset;
    switch (this.state.period) {
      case 'day': {
        const dt = new Date(y, m, d + off);
        const iso = isoOf(dt);
        return [iso, iso];
      }
      case 'week': {
        const end = new Date(y, m, d + off * 7);
        const start = new Date(end);
        start.setDate(end.getDate() - 6);
        return [isoOf(start), isoOf(end)];
      }
      case 'year': {
        const yy = y + off;
        return [yy + '-01-01', yy + '-12-31'];
      }
      case 'month':
      default: {
        const dt = new Date(y, m + off, 1);
        const yy = dt.getFullYear(),
          mm = dt.getMonth();
        const last = new Date(yy, mm + 1, 0).getDate();
        return [yy + '-' + pad(mm + 1) + '-01', yy + '-' + pad(mm + 1) + '-' + pad(last)];
      }
    }
  }

  getPeriodLabel() {
    const y = TODAY.getFullYear(),
      m = TODAY.getMonth(),
      d = TODAY.getDate();
    const off = this.state.periodOffset;
    const lang = this.state.language;
    const t = I18N[lang] || I18N.en;
    const months = MONTHS_BY_LANG[lang] || MONTHS;
    switch (this.state.period) {
      case 'day': {
        const dt = new Date(y, m, d + off);
        return off === 0 ? t.today : fmtShort(isoOf(dt), lang, MONTHS_BY_LANG, MONTHS);
      }
      case 'week': {
        const end = new Date(y, m, d + off * 7);
        const start = new Date(end);
        start.setDate(end.getDate() - 6);
        if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
          return (
            pad(start.getDate()) +
            ' \u2013 ' +
            pad(end.getDate()) +
            ' ' +
            months[end.getMonth()] +
            " '" +
            String(end.getFullYear()).slice(2)
          );
        }
        return (
          fmtShort(isoOf(start), lang, MONTHS_BY_LANG, MONTHS) +
          ' \u2013 ' +
          fmtShort(isoOf(end), lang, MONTHS_BY_LANG, MONTHS)
        );
      }
      case 'year':
        return String(y + off);
      case 'month':
      default: {
        const dt = new Date(y, m + off, 1);
        return months[dt.getMonth()] + ' (' + pad(dt.getMonth() + 1) + ') ' + dt.getFullYear();
      }
    }
  }

  getFilteredExpenses() {
    const lang = this.state.language;
    const [start, end] = this.getRange();
    const catById = {};
    this.state.categories.forEach((c) => {
      catById[c.id] = c;
    });
    const query = (this.state.searchQuery || '').trim().toLowerCase();
    if (query.length > 0) {
      return this.state.expenses.filter((e) => {
        const cat = catById[e.categoryId] || { id: 'other', name: 'Other' };
        const hay = [
          e.note,
          this.catLabel(cat),
          fmtShort(e.date, lang, MONTHS_BY_LANG, MONTHS),
          e.date,
          String(e.amount)
        ]
          .join(' ')
          .toLowerCase();
        return fuzzyMatch(query, hay);
      });
    }
    return this.state.expenses.filter((e) => e.date >= start && e.date <= end);
  }

  computeFilteredTotal() {
    return this.getFilteredExpenses().reduce((s, e) => s + e.amount, 0);
  }

  catLabel(cat) {
    const names = CAT_NAMES_BY_LANG[this.state.language] || CAT_NAMES_BY_LANG.en;
    return names[cat.id] || cat.name;
  }

  convertAndFormat(amount, cur) {
    const rate = (this.state.rates && this.state.rates[cur]) || 1;
    return fmtMoney(amount * rate, cur, this.state.numberFormat);
  }

  // ---------- total counter animation ----------

  animateTotal = (target, fromZero) => {
    if (this._totalRaf) cancelAnimationFrame(this._totalRaf);
    if (this._totalFallback) clearTimeout(this._totalFallback);
    const startVal = fromZero ? 0 : this.state.displayedTotal || 0;
    const startTime = Date.now();
    const duration = 650;
    const step = () => {
      const now = Date.now();
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = startVal + (target - startVal) * eased;
      this.setState({ displayedTotal: t >= 1 ? target : val });
      this._totalRaf = t < 1 ? requestAnimationFrame(step) : null;
    };
    this._totalRaf = requestAnimationFrame(step);
    this._totalFallback = setTimeout(() => {
      if (Math.abs((this.state.displayedTotal || 0) - target) > 1e-9) {
        this.setState({ displayedTotal: target });
      }
    }, duration + 150);
  };

  playChaChing() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      const now = ctx.currentTime;
      const notes = [
        [1046.5, 0, 0.09],
        [1568, 0.07, 0.14],
        [2093, 0.16, 0.22]
      ];
      notes.forEach(([freq, delay, dur]) => {
        const start = now + delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.28, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + dur + 0.02);
      });
      setTimeout(() => {
        try {
          ctx.close();
        } catch (e) {}
      }, 700);
    } catch (err) {
      /* audio unavailable */
    }
  }

  showToast = (msg) => {
    if (this._toastTimer) clearTimeout(this._toastTimer);
    this.setState({ toastMsg: msg });
    this._toastTimer = setTimeout(() => this.setState({ toastMsg: null }), 1800);
  };

  persist() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          expenses: this.state.expenses,
          categories: this.state.categories,
          language: this.state.language,
          currency: this.state.currency,
          rates: this.state.rates,
          numberFormat: this.state.numberFormat,
          listGrouping: this.state.listGrouping,
          period: this.state.period
        })
      );
    } catch (err) {
      /* storage unavailable (private mode, quota) */
    }
  }

  // ---------- navigation & period ----------

  selectPeriod = (p) => {
    const order = ['day', 'week', 'month', 'year'];
    const dir = order.indexOf(p) - order.indexOf(this.state.period);
    this._countFromZero = true;
    this.setState((s) => ({
      period: p,
      periodOffset: 0,
      swipeDir: dir === 0 ? 1 : dir > 0 ? 1 : -1,
      lastAction: 'period',
      swipeTick: (s.swipeTick || 0) + 1
    }));
  };
  shiftPeriod = (dir) =>
    this.setState((s) => ({
      periodOffset: s.periodOffset + dir,
      swipeDir: dir,
      lastAction: 'period',
      swipeTick: (s.swipeTick || 0) + 1
    }));

  handleSwipeStart = (e) => {
    const t = e.touches ? e.touches[0] : e;
    this._swipeX = t.clientX;
    this._swipeY = t.clientY;
  };
  handleSwipeEnd = (e) => {
    if (this._swipeX == null) return;
    const t = e.changedTouches ? e.changedTouches[0] : e;
    const dx = t.clientX - this._swipeX;
    const dy = t.clientY - this._swipeY;
    this._swipeX = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
      this.shiftPeriod(dx < 0 ? 1 : -1);
    }
  };

  goHome = () =>
    this.setState((s) => ({ screen: 'home', swipeDir: 0, lastAction: 'toHome', swipeTick: (s.swipeTick || 0) + 1 }));
  goGraph = () =>
    this.setState((s) => ({ screen: 'graph', swipeDir: 0, lastAction: 'toGraph', swipeTick: (s.swipeTick || 0) + 1 }));
  goSettings = () => this.setState((s) => ({ screen: s.screen === 'settings' ? 'home' : 'settings' }));
  setListGrouping = (mode) =>
    this.setState((s) => ({
      listGrouping: mode,
      swipeDir: 0,
      lastAction: 'period',
      swipeTick: (s.swipeTick || 0) + 1
    }));
  setHoverCat = (id) => this.setState({ hoverCatId: id });
  clearHoverCat = () => this.setState({ hoverCatId: null });
  toggleSearch = () =>
    this.setState((s) => ({ searchOpen: !s.searchOpen, searchQuery: s.searchOpen ? '' : s.searchQuery }));
  closeSearch = () => this.setState({ searchOpen: false, searchQuery: '' });
  onSearchInput = (e) => this.setState({ searchQuery: e.target.value });
  setLanguage = (lang) => this.setState({ language: lang });
  setCurrency = (cur) => this.setState({ currency: cur });
  setRate = (code, e) => {
    const v = parseFloat(e.target.value);
    this.setState((s) => ({ rates: { ...s.rates, [code]: isNaN(v) ? 0 : v } }));
  };
  setNumberFormat = (patch) => this.setState((s) => ({ numberFormat: { ...s.numberFormat, ...patch } }));

  // ---------- import / export ----------

  exportJson = () => {
    const payload = { categories: this.state.categories, expenses: this.state.expenses };
    downloadFile(JSON.stringify(payload, null, 2), 'coinbook-export.json', 'application/json');
  };
  exportCsv = () => {
    const catById = {};
    this.state.categories.forEach((c) => {
      catById[c.id] = c;
    });
    const rows = [['date', 'category', 'amount', 'note']];
    this.state.expenses.forEach((e) => {
      rows.push([e.date, (catById[e.categoryId] || { name: 'Other' }).name, e.amount.toFixed(2), e.note || '']);
    });
    const csv = rows.map((r) => r.map(csvEscape).join(',')).join('\n');
    downloadFile(csv, 'coinbook-export.csv', 'text/csv');
  };
  onImportJsonFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        this.mergeImportedCategories(data.categories || []);
        const catByName = {};
        this.state.categories.forEach((c) => {
          catByName[c.name.toLowerCase()] = c.id;
        });
        const imported = (data.expenses || []).map((r, i) => ({
          id: 'imp' + Date.now() + '_' + i,
          amount: parseFloat(r.amount) || 0,
          date: r.date || isoOf(TODAY),
          categoryId: catByName[(r.category || '').toLowerCase()] || r.categoryId || 'other',
          note: r.note || ''
        }));
        this.setState((s) => ({ expenses: [...imported, ...s.expenses] }));
      } catch (err) {
        /* ignore malformed file */
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };
  onImportCsvFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rows = parseCsv(reader.result);
        const header = rows[0].map((h) => h.trim().toLowerCase());
        const dIdx = header.indexOf('date'),
          cIdx = header.indexOf('category'),
          aIdx = header.indexOf('amount'),
          nIdx = header.indexOf('note');
        const catNames = new Set(
          rows
            .slice(1)
            .map((r) => (r[cIdx] || '').trim())
            .filter(Boolean)
        );
        this.mergeImportedCategories(Array.from(catNames).map((name) => ({ name })));
        const catByName = {};
        this.state.categories.forEach((c) => {
          catByName[c.name.toLowerCase()] = c.id;
        });
        const imported = rows.slice(1).map((r, i) => ({
          id: 'imp' + Date.now() + '_' + i,
          amount: parseFloat(r[aIdx]) || 0,
          date: r[dIdx] || isoOf(TODAY),
          categoryId: catByName[(r[cIdx] || '').toLowerCase()] || 'other',
          note: r[nIdx] || ''
        }));
        this.setState((s) => ({ expenses: [...imported, ...s.expenses] }));
      } catch (err) {
        /* ignore malformed file */
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };
  mergeImportedCategories(list) {
    const existingNames = new Set(this.state.categories.map((c) => c.name.toLowerCase()));
    const toAdd = [];
    list.forEach((c, i) => {
      const name = (c.name || '').trim();
      if (name && !existingNames.has(name.toLowerCase())) {
        existingNames.add(name.toLowerCase());
        toAdd.push({
          id: 'custom_' + Date.now() + '_' + i,
          name,
          color: SWATCHES[(this.state.categories.length + toAdd.length) % SWATCHES.length]
        });
      }
    });
    if (toAdd.length) this.setState((s) => ({ categories: [...s.categories, ...toAdd] }));
  }

  // ---------- add / edit sheet ----------

  openAdd = () =>
    this.setState({
      showAdd: true,
      sheetClosing: false,
      editingId: null,
      addAmount: '',
      addDate: isoOf(TODAY),
      addCategoryId: 'food',
      addNote: '',
      addingCategory: false,
      categoryPickerOpen: false
    });
  requestCloseAdd = () => {
    if (this.state.sheetClosing) return;
    this.setState({ sheetClosing: true });
    if (this._sheetCloseTimer) clearTimeout(this._sheetCloseTimer);
    this._sheetCloseTimer = setTimeout(() => {
      this.setState({
        showAdd: false,
        sheetClosing: false,
        addingCategory: false,
        editingId: null,
        categoryPickerOpen: false
      });
    }, 220);
  };
  requestEditEntry = (entry) =>
    this.setState({
      showAdd: true,
      editingId: entry.id,
      addingCategory: false,
      categoryPickerOpen: false,
      addAmount: String(entry.amount),
      addDate: entry.date,
      addCategoryId: entry.categoryId,
      addNote: entry.note || ''
    });
  toggleCategoryPicker = () => this.setState((s) => ({ categoryPickerOpen: !s.categoryPickerOpen }));
  onAmountInput = (e) => this.setState({ addAmount: e.target.value });
  onDateInput = (e) => this.setState({ addDate: e.target.value });
  onNoteInput = (e) => this.setState({ addNote: e.target.value });
  onNewCatNameInput = (e) => this.setState({ newCatName: e.target.value });
  startNewCategory = () => this.setState({ addingCategory: true, newCatName: '', newCatColor: 0 });
  cancelNewCategory = () => this.setState({ addingCategory: false });

  confirmNewCategory = () => {
    const name = (this.state.newCatName || '').trim();
    if (!name) return;
    const color = SWATCHES[this.state.newCatColor % SWATCHES.length];
    const id = 'custom_' + Date.now();
    this.setState((s) => ({
      categories: [...s.categories, { id, name, color }],
      addCategoryId: id,
      addingCategory: false,
      newCatName: ''
    }));
  };

  submitAdd = () => {
    const amt = parseFloat(this.state.addAmount);
    if (!amt || amt <= 0) return;
    if (this.state.editingId) {
      const editId = this.state.editingId;
      const date = this.state.addDate || isoOf(TODAY);
      const categoryId = this.state.addCategoryId;
      const note = (this.state.addNote || '').trim();
      this.setState((s) => ({
        expenses: s.expenses.map((e) => (e.id === editId ? { ...e, amount: amt, date, categoryId, note } : e)),
        showAdd: false,
        addAmount: '',
        addNote: '',
        addingCategory: false,
        editingId: null
      }));
      this.playChaChing();
      this.showToast(I18N[this.state.language]?.savedToast || 'Saved');
    } else {
      const id = 'e' + Date.now();
      const entry = {
        id,
        amount: amt,
        date: this.state.addDate || isoOf(TODAY),
        categoryId: this.state.addCategoryId,
        note: (this.state.addNote || '').trim()
      };
      this.setState((s) => ({
        expenses: [entry, ...s.expenses],
        showAdd: false,
        addAmount: '',
        addNote: '',
        addingCategory: false,
        lastAddedId: id
      }));
      this.playChaChing();
      this.showToast(
        this.convertAndFormat(amt, this.state.currency) + ' ' + (I18N[this.state.language]?.addedToast || 'added')
      );
    }
  };

  requestDelete = (id) => this.setState({ deleteModalId: id });
  cancelDeleteModal = () => this.setState({ deleteModalId: null });
  confirmDeleteModal = () =>
    this.setState((s) => ({ expenses: s.expenses.filter((e) => e.id !== s.deleteModalId), deleteModalId: null }));

  // ---------- swipe-to-delete on rows ----------

  rowSwipeStart = (id, e) => {
    const t = e.touches ? e.touches[0] : e;
    this._rowSwipeX = t.clientX;
    this._rowSwipeId = id;
    this.setState({ swipingRowId: id, swipeRowOffset: 0 });
  };
  rowSwipeMove = (id, e) => {
    if (this._rowSwipeId !== id || this._rowSwipeX == null) return;
    const t = e.touches ? e.touches[0] : e;
    const dx = t.clientX - this._rowSwipeX;
    if (dx < 0) this.setState({ swipeRowOffset: Math.max(dx, -90) });
  };
  rowSwipeEnd = (id) => {
    if (this._rowSwipeId !== id) return;
    const offset = this.state.swipeRowOffset;
    this._rowSwipeX = null;
    this._rowSwipeId = null;
    if (offset < -60) {
      this.setState({ swipingRowId: null, swipeRowOffset: 0 });
      this.requestDelete(id);
    } else {
      this.setState({ swipingRowId: null, swipeRowOffset: 0 });
    }
  };

  openDeleteAll = () => this.setState({ deleteAllOpen: true, deleteAllText: '' });
  cancelDeleteAll = () => this.setState({ deleteAllOpen: false, deleteAllText: '' });
  onDeleteAllTextInput = (e) => this.setState({ deleteAllText: e.target.value });
  confirmDeleteAll = () => {
    if (this.state.deleteAllText !== 'Yes') return;
    this.setState({
      expenses: [],
      categories: CAT_DEFS.map((c, i) => ({ id: c.id, name: c.name, color: defaultCatColor(i) })),
      deleteAllOpen: false,
      deleteAllText: '',
      screen: 'settings'
    });
  };

  // ---------- derived view data (mirrors the original renderVals) ----------

  getViewData() {
    const lang = this.state.language;
    const cur = this.state.currency;
    const t = I18N[lang] || I18N.en;
    const catById = {};
    this.state.categories.forEach((c) => {
      catById[c.id] = c;
    });

    const query = (this.state.searchQuery || '').trim().toLowerCase();
    const isSearching = query.length > 0;
    const filtered = this.getFilteredExpenses().sort((a, b) => (b.date < a.date ? -1 : b.date > a.date ? 1 : 0));
    const total = filtered.reduce((s, e) => s + e.amount, 0);
    const hasEntries = filtered.length > 0;

    const mkRow = (r) => {
      const cat = catById[r.categoryId] || { id: 'other', name: 'Other', color: '#888' };
      const label = this.catLabel(cat);
      const isHovered = this.state.hoverCatId === cat.id;
      const isSwiping = this.state.swipingRowId === r.id;
      const offset = isSwiping ? this.state.swipeRowOffset : 0;
      return {
        id: r.id,
        catName: label,
        catInitial: label.charAt(0).toUpperCase(),
        catFace: coinFace(cat.color),
        note: r.note,
        hasNote: !!r.note,
        amountStr: this.convertAndFormat(r.amount, cur),
        dateShort: fmtShort(r.date, lang, MONTHS_BY_LANG, MONTHS),
        stampAnim: r.id === this.state.lastAddedId ? 'cbStampIn 0.35s ease-out' : 'none',
        requestDelete: (e) => {
          if (e && e.stopPropagation) e.stopPropagation();
          this.requestDelete(r.id);
        },
        requestEdit: () => this.requestEditEntry(r),
        swipeStart: (e) => this.rowSwipeStart(r.id, e),
        swipeMove: (e) => this.rowSwipeMove(r.id, e),
        swipeEnd: () => this.rowSwipeEnd(r.id),
        rowBg: isHovered ? 'rgba(181,67,46,0.12)' : '#f4ecd8',
        rowTransform: 'translateX(' + offset + 'px)' + (isHovered && !isSwiping ? ' scale(1.02)' : ''),
        rowTransition: isSwiping ? 'none' : 'transform 0.25s cubic-bezier(.34,1.56,.64,1), background 0.15s ease'
      };
    };

    const grouping = this.state.listGrouping;
    let groupedList;
    if (grouping === 'category') {
      const byCat = new Map();
      filtered.forEach((e) => {
        if (!byCat.has(e.categoryId)) byCat.set(e.categoryId, []);
        byCat.get(e.categoryId).push(e);
      });
      groupedList = Array.from(byCat.entries())
        .map(([catId, rows]) => {
          const cat = catById[catId] || { id: 'other', name: 'Other' };
          const sum = rows.reduce((s, r) => s + r.amount, 0);
          return {
            key: catId,
            dateLabel: this.catLabel(cat),
            showHeader: true,
            sortKey: sum,
            rows: rows.map((r) => ({ ...mkRow(r), showDateInline: true }))
          };
        })
        .sort((a, b) => b.sortKey - a.sortKey);
    } else if (grouping === 'none') {
      groupedList = filtered.length
        ? [
            {
              key: 'all',
              dateLabel: '',
              showHeader: false,
              rows: filtered.map((r) => ({ ...mkRow(r), showDateInline: true }))
            }
          ]
        : [];
    } else {
      const byDate = new Map();
      filtered.forEach((e) => {
        if (!byDate.has(e.date)) byDate.set(e.date, []);
        byDate.get(e.date).push(e);
      });
      groupedList = Array.from(byDate.entries()).map(([date, rows]) => ({
        key: date,
        dateLabel: fmtShort(date, lang, MONTHS_BY_LANG, MONTHS),
        showHeader: true,
        rows: rows.map((r) => ({ ...mkRow(r), showDateInline: false }))
      }));
    }

    const catTotals = new Map();
    filtered.forEach((e) => {
      catTotals.set(e.categoryId, (catTotals.get(e.categoryId) || 0) + e.amount);
    });
    const catArr = Array.from(catTotals.entries())
      .map(([id, amt]) => ({ id, amt, cat: catById[id] || { id: 'other', name: 'Other', color: '#888' } }))
      .sort((a, b) => b.amt - a.amt);
    let cum = 0;
    const hoverCatId = this.state.hoverCatId;
    const pieSegments = catArr.map((c, idx) => {
      const pct = total > 0 ? (c.amt / total) * 100 : 0;
      const segLen = (pct / 100) * CIRC;
      const label = this.catLabel(c.cat);
      const isHovered = hoverCatId === c.id;
      const isDimmed = !!hoverCatId && !isHovered;
      const seg = {
        id: c.id,
        name: label,
        initial: label.charAt(0).toUpperCase(),
        face: coinFace(isDimmed ? '#c9b98f' : c.cat.color),
        amountStr: this.convertAndFormat(c.amt, cur),
        pctStr: Math.round(pct) + '%',
        dasharray: segLen.toFixed(2) + ' ' + (CIRC - segLen).toFixed(2),
        dashoffset: (-cum).toFixed(2),
        strokeWidth: isHovered ? 23 : 19,
        strokeColor: isDimmed ? '#c9b98f' : c.cat.color,
        opacity: isDimmed ? 0.55 : 1,
        delayMs: idx * 70,
        legendBg: isHovered ? 'rgba(181,67,46,0.12)' : 'transparent',
        legendOpacity: isDimmed ? 0.45 : 1,
        onEnter: () => this.setHoverCat(c.id),
        onLeave: () => this.clearHoverCat()
      };
      cum += segLen;
      return seg;
    });
    const hoverCat = hoverCatId ? catArr.find((c) => c.id === hoverCatId) : null;
    const donutCenterLabel = hoverCat ? this.catLabel(hoverCat.cat) : t.totalSpent;
    const donutCenterValue = hoverCat ? this.convertAndFormat(hoverCat.amt, cur) : this.convertAndFormat(total, cur);

    const periodDefs = [
      ['day', t.periodDay],
      ['week', t.periodWeek],
      ['month', t.periodMonth],
      ['year', t.periodYear]
    ];
    const ink = '#2c2416',
      accent = '#b5432e',
      paperFg = '#f4ecd8';
    const periods = periodDefs.map(([id, label]) => {
      const active = this.state.period === id;
      return {
        id,
        label,
        select: () => this.selectPeriod(id),
        bg: active ? accent : '#f4ecd8',
        fg: active ? paperFg : '#8a7355',
        border: active ? '2.5px solid #7a2a1c' : '1.5px solid rgba(44,36,22,0.25)',
        shadow: active ? '0 3px 0 #7a2a1c' : '0 1px 0 rgba(44,36,22,0.1)',
        scale: active ? 'scale(1.03)' : 'scale(1)'
      };
    });

    const categoriesForPicker = this.state.categories.map((c) => {
      const selected = this.state.addCategoryId === c.id;
      const label = this.catLabel(c);
      return {
        id: c.id,
        name: label,
        initial: label.charAt(0).toUpperCase(),
        face: coinFace(c.color),
        select: () => this.setState({ addCategoryId: c.id, categoryPickerOpen: false }),
        chipBg: selected ? ink : 'transparent',
        chipFg: selected ? paperFg : ink
      };
    });
    const selectedCatObj = catById[this.state.addCategoryId] || { id: 'unsure', name: "I don't know", color: '#888' };
    const selectedCatLabel = this.catLabel(selectedCatObj);

    const swatches = SWATCHES.map((hex, i) => ({
      hex,
      select: () => this.setState({ newCatColor: i }),
      border: this.state.newCatColor === i ? '3px solid ' + ink : '1px solid rgba(0,0,0,0.2)'
    }));

    const languageOptions = [
      { id: 'en', label: 'EN', select: () => this.setLanguage('en') },
      { id: 'sr', label: 'СР', select: () => this.setLanguage('sr') },
      { id: 'ru', label: 'РУ', select: () => this.setLanguage('ru') }
    ].map((o) => ({ ...o, bg: lang === o.id ? ink : 'transparent', fg: lang === o.id ? paperFg : ink }));

    const currencyOptions = [
      { id: 'USD', label: '$ USD', select: () => this.setCurrency('USD') },
      { id: 'EUR', label: '\u20ac EUR', select: () => this.setCurrency('EUR') },
      { id: 'RSD', label: 'RSD', select: () => this.setCurrency('RSD') }
    ].map((o) => ({ ...o, bg: cur === o.id ? ink : 'transparent', fg: cur === o.id ? paperFg : ink }));

    const groupingOptions = [
      { id: 'date', label: 'DATE' },
      { id: 'category', label: 'CATEGORY' },
      { id: 'none', label: 'UNGROUPED' }
    ].map((o) => {
      const active = this.state.listGrouping === o.id;
      return {
        ...o,
        select: () => this.setListGrouping(o.id),
        bg: active ? accent : '#f4ecd8',
        fg: active ? paperFg : '#8a7355',
        border: active ? '2px solid #7a2a1c' : '1.5px solid rgba(44,36,22,0.25)',
        shadow: active ? '0 2px 0 #7a2a1c' : '0 1px 0 rgba(44,36,22,0.1)'
      };
    });

    const deleteModalId = this.state.deleteModalId;
    const deleteEntry = deleteModalId ? this.state.expenses.find((e) => e.id === deleteModalId) : null;
    const deleteCat = deleteEntry ? catById[deleteEntry.categoryId] || { id: 'other', name: 'Other' } : null;

    const numberFormat = this.state.numberFormat;
    const nfActive = ink,
      nfInactive = 'transparent';
    const thousandsToggle = [
      { id: true, label: t.on },
      { id: false, label: t.off }
    ].map((o) => ({
      ...o,
      select: () => this.setNumberFormat({ thousands: o.id }),
      bg: numberFormat.thousands === o.id ? nfActive : nfInactive,
      fg: numberFormat.thousands === o.id ? paperFg : ink
    }));
    const thousandsCharOptions = [
      { id: ',', label: ',' },
      { id: '.', label: '.' }
    ].map((o) => ({
      ...o,
      select: () => this.setNumberFormat({ thousandsChar: o.id }),
      bg: numberFormat.thousandsChar === o.id ? nfActive : nfInactive,
      fg: numberFormat.thousandsChar === o.id ? paperFg : ink
    }));
    const decimalsOptions = [
      { id: 0, label: '0' },
      { id: 2, label: '2' }
    ].map((o) => ({
      ...o,
      select: () => this.setNumberFormat({ decimals: o.id }),
      bg: numberFormat.decimals === o.id ? nfActive : nfInactive,
      fg: numberFormat.decimals === o.id ? paperFg : ink
    }));
    const decimalCharOptions = [
      { id: '.', label: '.' },
      { id: ',', label: ',' }
    ].map((o) => ({
      ...o,
      select: () => this.setNumberFormat({ decimalChar: o.id }),
      bg: numberFormat.decimalChar === o.id ? nfActive : nfInactive,
      fg: numberFormat.decimalChar === o.id ? paperFg : ink
    }));
    const numberFormatPreview = formatNum(1234.5, numberFormat);

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
      categoriesForPicker,
      selectedCatObj,
      selectedCatLabel,
      swatches,
      languageOptions,
      currencyOptions,
      deleteEntry,
      deleteCat,
      numberFormat,
      thousandsToggle,
      thousandsCharOptions,
      decimalsOptions,
      decimalCharOptions,
      numberFormatPreview,
      contentAnim:
        this.state.lastAction === 'toHome'
          ? 'cbLedgerIn 0.55s cubic-bezier(.22,1,.36,1)'
          : this.state.lastAction === 'toGraph'
            ? 'cbChartIn 0.5s cubic-bezier(.22,1,.36,1)'
            : this.state.swipeDir > 0
              ? 'cbSlideInLeft 0.42s cubic-bezier(.2,.8,.3,1)'
              : this.state.swipeDir < 0
                ? 'cbSlideInRight 0.42s cubic-bezier(.2,.8,.3,1)'
                : 'cbFadeSlide 0.38s cubic-bezier(.2,.8,.3,1)'
    };
  }

  render() {
    const s = this.state;
    const v = this.getViewData();
    const t = v.t;
    const isSettings = s.screen === 'settings';
    const notSettings = !isSettings;
    const isHome = s.screen === 'home';
    const isGraph = s.screen === 'graph';
    const notSearching = !v.isSearching;

    return (
      <div className="cb-outer">
        <div className="cb-phone">
          {s.showSplash && (
            <div className="cb-splash" style={{ opacity: s.splashFadingOut ? 0 : 1 }}>
              <div className="cb-splash-badge">
                <div className="cb-splash-ring" />
                <img src={APP_ICON_URL} width="88" height="88" className="cb-splash-icon" alt="" />
              </div>
              <div className="cb-splash-title">COIN BOOK</div>
              <div className="cb-splash-sub">— EXPENSE LEDGER —</div>
            </div>
          )}

          <div className="cb-app">
            {/* ===== FIXED HEADER ===== */}
            <div className="cb-header">
              <div className="cb-gear hover-gear" onClick={this.goSettings}>
                ⚙
              </div>
              {notSettings && (
                <div className="cb-search-btn hover-chevron" onClick={this.toggleSearch}>
                  <svg width="15" height="15" viewBox="0 0 15 15">
                    <circle cx="6.5" cy="6.5" r="5" fill="none" stroke="#2c2416" strokeWidth="1.6" />
                    <line
                      x1="10.3"
                      y1="10.3"
                      x2="14"
                      y2="14"
                      stroke="#2c2416"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
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
                      <div className="cb-period-row">
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

                      <div
                        className="cb-total-wrap"
                        onTouchStart={this.handleSwipeStart}
                        onTouchEnd={this.handleSwipeEnd}
                        onMouseDown={this.handleSwipeStart}
                        onMouseUp={this.handleSwipeEnd}
                      >
                        <div className="cb-ticket">
                          <CoinScatter tick={s.coinBurstTick} />
                          <div className="cb-total-label">{t.totalSpent}</div>
                          <div className="cb-total-value">{this.convertAndFormat(s.displayedTotal, s.currency)}</div>
                          <div className="cb-period-nav">
                            <div className="cb-flourish" />
                            <div className="cb-chevron hover-chevron" onClick={() => this.shiftPeriod(-1)}>
                              ‹
                            </div>
                            <div className="cb-period-pill">{this.getPeriodLabel()}</div>
                            <div className="cb-chevron hover-chevron" onClick={() => this.shiftPeriod(1)}>
                              ›
                            </div>
                            <div className="cb-flourish" />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              <div className="cb-perforation" />
            </div>

            {/* ===== SCROLLABLE CONTENT ===== */}
            <div className="cb-content">
              {isSettings && <SettingsScreen app={this} s={s} v={v} t={t} />}
              {isHome && <LedgerScreen key={s.swipeTick} anim={v.contentAnim} v={v} t={t} />}
              {isGraph && <ChartScreen key={s.swipeTick} anim={v.contentAnim} v={v} t={t} />}
            </div>

            {/* ===== FIXED FOOTER ===== */}
            <div className="cb-footer">
              <div
                className="cb-nav-btn hover-nav press-96"
                onClick={this.goHome}
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
              <div className="cb-fab hover-fab" onClick={this.openAdd}>
                +
              </div>
              <div
                className="cb-nav-btn hover-nav press-96"
                onClick={this.goGraph}
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
          </div>

          {s.toastMsg && <div className="cb-toast">✓ {s.toastMsg}</div>}

          {s.searchOpen && (
            <>
              <div className="cb-scrim cb-scrim-invisible" onClick={this.closeSearch} />
              <div className="cb-search-popup">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Search notes, categories, dates…"
                    value={s.searchQuery}
                    onChange={this.onSearchInput}
                    autoFocus
                    className="cb-input cb-input-pill"
                  />
                  <div className="cb-round-btn hover-delete" onClick={this.closeSearch}>
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
          )}

          {s.showAdd && <AddSheet app={this} s={s} v={v} t={t} />}

          {s.deleteModalId && (
            <>
              <div className="cb-scrim" onClick={this.cancelDeleteModal} />
              <div className="cb-modal">
                <div className="cb-modal-title">{t.voidPrompt}</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
                  {v.deleteCat ? this.catLabel(v.deleteCat) : ''} —{' '}
                  {v.deleteEntry ? this.convertAndFormat(v.deleteEntry.amount, s.currency) : ''}
                </div>
                <div style={{ fontSize: 12, color: '#8a7355', marginBottom: 18 }}>
                  {v.deleteEntry ? fmtShort(v.deleteEntry.date, s.language, MONTHS_BY_LANG, MONTHS) : ''}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div className="cb-modal-btn cb-modal-btn-danger hover-lift" onClick={this.confirmDeleteModal}>
                    {t.yes}
                  </div>
                  <div className="cb-modal-btn cb-modal-btn-outline hover-lift" onClick={this.cancelDeleteModal}>
                    {t.no}
                  </div>
                </div>
              </div>
            </>
          )}

          {s.deleteAllOpen && (
            <>
              <div className="cb-scrim" onClick={this.cancelDeleteAll} />
              <div className="cb-modal cb-modal-danger">
                <div className="cb-modal-title">{t.deleteAll}</div>
                <div style={{ fontSize: 12.5, color: '#6b5636', marginBottom: 14, lineHeight: 1.5 }}>
                  {t.deleteAllWarn}
                </div>
                <input
                  type="text"
                  placeholder={t.typeYesPlaceholder}
                  value={s.deleteAllText}
                  onChange={this.onDeleteAllTextInput}
                  className="cb-input cb-input-danger"
                />
                <div style={{ display: 'flex', gap: 10 }}>
                  <div
                    className="cb-modal-btn cb-modal-btn-danger"
                    style={{
                      opacity: s.deleteAllText === 'Yes' ? 1 : 0.4,
                      cursor: s.deleteAllText === 'Yes' ? 'pointer' : 'default'
                    }}
                    onClick={this.confirmDeleteAll}
                  >
                    {t.eraseEverything}
                  </div>
                  <div className="cb-modal-btn cb-modal-btn-outline hover-lift" onClick={this.cancelDeleteAll}>
                    {t.cancel}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
}

function PeriodIcon({ id }) {
  if (id === 'day')
    return (
      <svg width="14" height="14" viewBox="0 0 14 14">
        <circle cx="7" cy="7" r="3" fill="currentColor" />
        <line x1="7" y1="0.5" x2="7" y2="2.2" stroke="currentColor" strokeWidth="1.3" />
        <line x1="7" y1="11.8" x2="7" y2="13.5" stroke="currentColor" strokeWidth="1.3" />
        <line x1="0.5" y1="7" x2="2.2" y2="7" stroke="currentColor" strokeWidth="1.3" />
        <line x1="11.8" y1="7" x2="13.5" y2="7" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    );
  if (id === 'week')
    return (
      <svg width="16" height="14" viewBox="0 0 16 14">
        <rect x="0" y="3" width="1.6" height="8" fill="currentColor" />
        <rect x="2.4" y="1" width="1.6" height="12" fill="currentColor" />
        <rect x="4.8" y="4" width="1.6" height="6" fill="currentColor" />
        <rect x="7.2" y="0" width="1.6" height="14" fill="currentColor" />
        <rect x="9.6" y="3" width="1.6" height="8" fill="currentColor" />
        <rect x="12" y="1" width="1.6" height="12" fill="currentColor" />
        <rect x="14.4" y="4" width="1.6" height="6" fill="currentColor" />
      </svg>
    );
  if (id === 'month')
    return (
      <svg width="14" height="14" viewBox="0 0 14 14">
        <rect x="0.5" y="1.5" width="13" height="12" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <line x1="0.5" y1="5" x2="13.5" y2="5" stroke="currentColor" strokeWidth="1.2" />
        <line x1="4" y1="0" x2="4" y2="2.5" stroke="currentColor" strokeWidth="1.2" />
        <line x1="10" y1="0" x2="10" y2="2.5" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  return (
    <svg width="14" height="14" viewBox="0 0 14 14">
      <circle cx="7" cy="7" r="6.3" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <line x1="7" y1="0.7" x2="7" y2="13.3" stroke="currentColor" strokeWidth="1.2" />
      <line x1="0.7" y1="7" x2="13.3" y2="7" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function CoinScatter({ tick }) {
  const coins = [
    { key: 'cluster' },
    { key: 'a', cls: 'cb-coin-a', delay: 0.05 },
    { key: 'b', cls: 'cb-coin-b', delay: 0.12 },
    { key: 'c', cls: 'cb-coin-c', delay: 0.18 },
    { key: 'd', cls: 'cb-coin-d', delay: 0.24 }
  ];
  return (
    <>
      <div
        key={'cluster' + tick}
        className="cb-coin-cluster"
        style={{ animation: 'cbCoinBurst 0.6s cubic-bezier(.3,.6,.3,1)' }}
      >
        <div className="cb-coin cb-coin-1" />
        <div className="cb-coin cb-coin-2" />
        <div className="cb-coin cb-coin-3">
          <span className="cb-coin-letter">C</span>
        </div>
      </div>
      {coins.slice(1).map((c) => (
        <div
          key={c.key + tick}
          className={'cb-coin-scatter ' + c.cls}
          style={{ animation: `cbCoinBurst 0.6s cubic-bezier(.3,.6,.3,1) ${c.delay}s both` }}
        >
          <div className={'cb-coin cb-coin-solo-' + c.key} />
        </div>
      ))}
    </>
  );
}

function LedgerScreen({ anim, v, t }) {
  return (
    <div style={{ animation: anim }}>
      <div className="cb-group-row">
        {v.groupingOptions.map((g) => (
          <div
            key={g.id}
            className="cb-group-tab hover-lift"
            onClick={g.select}
            style={{ border: g.border, background: g.bg, color: g.fg, boxShadow: g.shadow }}
          >
            <GroupIcon id={g.id} />
            {g.label}
          </div>
        ))}
      </div>

      {v.hasEntries ? (
        v.groupedList.map((grp) => (
          <React.Fragment key={grp.key}>
            {grp.showHeader && (
              <div className="cb-group-header">
                <div className="cb-group-bar" />
                <div className="cb-group-label">{grp.dateLabel}</div>
                <div className="cb-group-rule" />
              </div>
            )}
            {grp.rows.map((row) => (
              <div key={row.id} className="cb-row-outer">
                <div className="cb-row-delete-bg">
                  <span>✕</span>
                </div>
                <div
                  className="cb-row hover-lift press-96"
                  onClick={row.requestEdit}
                  onTouchStart={row.swipeStart}
                  onTouchMove={row.swipeMove}
                  onTouchEnd={row.swipeEnd}
                  style={{
                    background: row.rowBg,
                    transform: row.rowTransform,
                    animation: row.stampAnim,
                    transition: row.rowTransition
                  }}
                >
                  <div className="cb-coin-badge-ring">
                    <div className="cb-coin-badge-face" style={{ background: row.catFace }}>
                      <div className="cb-coin-badge-rim" />
                      <span className="cb-coin-badge-letter">{row.catInitial}</span>
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{row.catName}</div>
                    {row.showDateInline && <div style={{ fontSize: 11, color: '#a8987a' }}>{row.dateShort}</div>}
                    {row.hasNote && <div style={{ fontSize: 12, color: '#7a6a55' }}>{row.note}</div>}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#b5432e', whiteSpace: 'nowrap' }}>
                    {row.amountStr}
                  </div>
                  <div className="cb-round-btn cb-round-btn-sm hover-delete press-96" onClick={row.requestDelete}>
                    ✕
                  </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))
      ) : (
        <div className="cb-empty">{t.noEntries}</div>
      )}
    </div>
  );
}

function GroupIcon({ id }) {
  if (id === 'date')
    return (
      <svg width="12" height="12" viewBox="0 0 14 14">
        <rect x="0.5" y="1.5" width="13" height="12" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <line x1="0.5" y1="5" x2="13.5" y2="5" stroke="currentColor" strokeWidth="1.2" />
        <line x1="4" y1="0" x2="4" y2="2.5" stroke="currentColor" strokeWidth="1.2" />
        <line x1="10" y1="0" x2="10" y2="2.5" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  if (id === 'category')
    return (
      <svg width="12" height="12" viewBox="0 0 14 14">
        <rect x="0.5" y="0.5" width="6" height="6" rx="1" fill="currentColor" />
        <rect x="7.5" y="0.5" width="6" height="6" rx="1" fill="currentColor" opacity="0.55" />
        <rect x="0.5" y="7.5" width="6" height="6" rx="1" fill="currentColor" opacity="0.55" />
        <rect x="7.5" y="7.5" width="6" height="6" rx="1" fill="currentColor" />
      </svg>
    );
  return (
    <svg width="14" height="12" viewBox="0 0 14 12">
      <rect x="0" y="1" width="14" height="1.8" rx="0.9" fill="currentColor" />
      <rect x="0" y="5.1" width="14" height="1.8" rx="0.9" fill="currentColor" />
      <rect x="0" y="9.2" width="14" height="1.8" rx="0.9" fill="currentColor" />
    </svg>
  );
}

function ChartScreen({ anim, v, t }) {
  return (
    <div style={{ animation: anim }}>
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', padding: '14px 0 6px' }}>
        <div style={{ position: 'relative', width: 188, height: 188 }}>
          <svg
            width="188"
            height="188"
            viewBox="0 0 100 100"
            style={{
              transform: 'rotate(-90deg)',
              filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.2))',
              animation: 'cbPieIn 0.45s ease-out'
            }}
          >
            <circle cx="50" cy="50" r="38" fill="none" stroke="#dcd0ae" strokeWidth="19" />
            {v.pieSegments.map((seg) => (
              <circle
                key={seg.id}
                onMouseEnter={seg.onEnter}
                onMouseLeave={seg.onLeave}
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke={seg.strokeColor}
                strokeWidth={seg.strokeWidth}
                strokeDasharray={seg.dasharray}
                strokeDashoffset={seg.dashoffset}
                strokeLinecap="butt"
                opacity={seg.opacity}
                style={{
                  cursor: 'pointer',
                  transition: 'stroke-width 0.15s ease, opacity 0.15s ease, stroke 0.15s ease',
                  animation: `cbSegFade 0.45s ease-out ${seg.delayMs}ms both`
                }}
              />
            ))}
          </svg>
          <div className="cb-donut-center">
            <div style={{ fontSize: 9, letterSpacing: 1.5, color: '#8a7355', textAlign: 'center' }}>
              {v.donutCenterLabel}
            </div>
            <div
              style={{
                fontFamily: "'Special Elite',monospace",
                fontSize: 17,
                color: '#2c2416',
                textAlign: 'center',
                whiteSpace: 'nowrap'
              }}
            >
              {v.donutCenterValue}
            </div>
          </div>
        </div>
      </div>
      {!v.hasEntries && (
        <div className="cb-empty" style={{ padding: '20px 0' }}>
          {t.nothingToChart}
        </div>
      )}
      {v.pieSegments.map((seg) => (
        <div
          key={seg.id}
          className="cb-legend-row"
          onMouseEnter={seg.onEnter}
          onMouseLeave={seg.onLeave}
          style={{ background: seg.legendBg, opacity: seg.legendOpacity }}
        >
          <div className="cb-coin-legend-face" style={{ background: seg.face }}>
            <div className="cb-coin-legend-rim" />
            <span className="cb-coin-legend-letter">{seg.initial}</span>
          </div>
          <div style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{seg.name}</div>
          <div style={{ fontSize: 12, color: '#8a7355' }}>{seg.pctStr}</div>
          <div style={{ fontSize: 13, fontWeight: 700, width: 66, textAlign: 'right' }}>{seg.amountStr}</div>
        </div>
      ))}
    </div>
  );
}

function SettingsScreen({ app, s, v, t }) {
  return (
    <div className="cb-settings-anim">
      <div className="cb-settings-title">{t.settingsTitle}</div>

      <div className="cb-section-label">{t.language}</div>
      <div className="cb-choice-row" style={{ marginBottom: 18 }}>
        {v.languageOptions.map((lo) => (
          <div
            key={lo.id}
            className="cb-choice hover-lift"
            onClick={lo.select}
            style={{ background: lo.bg, color: lo.fg }}
          >
            {lo.label}
          </div>
        ))}
      </div>

      <div className="cb-section-label">{t.currency}</div>
      <div className="cb-choice-row" style={{ marginBottom: 22 }}>
        {v.currencyOptions.map((co) => (
          <div
            key={co.id}
            className="cb-choice hover-lift"
            onClick={co.select}
            style={{ background: co.bg, color: co.fg }}
          >
            {co.label}
          </div>
        ))}
      </div>

      <div className="cb-section-label">{t.numberFormat}</div>
      <div className="cb-panel" style={{ marginBottom: 18 }}>
        <div className="cb-panel-row">
          <div className="cb-panel-label">{t.thousandsSep}</div>
          <div style={{ display: 'flex', gap: 5 }}>
            {v.thousandsToggle.map((opt) => (
              <div
                key={String(opt.id)}
                className="cb-toggle hover-lift press-96"
                onClick={opt.select}
                style={{ background: opt.bg, color: opt.fg }}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </div>
        {v.numberFormat.thousands && (
          <div className="cb-panel-row">
            <div className="cb-panel-label">{t.thousandsChar}</div>
            <div style={{ display: 'flex', gap: 5 }}>
              {v.thousandsCharOptions.map((opt) => (
                <div
                  key={opt.id}
                  className="cb-toggle hover-lift press-96"
                  onClick={opt.select}
                  style={{ background: opt.bg, color: opt.fg }}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="cb-panel-row">
          <div className="cb-panel-label">{t.decimalPlaces}</div>
          <div style={{ display: 'flex', gap: 5 }}>
            {v.decimalsOptions.map((opt) => (
              <div
                key={opt.id}
                className="cb-toggle hover-lift press-96"
                onClick={opt.select}
                style={{ background: opt.bg, color: opt.fg }}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </div>
        {v.numberFormat.decimals > 0 && (
          <div className="cb-panel-row">
            <div className="cb-panel-label">{t.decimalChar}</div>
            <div style={{ display: 'flex', gap: 5 }}>
              {v.decimalCharOptions.map((opt) => (
                <div
                  key={opt.id}
                  className="cb-toggle hover-lift press-96"
                  onClick={opt.select}
                  style={{ background: opt.bg, color: opt.fg }}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ fontSize: 11, color: '#8a7355', textAlign: 'right' }}>
          {t.preview}: {v.numberFormatPreview}
        </div>
      </div>

      <div className="cb-section-label">{t.conversionRate}</div>
      <div className="cb-panel" style={{ marginBottom: 22 }}>
        <div className="cb-rate-row">
          <div className="cb-rate-label">{t.perUsd} EUR</div>
          <input
            type="number"
            step="0.0001"
            min="0"
            value={s.rates.EUR}
            onChange={(e) => app.setRate('EUR', e)}
            className="cb-input"
          />
        </div>
        <div className="cb-rate-row">
          <div className="cb-rate-label">{t.perUsd} RSD</div>
          <input
            type="number"
            step="0.01"
            min="0"
            value={s.rates.RSD}
            onChange={(e) => app.setRate('RSD', e)}
            className="cb-input"
          />
        </div>
      </div>

      <div className="cb-section-label">{t.data}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
        <div className="cb-btn-outline hover-lift" onClick={app.exportJson}>
          {t.exportJson}
        </div>
        <div className="cb-btn-outline hover-lift" onClick={app.exportCsv}>
          {t.exportCsv}
        </div>
        <label className="cb-btn-outline cb-btn-dashed hover-lift">
          {t.importJson}
          <input
            type="file"
            accept="application/json,.json"
            onChange={app.onImportJsonFile}
            style={{ display: 'none' }}
          />
        </label>
        <label className="cb-btn-outline cb-btn-dashed hover-lift">
          {t.importCsv}
          <input type="file" accept="text/csv,.csv" onChange={app.onImportCsvFile} style={{ display: 'none' }} />
        </label>
      </div>

      <div className="cb-btn-solid hover-lift press-96" onClick={app.goHome} style={{ marginBottom: 12 }}>
        {t.done}
      </div>

      <div className="cb-danger-zone">
        <div className="cb-danger-label">{t.dangerZone}</div>
        <div className="cb-btn-danger hover-danger" onClick={app.openDeleteAll}>
          {t.deleteAll}
        </div>
      </div>
    </div>
  );
}

function AddSheet({ app, s, v, t }) {
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
            step="0.01"
            min="0"
            placeholder="0.00"
            value={s.addAmount}
            onChange={app.onAmountInput}
            className="cb-input cb-input-amount"
          />

          <div className="cb-field-label">{t.date}</div>
          <input type="date" value={s.addDate} onChange={app.onDateInput} className="cb-input cb-input-date" />

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
