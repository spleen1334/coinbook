const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const MAX_NOTE_LENGTH = 300;
const MAX_AMOUNT = 1e12;

export function isValidDateString(value) {
  if (typeof value !== 'string' || !ISO_DATE_RE.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

export function normalizeDateString(value, fallback) {
  return isValidDateString(value) ? value : fallback;
}

export function normalizeAmount(value, fallback = 0) {
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (!Number.isFinite(num) || num <= 0 || num > MAX_AMOUNT) return fallback;
  return Math.round(num * 100) / 100;
}

export function normalizeNote(value) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, MAX_NOTE_LENGTH);
}

export function normalizeColor(value, fallback) {
  return typeof value === 'string' && HEX_COLOR_RE.test(value.trim()) ? value.trim() : fallback;
}

export function normalizeIdString(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}
