import { isValidDateString, normalizeIdString } from './validate.js';
import { isoOf } from './date.js';

export const RECURRENCE_FREQUENCIES = ['weekly', 'monthly', 'yearly'];

function splitDate(date) {
  return date.split('-').map(Number);
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function dateAt(year, monthIndex, day) {
  return isoOf(new Date(year, monthIndex, Math.min(day, daysInMonth(year, monthIndex))));
}

export function getDefaultRecurrenceEnd(startDate) {
  if (!isValidDateString(startDate)) return '';
  return `${startDate.slice(0, 4)}-12-31`;
}

export function isValidRecurrenceFrequency(frequency) {
  return RECURRENCE_FREQUENCIES.includes(frequency);
}

export function generateRecurringDates(startDate, endDate, frequency) {
  if (!isValidDateString(startDate) || !isValidDateString(endDate)) throw new Error('Invalid recurrence date');
  if (endDate < startDate) throw new Error('Recurrence end date must not precede start date');
  if (!isValidRecurrenceFrequency(frequency)) throw new Error('Invalid recurrence frequency');

  const [startYear, startMonth, startDay] = splitDate(startDate);
  const dates = [];
  let step = 0;
  while (true) {
    let date;
    if (frequency === 'weekly') {
      date = isoOf(new Date(startYear, startMonth - 1, startDay + step * 7));
    } else if (frequency === 'monthly') {
      const monthIndex = startMonth - 1 + step;
      date = dateAt(startYear + Math.floor(monthIndex / 12), monthIndex % 12, startDay);
    } else {
      date = dateAt(startYear + step, startMonth - 1, startDay);
    }
    if (date > endDate) return dates;
    dates.push(date);
    step += 1;
  }
}

export function normalizeRecurrence(value) {
  if (!value || typeof value !== 'object') return null;
  const seriesId = normalizeIdString(value.seriesId);
  if (
    !seriesId ||
    !isValidRecurrenceFrequency(value.frequency) ||
    !isValidDateString(value.startDate) ||
    !isValidDateString(value.endDate) ||
    value.endDate < value.startDate
  ) {
    return null;
  }
  return {
    seriesId,
    frequency: value.frequency,
    startDate: value.startDate,
    endDate: value.endDate
  };
}
