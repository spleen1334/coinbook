#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { parseCsv, csvEscape } from '../src/utils/csv.js';

const DEFAULT_INPUT = 'samples/private/monefy/Monefy.Data.13-07-2026.csv';
const DEFAULT_OUTPUT = 'samples/private/generated/coinbook-import.csv';
const EXPECTED_HEADER = [
  'date',
  'account',
  'category',
  'amount',
  'currency',
  'converted amount',
  'currency',
  'description'
];
const CATEGORY_ALIASES = new Map([
  ['Communications', 'Communication'],
  ['Gmz', 'Games'],
  ['Kultura', 'Culture'],
  ['Čajevi', 'Tea'],
  ['Motori', 'Motorcycles'],
  ['Gorivo', 'Fuel'],
  ['Streljana', 'Shooting range'],
  ['Porodica', 'Family'],
  ['Hobi', 'Hobbies'],
  ['Food Junk', 'Junk']
]);

function printUsage() {
  console.log(`Usage: node scripts/convert-monefy-to-coinbook.mjs [options] [input.csv] [output.csv]

Options:
  --dry-run          Parse and summarize without writing output
  --include-account  Append account/currency metadata to Coinbook note
  --no-aliases       Do not map known Monefy categories to Coinbook aliases
  -h, --help         Show this help

Defaults:
  input:  ${DEFAULT_INPUT}
  output: ${DEFAULT_OUTPUT}`);
}

function parseArgs(argv) {
  const options = { dryRun: false, includeAccount: false, aliases: true };
  const positional = [];

  for (const arg of argv) {
    if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--include-account') options.includeAccount = true;
    else if (arg === '--no-aliases') options.aliases = false;
    else if (arg === '-h' || arg === '--help') options.help = true;
    else if (arg.startsWith('-')) throw new Error(`Unknown option: ${arg}`);
    else positional.push(arg);
  }

  if (positional.length > 2) throw new Error('Expected at most input and output paths.');
  return {
    ...options,
    inputPath: positional[0] || DEFAULT_INPUT,
    outputPath: positional[1] || DEFAULT_OUTPUT
  };
}

function normalizeAccount(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

function parseMonefyDate(value) {
  const match = String(value || '')
    .trim()
    .match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (date.getFullYear() !== Number(yyyy) || date.getMonth() !== Number(mm) - 1 || date.getDate() !== Number(dd))
    return null;
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
}

function parseAmount(value) {
  const normalized = String(value || '')
    .trim()
    .replace(/,/g, '');
  if (!normalized) return Number.NaN;
  return Number(normalized);
}

function validateHeader(header) {
  if (!header || header.length < EXPECTED_HEADER.length) return false;
  return EXPECTED_HEADER.every(
    (name, index) =>
      String(header[index] || '')
        .trim()
        .toLowerCase() === name
  );
}

function buildNote(description, row, includeAccount) {
  const note = String(description || '').trim();
  if (!includeAccount) return note;

  const meta = [`account: ${row.account || 'unknown'}`, `currency: ${row.currency || 'unknown'}`];
  return note ? `${note} (${meta.join(', ')})` : meta.join(', ');
}

function convertRows(rows, options) {
  const out = [['date', 'category', 'amount', 'note']];
  const summary = {
    totalRows: Math.max(rows.length - 1, 0),
    imported: 0,
    skippedSavings: 0,
    skippedPositiveOrZero: 0,
    skippedNonRsd: 0,
    invalidRows: 0,
    categories: new Set(),
    currencies: new Set(),
    dateMin: null,
    dateMax: null
  };

  if (!validateHeader(rows[0])) {
    throw new Error(`Unexpected Monefy header. Expected: ${EXPECTED_HEADER.join(',')}`);
  }

  for (const row of rows.slice(1)) {
    const data = {
      date: row[0],
      account: row[1],
      category: row[2],
      amount: row[3],
      currency: row[4],
      convertedAmount: row[5],
      convertedCurrency: row[6],
      description: row[7]
    };

    if (normalizeAccount(data.account) === 'stednja') {
      summary.skippedSavings += 1;
      continue;
    }

    const amount = parseAmount(data.amount);
    if (!Number.isFinite(amount)) {
      summary.invalidRows += 1;
      continue;
    }

    if (amount >= 0) {
      summary.skippedPositiveOrZero += 1;
      continue;
    }

    const currency = String(data.currency || '')
      .trim()
      .toUpperCase();
    summary.currencies.add(currency || '(empty)');
    if (currency !== 'RSD') {
      summary.skippedNonRsd += 1;
      continue;
    }

    const date = parseMonefyDate(data.date);
    if (!date) {
      summary.invalidRows += 1;
      continue;
    }

    const rawCategory = String(data.category || '').trim() || 'Other';
    const category = options.aliases ? CATEGORY_ALIASES.get(rawCategory) || rawCategory : rawCategory;
    const outputAmount = Math.abs(amount).toFixed(2);
    const note = buildNote(data.description, data, options.includeAccount);

    out.push([date, category, outputAmount, note]);
    summary.imported += 1;
    summary.categories.add(category);
    summary.dateMin = !summary.dateMin || date < summary.dateMin ? date : summary.dateMin;
    summary.dateMax = !summary.dateMax || date > summary.dateMax ? date : summary.dateMax;
  }

  return { rows: out, summary };
}

function toCsv(rows) {
  return rows.map((row) => row.map(csvEscape).join(',')).join('\n') + '\n';
}

function printSummary(summary, options) {
  console.log(options.dryRun ? 'Dry run complete.' : 'Conversion complete.');
  console.log(`Input rows: ${summary.totalRows}`);
  console.log(`Imported expenses: ${summary.imported}`);
  console.log(`Skipped savings account: ${summary.skippedSavings}`);
  console.log(`Skipped positive/zero: ${summary.skippedPositiveOrZero}`);
  console.log(`Skipped non-RSD: ${summary.skippedNonRsd}`);
  console.log(`Invalid rows: ${summary.invalidRows}`);
  console.log(`Date range: ${summary.dateMin || 'n/a'} to ${summary.dateMax || 'n/a'}`);
  console.log(`Categories: ${summary.categories.size}`);
  console.log(`Currencies seen: ${[...summary.currencies].sort().join(', ') || 'n/a'}`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printUsage();
    return;
  }

  const inputPath = resolve(options.inputPath);
  const outputPath = resolve(options.outputPath);
  const input = await readFile(inputPath, 'utf8');
  const parsed = parseCsv(input);
  const { rows, summary } = convertRows(parsed, options);

  printSummary(summary, options);

  if (!options.dryRun) {
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, toCsv(rows), 'utf8');
    console.log(`Wrote: ${outputPath}`);
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exitCode = 1;
});
