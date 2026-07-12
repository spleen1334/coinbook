export function pad(n) {
  return String(n).padStart(2, '0');
}

export function isoOf(d) {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

export function formatShortDate(iso, lang, monthsByLang, months) {
  const list = monthsByLang[lang] || months;
  const [y, m, d] = iso.split('-').map(Number);
  return pad(d) + ' ' + list[m - 1] + " '" + String(y).slice(2);
}
