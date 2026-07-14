import React from 'react';
import { CATEGORY_DEFINITIONS, CATEGORY_SWATCHES } from './data/categories.js';
import { DEMO_EXPENSES } from './data/demoExpenses.js';
import { MONTHS, MONTHS_BY_LANGUAGE, CATEGORY_NAMES_BY_LANGUAGE, UI_TEXT } from './data/i18n.js';
import { LedgerScreen } from './components/LedgerScreen.jsx';
import { ChartScreen } from './components/ChartScreen.jsx';
import { SettingsScreen } from './components/SettingsScreen.jsx';
import { AddSheet } from './components/AddSheet.jsx';
import { isoOf, formatShortDate } from './utils/date.js';
import { getRange as getRange$, getPeriodLabel as getPeriodLabel$ } from './utils/period.js';
import {
  convertAndFormat as convertAndFormat$,
  convertAndFormatParts as convertAndFormatParts$
} from './utils/format.js';
import { downloadFile } from './utils/download.js';
import { fuzzyMatch } from './utils/search.js';
import { defaultCatColor } from './utils/coin.js';
import {
  DEFAULT_RATES,
  loadPersistedState,
  savePersistedStateAsync,
  pickPersistedState
} from './persistence/localState.js';
import { createTotalAnimator } from './hooks/useAnimatedTotal.js';
import { playChaChing } from './utils/chaChing.js';
import { buildViewData } from './selectors/getViewData.js';
import { Splash } from './components/Splash.jsx';
import { AppHeader } from './components/AppHeader.jsx';
import { AppFooter } from './components/AppFooter.jsx';
import { DeleteModal } from './components/DeleteModal.jsx';
import { DeleteAllModal } from './components/DeleteAllModal.jsx';
import { SearchPopup } from './components/SearchPopup.jsx';
import { buildJsonExport, parseJsonImport } from './importExport/json.js';
import { buildCsvExport, parseCsvImport } from './importExport/csv.js';

function today() {
  return new Date();
}

function buildSeedExpenses() {
  return DEMO_EXPENSES.map((s, i) => {
    const [amount, dayOffset, categoryId, note] = s;
    const d = today();
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
      addDate: isoOf(today()),
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
    this._totalAnimator = createTotalAnimator({
      getValue: () => this.state.displayedTotal,
      setValue: (val) => this.setState({ displayedTotal: val })
    });
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
    this._totalAnimator.cancel();
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
        prev.period !== s.period ||
        prev.dateSortDir !== s.dateSortDir ||
        prev.categorySortDir !== s.categorySortDir ||
        prev.ungroupedSortDir !== s.ungroupedSortDir)
    ) {
      savePersistedStateAsync(s);
    }
    this._persistSnapshot = pickPersistedState(s);

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

  async hydratePersistedState() {
    const persistedState = await loadPersistedState();
    if (!this._mounted) return;
    const hydratedState = { ...this.state, ...persistedState, persistenceReady: true };
    this._persistSnapshot = pickPersistedState(hydratedState);
    this.setState({ ...persistedState, persistenceReady: true });
  }

  isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  }

  getText() {
    return UI_TEXT[this.state.language] || UI_TEXT.en;
  }

  getRange() {
    return getRange$(this.state.period, this.state.periodOffset, today());
  }

  getPeriodLabel() {
    return getPeriodLabel$(
      this.state.period,
      this.state.periodOffset,
      this.state.language,
      today(),
      UI_TEXT,
      MONTHS_BY_LANGUAGE,
      MONTHS
    );
  }

  getFilteredExpenses() {
    const lang = this.state.language;
    const [start, end] = this.getRange();
    const catById = Object.create(null);
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
    return convertAndFormat$(amount, cur, this.state.rates, this.state.numberFormat, includeCurrency);
  }

  convertAndFormatParts(amount, cur) {
    return convertAndFormatParts$(amount, cur, this.state.rates, this.state.numberFormat);
  }

  // ---------- total counter animation ----------

  animateTotal = (target, fromZero) => {
    this._totalAnimator.animate(target, fromZero);
  };

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
          isoOf(today())
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
          isoOf(today())
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
      addDate: isoOf(today()),
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
      const date = this.state.addDate || isoOf(today());
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
      playChaChing();
      this.showToast(UI_TEXT[this.state.language]?.savedToast || 'Saved');
    } else {
      const id = 'e' + Date.now();
      const entry = {
        id,
        amount: amt,
        date: this.state.addDate || isoOf(today()),
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
      playChaChing();
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

  // ---------- derived view data ----------

  getViewData() {
    return buildViewData(this);
  }

  render() {
    const s = this.state;

    if (!s.persistenceReady) {
      return (
        <div className="cb-outer">
          <div className="cb-phone">
            <Splash />
          </div>
        </div>
      );
    }

    const v = this.getViewData();
    const t = v.t;
    const isSettings = s.screen === 'settings';
    const isHome = s.screen === 'home';
    const isGraph = s.screen === 'graph';

    return (
      <div className="cb-outer">
        <div className="cb-phone">
          {s.showSplash && <Splash fadingOut={s.splashFadingOut} />}

          <div className="cb-app">
            {/* ===== FIXED HEADER ===== */}
            <AppHeader app={this} s={s} v={v} t={t} />

            {/* ===== SCROLLABLE CONTENT ===== */}
            <div className={`cb-content ${isGraph ? 'cb-content-graph' : ''}`}>
              {isSettings && <SettingsScreen app={this} s={s} v={v} t={t} />}
              {isHome && <LedgerScreen key={s.swipeTick} anim={v.contentAnim} v={v} t={t} />}
              {isGraph && <ChartScreen key={s.swipeTick} anim={v.contentAnim} v={v} t={t} />}
            </div>

            {/* ===== FIXED FOOTER ===== */}
            <AppFooter app={this} s={s} t={t} />
          </div>

          {s.toastMsg && (
            <div className={`cb-toast cb-toast-${s.toastVariant}`}>
              {s.toastVariant === 'error' ? '!' : '✓'} {s.toastMsg}
            </div>
          )}

          {s.searchOpen && <SearchPopup app={this} s={s} v={v} />}

          {s.showAdd && <AddSheet app={this} s={s} v={v} t={t} />}

          {s.deleteModalId && <DeleteModal app={this} s={s} v={v} t={t} />}

          {s.deleteAllOpen && <DeleteAllModal app={this} s={s} t={t} />}
        </div>
      </div>
    );
  }
}
