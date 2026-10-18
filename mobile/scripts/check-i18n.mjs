// Verifies that src/i18n/id.json and en.json have identical key sets, and that
// every error code in docs/contract.md section 1 has a message in both languages.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const load = (name) => JSON.parse(readFileSync(join(root, 'src', 'i18n', `${name}.json`), 'utf8'));

function flatten(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null ? flatten(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

const id = new Set(flatten(load('id')));
const en = new Set(flatten(load('en')));
const onlyId = [...id].filter((k) => !en.has(k));
const onlyEn = [...en].filter((k) => !id.has(k));

const contractCodes = [
  'VALIDATION_ERROR', 'UNAUTHORIZED', 'INVALID_CREDENTIALS', 'EMAIL_TAKEN', 'NOT_FOUND', 'CATEGORY_DUPLICATE',
  'CATEGORY_IN_USE', 'CATEGORY_TYPE_LOCKED', 'BUDGET_DUPLICATE', 'DEPOSIT_EXCEEDS_TARGET', 'GOAL_COMPLETED',
  'TARGET_BELOW_SAVED', 'WITHDRAWAL_EXCEEDS_SAVED', 'TOPUP_EXCEEDS_SAVED', 'FILE_TOO_LARGE', 'UNSUPPORTED_FILE',
  'IMPORT_HEADER_MISMATCH', 'IMPORT_INVALID_FILE', 'IMPORT_LIMIT_EXCEEDED', 'CONSENT_REQUIRED', 'RATE_LIMITED',
  'SCAN_QUOTA_EXCEEDED', 'SCAN_FAILED', 'OTP_INVALID_OR_EXPIRED', 'INTERNAL_ERROR',
];
const missingCodes = contractCodes.filter((c) => !id.has(`errors.${c}`) || !en.has(`errors.${c}`));

let failed = false;
if (onlyId.length) { failed = true; console.error('Only in id.json:', onlyId.join(', ')); }
if (onlyEn.length) { failed = true; console.error('Only in en.json:', onlyEn.join(', ')); }
if (missingCodes.length) { failed = true; console.error('Missing error codes:', missingCodes.join(', ')); }

if (failed) process.exit(1);
console.log(`OK: id.json and en.json have identical keys (${id.size} keys); all ${contractCodes.length} error codes mapped.`);
