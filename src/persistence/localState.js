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

function normalizePersistedState(saved) {
  if (!saved || typeof saved !== 'object') return {};
  const out = {};
  if (Array.isArray(saved.expenses)) out.expenses = saved.expenses;
  if (Array.isArray(saved.categories)) out.categories = saved.categories;
  if (saved.language) out.language = saved.language;
  if (saved.currency) out.currency = saved.currency;
  if (saved.rates) out.rates = normalizeRates(saved.rates);
  if (saved.numberFormat) out.numberFormat = saved.numberFormat;
  if (saved.listGrouping) out.listGrouping = saved.listGrouping;
  if (saved.period) out.period = saved.period;
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
  try {
    const idbState = await loadIndexedDbState();
    if (hasPersistedFields(idbState)) return idbState;

    const localState = loadLocalStorageState();
    if (hasPersistedFields(localState)) {
      await saveIndexedDbState(localState);
      return localState;
    }
  } catch (err) {
    return {};
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
    period: state.period
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
