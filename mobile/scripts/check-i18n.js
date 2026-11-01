/* global __dirname */
/*
 * Full i18n audit for FinManage mobile.
 *
 * Checks:
 *  a. Duplicate keys inside the same object, using a raw JSON parser (JSON.parse
 *     silently keeps only the last occurrence, hiding the bug).
 *  b. Keys used as a string in one place and as an object in another (same path
 *     or duplicate-in-object with mixed types).
 *  c. Regression vs the last M3 commit: every leaf from M3 must still exist,
 *     must not change from string to object, and must keep the same value.
 *  d. Every literal t('...') key used in app/ and src/ must exist as a leaf in
 *     both id.json and en.json.
 *  e. Keys present in only one of id.json / en.json.
 *
 * Usage: node scripts/check-i18n.js
 * Baseline ref override: I18N_BASE_REF=<git-ref> node scripts/check-i18n.js
 */
const { readFileSync, readdirSync, statSync } = require('node:fs');
const { join, extname } = require('node:path');
const { execSync } = require('node:child_process');

const ROOT = join(__dirname, '..');
const REPO_ROOT = join(ROOT, '..');
const BASE_REF = process.env.I18N_BASE_REF || '9cce805';
const FILES = ['id', 'en'];

// Intentional renames decided in the M4 i18n fix. The old M3 string key was
// renamed so the new M4 object can own the original path. Values must match.
const BASE_KEY_RENAMES = {
  'auth.forgot_password': 'auth.forgot_password_link',
};

let failed = false;

function fail() {
  failed = true;
}

/* ------------------------------------------------------------------ */
/* Raw JSON parser that records every key occurrence (incl. duplicates) */
/* ------------------------------------------------------------------ */
function parseJSONRaw(text, label) {
  let i = 0;
  const occurrences = new Map();
  const duplicateAt = [];

  function lineAt(pos) {
    return text.slice(0, pos).split('\n').length;
  }

  function skipWhitespace() {
    while (i < text.length && /\s/.test(text[i])) i += 1;
  }

  function parseString() {
    if (text[i] !== '"') throw new Error(`${label}: expected string at ${i}`);
    const start = i;
    i += 1;
    let out = '';
    while (i < text.length) {
      const ch = text[i];
      if (ch === '"') {
        i += 1;
        return out;
      }
      if (ch === '\\') {
        const next = text[i + 1];
        const map = { '"': '"', '\\': '\\', '/': '/', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' };
        if (next === 'u') {
          out += String.fromCharCode(parseInt(text.slice(i + 2, i + 6), 16));
          i += 6;
        } else if (next in map) {
          out += map[next];
          i += 2;
        } else {
          throw new Error(`${label}: bad escape at ${i}`);
        }
        continue;
      }
      out += ch;
      i += 1;
    }
    throw new Error(`${label}: unterminated string starting at ${start}`);
  }

  function parseValue(path) {
    skipWhitespace();
    const ch = text[i];
    if (ch === '{') return parseObject(path);
    if (ch === '[') return parseArray(path);
    if (ch === '"') return parseString();
    if (text.startsWith('true', i)) { i += 4; return true; }
    if (text.startsWith('false', i)) { i += 5; return false; }
    if (text.startsWith('null', i)) { i += 4; return null; }
    const start = i;
    while (i < text.length && /[-+0-9.eE]/.test(text[i])) i += 1;
    if (start === i) throw new Error(`${label}: unexpected '${ch}' at ${i}`);
    return Number(text.slice(start, i));
  }

  function record(path, value, keyLine) {
    const type = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
    if (!occurrences.has(path)) occurrences.set(path, []);
    occurrences.get(path).push({ type, value, line: keyLine });
  }

  function parseObject(path) {
    const obj = {};
    const localKeys = new Set();
    i += 1;
    skipWhitespace();
    if (text[i] === '}') { i += 1; return obj; }
    while (true) {
      skipWhitespace();
      const keyLine = lineAt(i);
      const key = parseString();
      const childPath = path ? `${path}.${key}` : key;
      skipWhitespace();
      if (text[i] !== ':') throw new Error(`${label}: expected ':' at ${i}`);
      i += 1;
      skipWhitespace();
      const value = parseValue(childPath);
      record(childPath, value, keyLine);
      if (localKeys.has(key)) duplicateAt.push({ path: childPath, line: keyLine, value });
      localKeys.add(key);
      obj[key] = value;
      skipWhitespace();
      if (text[i] === ',') { i += 1; continue; }
      if (text[i] === '}') { i += 1; return obj; }
      throw new Error(`${label}: expected ',' or '}' at ${i}`);
    }
  }

  function parseArray(path) {
    const arr = [];
    i += 1;
    skipWhitespace();
    if (text[i] === ']') { i += 1; return arr; }
    let idx = 0;
    while (true) {
      skipWhitespace();
      arr.push(parseValue(`${path}[${idx}]`));
      idx += 1;
      skipWhitespace();
      if (text[i] === ',') { i += 1; continue; }
      if (text[i] === ']') { i += 1; return arr; }
      throw new Error(`${label}: expected ',' or ']' at ${i}`);
    }
  }

  const value = parseValue('');
  skipWhitespace();
  if (i !== text.length) throw new Error(`${label}: trailing content at ${i}`);
  return { value, occurrences, duplicateAt };
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
function isPlainObject(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function flattenLeaves(obj, prefix = '', out = new Map()) {
  if (isPlainObject(obj)) {
    for (const [k, v] of Object.entries(obj)) {
      flattenLeaves(v, prefix ? `${prefix}.${k}` : k, out);
    }
  } else {
    out.set(prefix, obj);
  }
  return out;
}

function leafType(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}

function getAllLeafPaths(obj) {
  return new Set(flattenLeaves(obj).keys());
}

function collectSourceFiles(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) collectSourceFiles(full, files);
    else if (['.ts', '.tsx'].includes(extname(entry))) files.push(full);
  }
  return files;
}

function extractTranslationKeys() {
  const used = new Map();
  const dirs = [join(ROOT, 'app'), join(ROOT, 'src')];
  const files = dirs.flatMap((d) => (statSync(d).isDirectory() ? collectSourceFiles(d) : []));
  const patterns = [
    /\bt\(\s*'((?:\\.|[^'\\])*)'/g,
    /\bt\(\s*"((?:\\.|[^"\\])*)"/g,
  ];
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    for (const re of patterns) {
      re.lastIndex = 0;
      let match;
      while ((match = re.exec(source)) !== null) {
        const key = match[1];
        if (key.includes('${')) continue;
        if (!used.has(key)) used.set(key, []);
        used.get(key).push(file.replace(ROOT, 'mobile').replace(/\\/g, '/'));
      }
    }
  }
  return used;
}

function loadCurrent(name) {
  const raw = readFileSync(join(ROOT, 'src', 'i18n', `${name}.json`), 'utf8');
  return { raw, parsed: parseJSONRaw(raw, `${name}.json`) };
}

function loadBaseline(name) {
  try {
    const raw = execSync(`git show ${BASE_REF}:mobile/src/i18n/${name}.json`, {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    });
    return { raw, parsed: parseJSONRaw(raw, `${name}-${BASE_REF}.json`) };
  } catch (err) {
    console.error(`Could not load baseline ${BASE_REF} for ${name}.json: ${err.message}`);
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Run checks                                                          */
/* ------------------------------------------------------------------ */
const current = Object.fromEntries(FILES.map((f) => [f, loadCurrent(f)]));
const baseline = Object.fromEntries(FILES.map((f) => [f, loadBaseline(f)]));

console.log('='.repeat(78));
console.log(`i18n audit — baseline ${BASE_REF}`);
console.log('='.repeat(78));

for (const file of FILES) {
  const { parsed } = current[file];
  const label = `${file}.json`;

  console.log(`\n### ${label}`);

  /* a. duplicate keys */
  if (parsed.duplicateAt.length === 0) {
    console.log('  (a) duplicate keys: none');
  } else {
    fail();
    console.log(`  (a) duplicate keys: ${parsed.duplicateAt.length}`);
    for (const d of parsed.duplicateAt) {
      console.log(`      line ${d.line}: ${d.path} (last value type: ${leafType(d.value)})`);
    }
  }

  /* b. string vs object conflicts */
  const mixed = [];
  for (const [path, occ] of parsed.occurrences) {
    if (occ.length < 2) continue;
    const kinds = new Set(occ.map((o) => (isPlainObject(o.value) ? 'object' : 'string')));
    if (kinds.has('object') && kinds.has('string')) {
      mixed.push({ path, occ });
    }
  }
  if (mixed.length === 0) {
    console.log('  (b) string/object conflicts: none');
  } else {
    fail();
    console.log(`  (b) string/object conflicts: ${mixed.length}`);
    for (const m of mixed) {
      const details = m.occ.map((o) => `${isPlainObject(o.value) ? 'object' : 'string'}@line${o.line}`).join(', ');
      console.log(`      ${m.path}: ${details}`);
    }
  }

  /* c. regression vs M3 */
  const base = baseline[file];
  if (!base) {
    fail();
    console.log('  (c) baseline comparison: SKIPPED (baseline unavailable)');
  } else {
    const baseLeaves = flattenLeaves(base.parsed.value);
    const currentLeaves = flattenLeaves(parsed.value);
    const missing = [];
    const typeChanged = [];
    const valueChanged = [];
    const renamed = [];
    for (const [path, oldValue] of baseLeaves) {
      if (!currentLeaves.has(path)) {
        const renamedTo = BASE_KEY_RENAMES[path];
        if (renamedTo && currentLeaves.has(renamedTo) && currentLeaves.get(renamedTo) === oldValue) {
          renamed.push({ path, to: renamedTo });
          continue;
        }
        const presentAsObject = parsed.occurrences.has(path);
        missing.push({ path, presentAsObject });
      } else {
        const newValue = currentLeaves.get(path);
        if (typeof oldValue === 'string' && isPlainObject(newValue)) {
          typeChanged.push({ path, from: 'string', to: 'object' });
        } else if (typeof oldValue === 'string' && oldValue !== newValue) {
          valueChanged.push({ path, from: oldValue, to: newValue });
        }
      }
    }
    if (missing.length === 0 && typeChanged.length === 0 && valueChanged.length === 0) {
      console.log(`  (c) regressions vs M3: none (${baseLeaves.size} baseline leaves intact)`);
      for (const r of renamed) {
        console.log(`      intentional rename: ${r.path} -> ${r.to} (value preserved)`);
      }
    } else {
      fail();
      console.log(`  (c) regressions vs M3: ${missing.length} missing, ${typeChanged.length} type-changed, ${valueChanged.length} value-changed`);
      for (const m of missing) {
        console.log(`      MISSING: ${m.path}${m.presentAsObject ? ' (path now exists as object/non-leaf)' : ''}`);
      }
      for (const t of typeChanged) {
        console.log(`      TYPE CHANGED: ${t.path} (${t.from} -> ${t.to})`);
      }
      for (const v of valueChanged) {
        console.log(`      VALUE CHANGED: ${v.path} ("${v.from}" -> "${v.to}")`);
      }
    }
  }
}

/* d. t() usage */
const used = extractTranslationKeys();
const idLeaves = getAllLeafPaths(current.id.parsed.value);
const enLeaves = getAllLeafPaths(current.en.parsed.value);
const missingUsages = [];
for (const [key, refs] of [...used.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  const missingId = !idLeaves.has(key);
  const missingEn = !enLeaves.has(key);
  if (missingId || missingEn) {
    missingUsages.push({ key, missingId, missingEn, refs });
  }
}
console.log('\n### t() usage in app/ and src/');
console.log(`  literal keys found: ${used.size}`);
if (missingUsages.length === 0) {
  console.log('  (d) all literal t() keys resolve to leaves in both files');
} else {
  fail();
  console.log(`  (d) unresolved t() keys: ${missingUsages.length}`);
  for (const m of missingUsages) {
    const where = [];
    if (m.missingId) where.push('id');
    if (m.missingEn) where.push('en');
    const files = [...new Set(m.refs)].join(', ');
    console.log(`      ${m.key} — missing in: ${where.join(', ')} — used in: ${files}`);
  }
}

/* e. keys only in one file */
const onlyId = [...idLeaves].filter((k) => !enLeaves.has(k));
const onlyEn = [...enLeaves].filter((k) => !idLeaves.has(k));
console.log('\n### key set parity');
if (onlyId.length === 0 && onlyEn.length === 0) {
  console.log(`  (e) id.json and en.json have identical leaf keys (${idLeaves.size} leaves)`);
} else {
  fail();
  if (onlyId.length) {
    console.log(`  (e) only in id.json (${onlyId.length}):`);
    for (const k of onlyId) console.log(`      ${k}`);
  }
  if (onlyEn.length) {
    console.log(`  (e) only in en.json (${onlyEn.length}):`);
    for (const k of onlyEn) console.log(`      ${k}`);
  }
}

console.log('\n' + '='.repeat(78));
if (failed) {
  console.log('RESULT: FAIL');
  process.exit(1);
}
console.log('RESULT: PASS');
