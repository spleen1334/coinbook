export const STORAGE_KEY = 'coinbook_v1_state';

export function loadPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const saved = JSON.parse(raw);
    const out = {};
    if (Array.isArray(saved.expenses)) out.expenses = saved.expenses;
    if (Array.isArray(saved.categories)) out.categories = saved.categories;
    if (saved.language) out.language = saved.language;
    if (saved.currency) out.currency = saved.currency;
    if (saved.rates) out.rates = saved.rates;
    if (saved.numberFormat) out.numberFormat = saved.numberFormat;
    if (saved.listGrouping) out.listGrouping = saved.listGrouping;
    if (saved.period) out.period = saved.period;
    return out;
  } catch (err) {
    return {};
  }
}

export function pickPersistedState(state) {
  return {
    expenses: state.expenses,
    categories: state.categories,
    language: state.language,
    currency: state.currency,
    rates: state.rates,
    numberFormat: state.numberFormat,
    listGrouping: state.listGrouping,
    period: state.period
  };
}

export function savePersistedState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pickPersistedState(state)));
  } catch (err) {
    /* storage unavailable (private mode, quota) */
  }
}
