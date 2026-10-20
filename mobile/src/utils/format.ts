import type { CurrencyCode, Language } from '@/context/PreferencesContext';

export const MAX_AMOUNT_IDR = 999_999_999_999;

export const PRESET_CATEGORY_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#84CC16', // Lime
  '#10B981', // Emerald
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#0EA5E9', // Sky
  '#4F46E5', // Indigo
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#64748B', // Slate
] as const;

/** Fallback rates (units per 1 IDR) used before live/cached rates are loaded. */
export const DEFAULT_FALLBACK_RATES: Record<CurrencyCode, number> = {
  IDR: 1,
  USD: 0.0000606,
  EUR: 0.0000558,
  SGD: 0.0000812,
  MYR: 0.000268,
  JPY: 0.00915,
  GBP: 0.0000478,
  AUD: 0.0000925,
  SAR: 0.000227,
  CNY: 0.000438,
  KRW: 0.0835,
  THB: 0.00208,
};

const ZERO_DECIMAL_CURRENCIES: ReadonlySet<string> = new Set(['IDR', 'JPY', 'KRW']);

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  IDR: 'Rp',
  USD: '$',
  EUR: '€',
  SGD: 'S$',
  MYR: 'RM',
  JPY: '¥',
  GBP: '£',
  AUD: 'A$',
  SAR: 'SAR ',
  CNY: '¥',
  KRW: '₩',
  THB: '฿',
};

/**
 * Formats an IDR integer amount for display in the selected currency (BR-02, BR-18).
 * Stored & submitted amounts are always integer IDR.
 */
export function formatCurrency(
  amountInIdr: number,
  currencyCode: CurrencyCode = 'IDR',
  rates?: Record<string, number>,
  language: Language = 'id',
): string {
  const safeIdr = Number.isFinite(amountInIdr) ? amountInIdr : 0;
  const effectiveRates = rates && Object.keys(rates).length > 0 ? rates : DEFAULT_FALLBACK_RATES;
  const rate =
    currencyCode === 'IDR'
      ? 1
      : (effectiveRates[currencyCode] ?? DEFAULT_FALLBACK_RATES[currencyCode] ?? 1);
  const targetCurrency: CurrencyCode = rate && rate > 0 ? currencyCode : 'IDR';
  const converted = targetCurrency === 'IDR' ? Math.round(safeIdr) : safeIdr * rate;
  const decimals = ZERO_DECIMAL_CURRENCIES.has(targetCurrency) ? 0 : 2;
  const locale = language === 'en' ? 'en-US' : 'id-ID';
  const symbol = CURRENCY_SYMBOLS[targetCurrency] ?? `${targetCurrency} `;

  const formattedNumber = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(converted));

  const prefix = converted < 0 ? '-' : '';
  const space = targetCurrency === 'IDR' ? ' ' : '';
  return `${prefix}${symbol}${space}${formattedNumber}`;
}

/** Formats raw numeric string with dot thousand separators for IDR input fields. */
export function formatIdrThousandInput(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  const digits = String(value).replace(/\D/g, '').replace(/^0+/, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Parses a formatted thousand-separated string into a positive integer (or 0 if empty). */
export function parseIdrThousandInput(raw: string): number {
  const digits = raw.replace(/\D/g, '').replace(/^0+/, '');
  if (!digits) return 0;
  const parsed = Number.parseInt(digits, 10);
  return Number.isSafeInteger(parsed) ? parsed : 0;
}

/** Returns today's date in Asia/Jakarta (WIB, UTC+7) formatted as YYYY-MM-DD (BR-04, BR-05). */
export function getTodayWibString(now: Date = new Date()): string {
  const wibMs = now.getTime() + 7 * 60 * 60 * 1000;
  const wibDate = new Date(wibMs);
  const year = wibDate.getUTCFullYear();
  const month = String(wibDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(wibDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Returns current month (1-12) and year in Asia/Jakarta (WIB, UTC+7) (BR-04). */
export function getCurrentWibMonthYear(now: Date = new Date()): { month: number; year: number } {
  const wibMs = now.getTime() + 7 * 60 * 60 * 1000;
  const wibDate = new Date(wibMs);
  return {
    month: wibDate.getUTCMonth() + 1,
    year: wibDate.getUTCFullYear(),
  };
}

/** Returns first and last YYYY-MM-DD dates for a given month (1-12) and year. */
export function getMonthDateRange(
  month: number,
  year: number,
): { dateFrom: string; dateTo: string } {
  const lastDay = new Date(year, month, 0).getDate();
  const mm = String(month).padStart(2, '0');
  const dd = String(lastDay).padStart(2, '0');
  return {
    dateFrom: `${year}-${mm}-01`,
    dateTo: `${year}-${mm}-${dd}`,
  };
}

/** Parses YYYY-MM-DD into a local Date object at noon to avoid timezone day-shift bugs. */
export function parseDateStringToLocal(dateStr: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return new Date();
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  return new Date(year, month, day, 12, 0, 0, 0);
}

/** Formats a local Date object into YYYY-MM-DD. */
export function formatLocalDateToYmd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Returns a local Date object representing the end of today in WIB for DatePicker maximumDate. */
export function getMaxWibDateForPicker(): Date {
  const todayWib = getTodayWibString();
  const d = parseDateStringToLocal(todayWib);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Formats YYYY-MM-DD for human-readable display in the active language. */
export function formatDateDisplay(dateStr: string, language: Language): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return dateStr;
  const date = parseDateStringToLocal(dateStr);
  const locale = language === 'en' ? 'en-US' : 'id-ID';
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
