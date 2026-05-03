#!/usr/bin/env node
// i18n audit for CertifyCX — diffs en/es/ar locale files.
// Usage: node .claude/skills/i18n-audit/audit.mjs [--full]

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..', '..');
const localesDir = resolve(repoRoot, 'src', 'i18n', 'locales');

const full = process.argv.includes('--full');
const PREVIEW = full ? Infinity : 10;

const files = ['en.json', 'es.json', 'ar.json'];
const data = Object.fromEntries(
  files.map(f => [f, JSON.parse(readFileSync(resolve(localesDir, f), 'utf8'))])
);

function flatten(obj, prefix = '', out = new Map()) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      flatten(v, key, out);
    } else {
      out.set(key, v);
    }
  }
  return out;
}

const flat = Object.fromEntries(
  Object.entries(data).map(([f, obj]) => [f, flatten(obj)])
);

const enKeys = new Set(flat['en.json'].keys());
const esKeys = new Set(flat['es.json'].keys());
const arKeys = new Set(flat['ar.json'].keys());

function diff(a, b) {
  const out = [];
  for (const k of a) if (!b.has(k)) out.push(k);
  return out.sort();
}

const missingInEs = diff(enKeys, esKeys);
const missingInAr = diff(enKeys, arKeys);
const extraInEs = diff(esKeys, enKeys);
const extraInAr = diff(arKeys, enKeys);

const empty = [];
for (const [file, m] of Object.entries(flat)) {
  for (const [k, v] of m) {
    if (v === '' || v === null || v === undefined) empty.push(`${file}: ${k}`);
  }
}

const identicalToEn = { 'es.json': [], 'ar.json': [] };
for (const target of ['es.json', 'ar.json']) {
  for (const [k, v] of flat[target]) {
    const en = flat['en.json'].get(k);
    if (typeof en === 'string' && typeof v === 'string' && en.length > 1 && en === v) {
      identicalToEn[target].push(k);
    }
  }
}

function section(title, items) {
  console.log(`\n## ${title} (${items.length})`);
  if (items.length === 0) { console.log('  OK'); return; }
  for (const item of items.slice(0, PREVIEW)) console.log(`  - ${item}`);
  if (items.length > PREVIEW) console.log(`  ... and ${items.length - PREVIEW} more (run with --full to see all)`);
}

console.log(`# i18n audit — ${enKeys.size} keys in en.json`);
section('Missing in es.json', missingInEs);
section('Missing in ar.json', missingInAr);
section('Extra in es.json (not in en.json)', extraInEs);
section('Extra in ar.json (not in en.json)', extraInAr);
section('Empty values', empty);
section('Likely untranslated (es.json identical to en)', identicalToEn['es.json']);
section('Likely untranslated (ar.json identical to en)', identicalToEn['ar.json']);

// Hard issues = structural drift (missing/extra keys, empty values).
// Soft issues = heuristic "likely untranslated" — frequently legitimate
// (short tokens like brand names, "no", region names). Reported but not failing.
const hardIssues =
  missingInEs.length + missingInAr.length +
  extraInEs.length + extraInAr.length +
  empty.length;

const softIssues =
  identicalToEn['es.json'].length + identicalToEn['ar.json'].length;

if (hardIssues === 0 && softIssues === 0) {
  console.log('\ni18n OK');
} else if (hardIssues === 0) {
  console.log(`\ni18n OK (structural) — ${softIssues} soft findings (likely-untranslated heuristics, often legitimate)`);
} else {
  console.log(`\nAction needed: ${hardIssues} structural findings, ${softIssues} soft findings`);
}

// Exit non-zero ONLY on hard issues so this is safe to use as a pre-commit blocker.
process.exit(hardIssues === 0 ? 0 : 1);
