import { normalizeAmount, normalizeColor, normalizeIdString, normalizeNote, isValidDateString } from '../utils/validate.js';

export const STORAGE_KEY = 'coinbook_v1_state';
const DB_NAME = STORAGE_KEY;
const DB_VERSION = 1;
const STORE_NAME = 'snapshots';
export const DEFAULT_RATES = { RSD: 1, EUR: 0.00852051, USD: 0.0097202 };

function getLocalStorage() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch (err) {
    return null;
  }
}

const SORT_DIRS = ['asc', 'desc'];

function normalizeSortDir(value, fallback) {
  return SORT_DIRS.includes(value) ? value : fallback;
}

function normalizeCategoryRecords(raw) {
  if (!Array.isArray(raw)) return null;
  const seenIds = new Set();
  const result = [];
  raw.forEach((c) => {
    if (!c || typeof c !== 'object') return;
    const id = normalizeIdString(c.id);
    const name = typeof c.name === 'string' ? c.name.trim().slice(0, 100) : '';
    if (!id || !name || seenIds.has(id)) return;
    seenIds.add(id);
    result.push({ id, name, color: normalizeColor(c.color, '#8a7355') });
  });
  return result;
}

function normalizeExpenseRecords(raw, validCategoryIds) {
  if (!Array.isArray(raw)) return null;
  const seenIds = new Set();
  const result = [];
  raw.forEach((e) => {
    if (!e || typeof e !== 'object') return;
    const id = normalizeIdString(e.id);
    if (!id || seenIds.has(id)) return;
    if (!isValidDateString(e.date)) return;
    const amount = normalizeAmount(e.amount, null);
    if (amount === null) return;
    seenIds.add(id);
    result.push({
      id,
      amount,
      date: e.date,
      categoryId: validCategoryIds.has(e.categoryId) ? e.categoryId : 'other',
      note: normalizeNote(e.note)
    });
  });
  return result;
}

export function normalizePersistedState(saved) {
  if (!saved || typeof saved !== 'object') return {};
  const out = {};
  const categories = normalizeCategoryRecords(saved.categories);
  if (categories) out.categories = categories;
  if (Array.isArray(saved.expenses)) {
    const validCategoryIds = new Set(['other', ...(categories || []).map((c) => c.id)]);
    out.expenses = normalizeExpenseRecords(saved.expenses, validCategoryIds);
  }
  if (saved.language) out.language = saved.language;
  if (saved.currency) out.currency = saved.currency;
  if (saved.rates) out.rates = normalizeRates(saved.rates);
  if (saved.numberFormat) out.numberFormat = saved.numberFormat;
  if (saved.listGrouping) out.listGrouping = saved.listGrouping;
  if (saved.period) out.period = saved.period;
  if (saved.dateSortDir) out.dateSortDir = normalizeSortDir(saved.dateSortDir, 'desc');
  if (saved.categorySortDir) out.categorySortDir = normalizeSortDir(saved.categorySortDir, 'desc');
  if (saved.ungroupedSortDir) out.ungroupedSortDir = normalizeSortDir(saved.ungroupedSortDir, 'desc');
  return out;
}

function toPositiveNumber(value) {
  const number = Number(String(value).replace(',', '.'));
  return Number.isFinite(number) && number > 0 ? number : null;
}

function normalizeRates(rates) {
  if (!rates || typeof rates !== 'object') return DEFAULT_RATES;

  const oldRsdPerUsd = toPositiveNumber(rates.RSD);
  const oldUsdPerUsd = toPositiveNumber(rates.USD);
  const oldEurPerUsd = toPositiveNumber(rates.EUR);

  if (oldRsdPerUsd && oldRsdPerUsd > 10 && oldUsdPerUsd && Math.abs(oldUsdPerUsd - 1) < 0.05) {
    return {
      RSD: 1,
      EUR: oldEurPerUsd ? oldEurPerUsd / oldRsdPerUsd : DEFAULT_RATES.EUR,
      USD: 1 / oldRsdPerUsd
    };
  }

  return {
    RSD: 1,
    EUR: toPositiveNumber(rates.EUR) || DEFAULT_RATES.EUR,
    USD: toPositiveNumber(rates.USD) || DEFAULT_RATES.USD
  };
}

function loadLocalStorageState() {
  try {
    const storage = getLocalStorage();
    if (!storage) return {};
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return normalizePersistedState(JSON.parse(raw));
  } catch (err) {
    return {};
  }
}

function removeLocalStorageState() {
  try {
    const storage = getLocalStorage();
    if (storage) storage.removeItem(STORAGE_KEY);
  } catch (err) {
    /* storage unavailable (private mode, quota) */
  }
}

function hasPersistedFields(state) {
  return Object.keys(state || {}).length > 0;
}

function openDb() {
  return new Promise((resolve, reject) => {
    try {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB unavailable'));
        return;
      }
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('IndexedDB open failed'));
      request.onblocked = () => reject(new Error('IndexedDB open blocked'));
    } catch (err) {
      reject(err);
    }
  });
}

function idbRequest(db, mode, method, value) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (fn, result) => {
      if (settled) return;
      settled = true;
      fn(result);
    };
    try {
      const tx = db.transaction(STORE_NAME, mode);
      const store = tx.objectStore(STORE_NAME);
      const request = method === 'get' ? store.get(STORAGE_KEY) : store.put(value, STORAGE_KEY);
      request.onsuccess = () => {
        if (method === 'get') finish(resolve, request.result);
      };
      request.onerror = () => finish(reject, request.error || new Error('IndexedDB request failed'));
      tx.oncomplete = () => {
        if (method !== 'get') finish(resolve, request.result);
      };
      tx.onabort = () => finish(reject, tx.error || new Error('IndexedDB transaction aborted'));
      tx.onerror = () => finish(reject, tx.error || new Error('IndexedDB transaction failed'));
    } catch (err) {
      finish(reject, err);
    }
  });
}

async function loadIndexedDbState() {
  const db = await openDb();
  try {
    const saved = await idbRequest(db, 'readonly', 'get');
    return normalizePersistedState(saved);
  } finally {
    db.close();
  }
}

async function saveIndexedDbState(state) {
  const db = await openDb();
  try {
    await idbRequest(db, 'readwrite', 'put', pickPersistedState(state));
    removeLocalStorageState();
  } finally {
    db.close();
  }
}

export async function loadPersistedState() {
  let idbState = {};
  try {
    idbState = await loadIndexedDbState();
  } catch (err) {
    /* IndexedDB unavailable or read failed; fall back to localStorage below. */
  }
  if (hasPersistedFields(idbState)) return idbState;

  const localState = loadLocalStorageState();
  if (hasPersistedFields(localState)) {
    try {
      await saveIndexedDbState(localState);
    } catch (err) {
      /* Best-effort migration to IndexedDB; keep the localStorage data either way. */
    }
    return localState;
  }
  return {};
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
    period: state.period,
    dateSortDir: state.dateSortDir,
    categorySortDir: state.categorySortDir,
    ungroupedSortDir: state.ungroupedSortDir
  };
}

let pendingSave = null;
let queuedSave = null;

export function savePersistedStateAsync(state) {
  queuedSave = pickPersistedState(state);
  if (pendingSave) return pendingSave;

  pendingSave = Promise.resolve()
    .then(async () => {
      while (queuedSave) {
        const nextSave = queuedSave;
        queuedSave = null;
        try {
          await saveIndexedDbState(nextSave);
        } catch (err) {
          /* IndexedDB unavailable; keep in-memory state only. */
        }
      }
    })
    .finally(() => {
      pendingSave = null;
      if (queuedSave) savePersistedStateAsync(queuedSave);
    });

  return pendingSave;
}
