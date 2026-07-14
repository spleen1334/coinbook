export function csvEscape(v) {
  let s = String(v == null ? '' : v);
  // Neutralize spreadsheet formula injection (Excel/Sheets execute cells starting with these chars).
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cur = '';
  let inQ = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"' && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQ = false;
      } else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ',') {
      row.push(cur);
      cur = '';
    } else if (ch === '\n' || ch === '\r') {
      row.push(cur);
      if (row.some((v) => v.trim().length)) rows.push(row);
      row = [];
      cur = '';
      if (ch === '\r' && text[i + 1] === '\n') i++;
    } else cur += ch;
  }

  row.push(cur);
  if (row.some((v) => v.trim().length)) rows.push(row);
  return rows;
}
