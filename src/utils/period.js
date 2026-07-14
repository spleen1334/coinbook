import { pad, isoOf, formatShortDate } from './date.js';

function getPeriodBounds(period, offset, today) {
  const y = today.getFullYear(),
    m = today.getMonth(),
    d = today.getDate();
  switch (period) {
    case 'day': {
      const dt = new Date(y, m, d + offset);
      return { start: dt, end: dt };
    }
    case 'week': {
      const end = new Date(y, m, d + offset * 7);
      const start = new Date(end);
      start.setDate(end.getDate() - 6);
      return { start, end };
    }
    case 'year': {
      const yy = y + offset;
      return { start: new Date(yy, 0, 1), end: new Date(yy, 11, 31) };
    }
    case 'month':
    default: {
      const start = new Date(y, m + offset, 1);
      const yy = start.getFullYear(),
        mm = start.getMonth();
      const end = new Date(yy, mm + 1, 0);
      return { start, end };
    }
  }
}

export function getRange(period, offset, today) {
  const { start, end } = getPeriodBounds(period, offset, today);
  if (period === 'year') {
    return [isoOf(start).slice(0, 4) + '-01-01', isoOf(start).slice(0, 4) + '-12-31'];
  }
  return [isoOf(start), isoOf(end)];
}

export function getPeriodLabel(period, offset, lang, today, uiText, monthsByLanguage, months) {
  const t = uiText[lang] || uiText.en;
  const monthList = monthsByLanguage[lang] || months;
  const { start, end } = getPeriodBounds(period, offset, today);
  switch (period) {
    case 'day':
      return offset === 0 ? t.today : formatShortDate(isoOf(start), lang, monthsByLanguage, months);
    case 'week': {
      if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
        return (
          pad(start.getDate()) +
          ' – ' +
          pad(end.getDate()) +
          ' ' +
          monthList[end.getMonth()] +
          " '" +
          String(end.getFullYear()).slice(2)
        );
      }
      return (
        formatShortDate(isoOf(start), lang, monthsByLanguage, months) +
        ' – ' +
        formatShortDate(isoOf(end), lang, monthsByLanguage, months)
      );
    }
    case 'year':
      return String(start.getFullYear());
    case 'month':
    default:
      return monthList[start.getMonth()] + ' (' + pad(start.getMonth() + 1) + ') ' + start.getFullYear();
  }
}
