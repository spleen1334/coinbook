import React from 'react';
import { CATEGORY_DEFINITIONS, CATEGORY_SWATCHES } from './data/categories.js';
import { DEMO_EXPENSES } from './data/demoExpenses.js';
import { MONTHS, MONTHS_BY_LANGUAGE, CATEGORY_NAMES_BY_LANGUAGE, UI_TEXT } from './data/i18n.js';
import { PeriodIcon } from './components/PeriodIcon.jsx';
import { CoinScatter } from './components/CoinScatter.jsx';
import { LedgerScreen } from './components/LedgerScreen.jsx';
import { ChartScreen } from './components/ChartScreen.jsx';
import { SettingsScreen } from './components/SettingsScreen.jsx';
import { CurrencyBadge } from './components/CurrencyBadge.jsx';
import { AddSheet } from './components/AddSheet.jsx';
import { pad, isoOf, formatShortDate } from './utils/date.js';
import { formatNumber, formatMoney } from './utils/money.js';
import { downloadFile } from './utils/download.js';
import { fuzzyMatch } from './utils/search.js';
import { defaultCatColor, coinFace } from './utils/coin.js';
import { DEFAULT_RATES, loadPersistedState, savePersistedStateAsync } from './persistence/localState.js';
import { buildJsonExport, parseJsonImport } from './importExport/json.js';
import { buildCsvExport, parseCsvImport } from './importExport/csv.js';

const TODAY = new Date();
const CIRC = 2 * Math.PI * 38;
const APP_BASE_URL = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');
const APP_ICON_URL = `${APP_BASE_URL}icons/icon.png`;

function buildSeedExpenses() {
  return DEMO_EXPENSES.map((s, i) => {
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
      currency: 'RSD',
      rates: DEFAULT_RATES,
      numberFormat: { thousands: true, thousandsChar: ',', decimals: 2, decimalChar: '.' },
      listGrouping: 'date',
      dateSortDir: 'desc',
      categorySortDir: 'desc',
      ungroupedSortDir: 'desc',
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
      toastVariant: 'success',
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
      canInstallApp: false,
      persistenceReady: false,
      categories: CATEGORY_DEFINITIONS.map((c, i) => ({ id: c.id, name: c.name, color: defaultCatColor(i) })),
      expenses: buildSeedExpenses()
    };
  }

  componentDidMount() {
    this._mounted = true;
    this._beforeInstallPromptHandler = (e) => {
      e.preventDefault();
      this._installPromptEvent = e;
      if (!this.isStandalone()) this.setState({ canInstallApp: true });
    };
    this._appInstalledHandler = () => {
      this._installPromptEvent = null;
      this.setState({ canInstallApp: false });
      this.showToast(this.getText().installedToast || 'Installed');
    };
    window.addEventListener('beforeinstallprompt', this._beforeInstallPromptHandler);
    window.addEventListener('appinstalled', this._appInstalledHandler);
    if (!this.isStandalone()) this.setState({ canInstallApp: true });
    this._splashFadeTimer = setTimeout(() => this.setState({ splashFadingOut: true }), 1400);
    this._splashTimer = setTimeout(() => this.setState({ showSplash: false }), 1800);
    this._lastTotal = this.computeFilteredTotal();
    this.animateTotal(this._lastTotal);
    this.hydratePersistedState();
  }

  componentWillUnmount() {
    this._mounted = false;
    if (this._splashFadeTimer) clearTimeout(this._splashFadeTimer);
    if (this._splashTimer) clearTimeout(this._splashTimer);
    if (this._toastTimer) clearTimeout(this._toastTimer);
    if (this._totalRaf) cancelAnimationFrame(this._totalRaf);
    if (this._totalFallback) clearTimeout(this._totalFallback);
    if (this._sheetCloseTimer) clearTimeout(this._sheetCloseTimer);
    if (this._beforeInstallPromptHandler) {
      window.removeEventListener('beforeinstallprompt', this._beforeInstallPromptHandler);
    }
    if (this._appInstalledHandler) window.removeEventListener('appinstalled', this._appInstalledHandler);
  }

  componentDidUpdate() {
    const s = this.state;
    const prev = this._persistSnapshot;
    if (
      s.persistenceReady &&
      (!prev ||
        prev.expenses !== s.expenses ||
        prev.categories !== s.categories ||
        prev.language !== s.language ||
        prev.currency !== s.currency ||
        prev.rates !== s.rates ||
        prev.numberFormat !== s.numberFormat ||
        prev.listGrouping !== s.listGrouping ||
        prev.dateSortDir !== s.dateSortDir ||
        prev.categorySortDir !== s.categorySortDir ||
        prev.ungroupedSortDir !== s.ungroupedSortDir ||
        prev.period !== s.period)
    ) {
      savePersistedStateAsync(s);
    }
    this._persistSnapshot = this.getPersistSnapshot(s);

    const newTotal = this.computeFilteredTotal();
    const shouldReplayExpenseAnimation = this._replayExpenseAnimation;
    this._replayExpenseAnimation = false;
    if (this._lastTotal === undefined || Math.abs(newTotal - this._lastTotal) > 1e-9 || shouldReplayExpenseAnimation) {
      this._lastTotal = newTotal;
      this.animateTotal(newTotal, this._countFromZero);
      this._countFromZero = false;
      this.setState((s2) => ({ coinBurstTick: (s2.coinBurstTick || 0) + 1 }));
    }
  }

  // ---------- data helpers ----------

  getPersistSnapshot(s) {
    return {
      expenses: s.expenses,
      categories: s.categories,
      language: s.language,
      currency: s.currency,
      rates: s.rates,
      numberFormat: s.numberFormat,
      listGrouping: s.listGrouping,
      dateSortDir: s.dateSortDir,
      categorySortDir: s.categorySortDir,
      ungroupedSortDir: s.ungroupedSortDir,
      period: s.period
    };
  }

  async hydratePersistedState() {
    const persistedState = await loadPersistedState();
    if (!this._mounted) return;
    const hydratedState = { ...this.state, ...persistedState, persistenceReady: true };
    this._persistSnapshot = this.getPersistSnapshot(hydratedState);
    this.setState({ ...persistedState, persistenceReady: true });
  }

  isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  }

  getText() {
    return UI_TEXT[this.state.language] || UI_TEXT.en;
  }

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
    const t = UI_TEXT[lang] || UI_TEXT.en;
    const months = MONTHS_BY_LANGUAGE[lang] || MONTHS;
    switch (this.state.period) {
      case 'day': {
        const dt = new Date(y, m, d + off);
        return off === 0 ? t.today : formatShortDate(isoOf(dt), lang, MONTHS_BY_LANGUAGE, MONTHS);
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
          formatShortDate(isoOf(start), lang, MONTHS_BY_LANGUAGE, MONTHS) +
          ' \u2013 ' +
          formatShortDate(isoOf(end), lang, MONTHS_BY_LANGUAGE, MONTHS)
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
          formatShortDate(e.date, lang, MONTHS_BY_LANGUAGE, MONTHS),
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
    const names = CATEGORY_NAMES_BY_LANGUAGE[this.state.language] || CATEGORY_NAMES_BY_LANGUAGE.en;
    return names[cat.id] || cat.name;
  }

  convertAndFormat(amount, cur, includeCurrency = true) {
    const storedRate = this.state.rates && this.state.rates[cur];
    const parsedRate = Number(String(storedRate).replace(',', '.'));
    const fallbackRate = DEFAULT_RATES[cur] || 1;
    const rate = Number.isFinite(parsedRate) && parsedRate > 0 ? parsedRate : fallbackRate;
    const value = amount * rate;
    return includeCurrency
      ? formatMoney(value, cur, this.state.numberFormat)
      : formatNumber(value, this.state.numberFormat);
  }

  convertAndFormatParts(amount, cur) {
    const storedRate = this.state.rates && this.state.rates[cur];
    const parsedRate = Number(String(storedRate).replace(',', '.'));
    const fallbackRate = DEFAULT_RATES[cur] || 1;
    const rate = Number.isFinite(parsedRate) && parsedRate > 0 ? parsedRate : fallbackRate;
    const value = amount * rate;
    const amountText = formatNumber(value, this.state.numberFormat);
    if (cur === 'EUR') return { amount: amountText, suffix: '€' };
    if (cur === 'RSD') return { prefix: 'RSD', amount: amountText };
    return { prefix: '$', amount: amountText };
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

  showToast = (msg, variant = 'success') => {
    if (this._toastTimer) clearTimeout(this._toastTimer);
    this.setState({ toastMsg: msg, toastVariant: variant });
    this._toastTimer = setTimeout(() => this.setState({ toastMsg: null, toastVariant: 'success' }), 1800);
  };

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
      dateSortDir:
        mode === 'date' && s.listGrouping === 'date' ? (s.dateSortDir === 'desc' ? 'asc' : 'desc') : s.dateSortDir,
      categorySortDir:
        mode === 'category' && s.listGrouping === 'category'
          ? s.categorySortDir === 'desc'
            ? 'asc'
            : 'desc'
          : s.categorySortDir,
      ungroupedSortDir:
        mode === 'none' && s.listGrouping === 'none'
          ? s.ungroupedSortDir === 'desc'
            ? 'asc'
            : 'desc'
          : s.ungroupedSortDir,
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
    const value = e.target.value;
    if (!/^\d*(?:[.,]\d*)?$/.test(value)) return;
    this.setState((s) => ({ rates: { ...s.rates, [code]: value } }));
  };
  finishRateEditing = (code) => {
    this.setState((s) => {
      const parsedRate = Number(String(s.rates?.[code]).replace(',', '.'));
      return {
        rates: {
          ...s.rates,
          [code]: Number.isFinite(parsedRate) && parsedRate > 0 ? parsedRate : DEFAULT_RATES[code]
        }
      };
    });
  };
  setNumberFormat = (patch) => this.setState((s) => ({ numberFormat: { ...s.numberFormat, ...patch } }));

  installApp = async () => {
    const t = this.getText();
    const promptEvent = this._installPromptEvent;
    if (!promptEvent) {
      this.showToast(t.installFallback || 'Use browser menu to add to home screen');
      return;
    }

    promptEvent.prompt();
    const choice = promptEvent.userChoice ? await promptEvent.userChoice : null;
    if (!choice || choice.outcome === 'accepted') {
      this._installPromptEvent = null;
      this.setState({ canInstallApp: false });
    }
  };

  requestExpenseTotalReplay() {
    this._replayExpenseAnimation = true;
  }

  // ---------- import / export ----------

  exportJson = () => {
    downloadFile(
      buildJsonExport(this.state.categories, this.state.expenses),
      'coinbook-export.json',
      'application/json'
    );
  };
  exportCsv = () => {
    downloadFile(buildCsvExport(this.state.categories, this.state.expenses), 'coinbook-export.csv', 'text/csv');
  };
  onImportJsonFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const { categories, expenses: imported } = parseJsonImport(
          reader.result,
          this.state.categories,
          CATEGORY_SWATCHES,
          isoOf(TODAY)
        );
        this.requestExpenseTotalReplay();
        this.setState((s) => ({ categories, expenses: [...imported, ...s.expenses] }));
      } catch (err) {
        this.showToast('Import failed', 'error');
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
        const { categories, expenses: imported } = parseCsvImport(
          reader.result,
          this.state.categories,
          CATEGORY_SWATCHES,
          isoOf(TODAY)
        );
        this.requestExpenseTotalReplay();
        this.setState((s) => ({ categories, expenses: [...imported, ...s.expenses] }));
      } catch (err) {
        this.showToast('Import failed', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };
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
    const color = CATEGORY_SWATCHES[this.state.newCatColor % CATEGORY_SWATCHES.length];
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
    this.requestExpenseTotalReplay();
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
      this.showToast(UI_TEXT[this.state.language]?.savedToast || 'Saved');
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
        this.convertAndFormat(amt, this.state.currency) + ' ' + (UI_TEXT[this.state.language]?.addedToast || 'added')
      );
    }
  };

  requestDelete = (id) => this.setState({ deleteModalId: id });
  cancelDeleteModal = () => this.setState({ deleteModalId: null });
  confirmDeleteModal = () => {
    this.requestExpenseTotalReplay();
    this.setState((s) => ({ expenses: s.expenses.filter((e) => e.id !== s.deleteModalId), deleteModalId: null }));
  };

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
    this.requestExpenseTotalReplay();
    this.setState({
      expenses: [],
      categories: CATEGORY_DEFINITIONS.map((c, i) => ({ id: c.id, name: c.name, color: defaultCatColor(i) })),
      deleteAllOpen: false,
      deleteAllText: '',
      screen: 'settings'
    });
  };

  // ---------- derived view data (mirrors the original renderVals) ----------

  getViewData() {
    const lang = this.state.language;
    const cur = this.state.currency;
    const t = UI_TEXT[lang] || UI_TEXT.en;
    const catById = {};
    this.state.categories.forEach((c) => {
      catById[c.id] = c;
    });

    const query = (this.state.searchQuery || '').trim().toLowerCase();
    const isSearching = query.length > 0;
    const filtered = this.getFilteredExpenses();
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
        amountParts: this.convertAndFormatParts(r.amount, cur),
        dateShort: formatShortDate(r.date, lang, MONTHS_BY_LANGUAGE, MONTHS),
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
      sortByAmount(filtered, this.state.categorySortDir).forEach((e) => {
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
            totalStr: this.convertAndFormat(sum, cur),
            totalParts: this.convertAndFormatParts(sum, cur),
            showHeader: true,
            sortKey: sum,
            rows: rows.map((r) => ({ ...mkRow(r), showDateInline: true }))
          };
        })
        .sort((a, b) => (this.state.categorySortDir === 'asc' ? a.sortKey - b.sortKey : b.sortKey - a.sortKey));
    } else if (grouping === 'none') {
      groupedList = filtered.length
        ? [
            {
              key: 'all',
              dateLabel: '',
              showHeader: false,
              rows: sortByAmount(filtered, this.state.ungroupedSortDir).map((r) => ({
                ...mkRow(r),
                showDateInline: true
              }))
            }
          ]
        : [];
    } else {
      const byDate = new Map();
      sortByDate(filtered, this.state.dateSortDir).forEach((e) => {
        if (!byDate.has(e.date)) byDate.set(e.date, []);
        byDate.get(e.date).push(e);
      });
      groupedList = Array.from(byDate.entries()).map(([date, rows]) => ({
        key: date,
        dateLabel: formatShortDate(date, lang, MONTHS_BY_LANGUAGE, MONTHS),
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
        amountParts: this.convertAndFormatParts(c.amt, cur),
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
    const donutCenterValue = hoverCat
      ? this.convertAndFormat(hoverCat.amt, cur, false)
      : this.convertAndFormat(total, cur, false);
    const donutCenterCurrency = cur;

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

    const swatches = CATEGORY_SWATCHES.map((hex, i) => ({
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
      { id: 'RSD', label: 'RSD', select: () => this.setCurrency('RSD') },
      { id: 'EUR', label: '\u20ac EUR', select: () => this.setCurrency('EUR') },
      { id: 'USD', label: '$ USD', select: () => this.setCurrency('USD') }
    ].map((o) => ({ ...o, bg: cur === o.id ? ink : 'transparent', fg: cur === o.id ? paperFg : ink }));

    const groupingOptions = [
      { id: 'date', label: 'DATE' },
      { id: 'category', label: 'CATEGORY' },
      { id: 'none', label: 'UNGROUPED' }
    ].map((o) => {
      const active = this.state.listGrouping === o.id;
      const sortMark =
        active && o.id === 'date'
          ? this.state.dateSortDir === 'desc'
            ? ' ↓'
            : ' ↑'
          : active && o.id === 'category'
            ? this.state.categorySortDir === 'desc'
              ? ' ↓'
              : ' ↑'
            : active && o.id === 'none'
              ? this.state.ungroupedSortDir === 'desc'
                ? ' ↓'
                : ' ↑'
              : '';
      return {
        ...o,
        label: o.label + sortMark,
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
    const numberFormatPreview = formatNumber(1234.5, numberFormat);

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

    if (!s.persistenceReady) {
      return (
        <div className="cb-outer">
          <div className="cb-phone">
            <div className="cb-splash" style={{ opacity: 1 }}>
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
          </div>
        </div>
      );
    }

    const v = this.getViewData();
    const t = v.t;
    const isSettings = s.screen === 'settings';
    const notSettings = !isSettings;
    const isHome = s.screen === 'home';
    const isGraph = s.screen === 'graph';
    const notSearching = !v.isSearching;
    const showChartNav = notSettings && isGraph;
    const showTicket = notSettings && !isGraph;
    const periodRowClass = isGraph ? 'cb-period-row cb-period-row-graph' : 'cb-period-row';
    const periodNav = (
      <div className={isGraph ? 'cb-period-nav cb-period-nav-compact' : 'cb-period-nav'}>
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
    );
    const ledgerPeriodButton = (direction) => (
      <div
        className={`cb-ledger-period-arrow cb-ledger-period-arrow-${direction < 0 ? 'left' : 'right'} hover-chevron`}
        onClick={() => this.shiftPeriod(direction)}
      >
        <svg className="cb-ledger-period-arrow-icon" width="18" height="30" viewBox="0 0 18 30" aria-hidden="true">
          <path
            d={direction < 0 ? 'M13 4 5 15l8 11' : 'M5 4l8 11-8 11'}
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );

    return (
      <div className="cb-outer">
        <div className="cb-phone">
          {s.showSplash && (
            <div className="cb-splash" style={{ opacity: s.splashFadingOut ? 0 : 1 }}>
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
          )}

          <div className="cb-app">
            {/* ===== FIXED HEADER ===== */}
            <div className={`cb-header ${isGraph ? 'cb-header-graph' : ''}`}>
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
                      <div className={periodRowClass}>
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

                      {showChartNav && <div className="cb-chart-period-wrap">{periodNav}</div>}

                      {showTicket && (
                        <div
                          className="cb-total-wrap"
                          onTouchStart={this.handleSwipeStart}
                          onTouchEnd={this.handleSwipeEnd}
                          onMouseDown={this.handleSwipeStart}
                          onMouseUp={this.handleSwipeEnd}
                        >
                          {ledgerPeriodButton(-1)}
                          <div className="cb-ticket">
                            <CoinScatter tick={s.coinBurstTick} />
                            <div className="cb-total-label">{t.totalSpent}</div>
                            <div className="cb-total-value">
                              <span className="cb-total-amount">
                                {this.convertAndFormat(s.displayedTotal, s.currency, false)}
                              </span>
                              <CurrencyBadge currency={s.currency} size="md" />
                            </div>
                            <div className="cb-period-pill cb-period-pill-ticket">{this.getPeriodLabel()}</div>
                          </div>
                          {ledgerPeriodButton(1)}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              <div className="cb-perforation" />
            </div>

            {/* ===== SCROLLABLE CONTENT ===== */}
            <div className={`cb-content ${isGraph ? 'cb-content-graph' : ''}`}>
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
              <div className="cb-fab hover-fab press-fab" onClick={this.openAdd}>
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

          {s.toastMsg && (
            <div className={`cb-toast cb-toast-${s.toastVariant}`}>
              {s.toastVariant === 'error' ? '!' : '✓'} {s.toastMsg}
            </div>
          )}

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
                  {v.deleteEntry ? formatShortDate(v.deleteEntry.date, s.language, MONTHS_BY_LANGUAGE, MONTHS) : ''}
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
