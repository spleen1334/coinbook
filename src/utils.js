export function pad(n) {
  return String(n).padStart(2, '0');
}

export function isoOf(d) {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

export function defaultCatColor(i) {
  return 'hsl(' + Math.round((i * 137.508) % 360) + ', 32%, 34%)';
}

// Layered radial-gradient overlay that gives any flat category color the
// same coin-like shading (light highlight top-left, shadow bottom-right)
// used throughout the ledger, category picker, and chart legend.
export function coinFace(color) {
  return (
    'radial-gradient(circle at 32% 26%, rgba(255,255,255,0.55), rgba(255,255,255,0) 45%), ' +
    'radial-gradient(circle at 72% 84%, rgba(0,0,0,0.35), rgba(0,0,0,0) 55%), ' +
    color
  );
}

export function formatNum(n, fmt) {
  fmt = fmt || { thousands: true, thousandsChar: ',', decimals: 2, decimalChar: '.' };
  const neg = n < 0;
  const fixed = Math.abs(n).toFixed(fmt.decimals);
  let [intPart, decPart] = fixed.split('.');
  if (fmt.thousands) intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, fmt.thousandsChar);
  let out = intPart;
  if (fmt.decimals > 0) out += fmt.decimalChar + decPart;
  return (neg ? '-' : '') + out;
}

export function fmtMoney(n, currency, fmt) {
  const numStr = formatNum(n, fmt);
  switch (currency) {
    case 'EUR': return numStr + ' \u20ac';
    case 'RSD': return numStr + ' \u0434\u0438\u043d.';
    case 'USD':
    default: return '$' + numStr;
  }
}

export function fmtShort(iso, lang, monthsByLang, months) {
  const list = monthsByLang[lang] || months;
  const [y, m, d] = iso.split('-').map(Number);
  return pad(d) + ' ' + list[m - 1] + " '" + String(y).slice(2);
}

export function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function csvEscape(v) {
  const s = String(v == null ? '' : v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export function fuzzyMatch(needle, haystack) {
  if (!needle) return true;
  let i = 0;
  for (let j = 0; j < haystack.length && i < needle.length; j++) {
    if (haystack[j] === needle[i]) i++;
  }
  return i === needle.length;
}

export function parseCsv(text) {
  return text.split(/\r?\n/).filter((l) => l.trim().length).map((line) => {
    const out = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQ) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') { inQ = false; }
        else cur += ch;
      } else if (ch === '"') inQ = true;
      else if (ch === ',') { out.push(cur); cur = ''; }
      else cur += ch;
    }
    out.push(cur);
    return out;
  });
}
