import { prisma } from '../../lib/prisma';

const CACHE_TTL_MS = 60 * 60 * 1000;
const PROVIDER_URL = 'https://open.er-api.com/v6/latest/IDR';
const PROVIDER_TIMEOUT_MS = 7_000;

const CURRENCIES = [
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', decimals: 0 },
  { code: 'USD', name: 'US Dollar', symbol: '$', decimals: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', decimals: 2 },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', decimals: 2 },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', decimals: 2 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimals: 0 },
  { code: 'GBP', name: 'British Pound', symbol: '£', decimals: 2 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimals: 2 },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR', decimals: 2 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimals: 2 },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', decimals: 0 },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', decimals: 2 },
] as const;

type CurrencyCode = (typeof CURRENCIES)[number]['code'];
type RateMap = Record<CurrencyCode, number>;
type RateSource = 'live' | 'cache' | 'fallback';

// Provider snapshot checked 2026-10-19 UTC; used only when its API and cache are unavailable.
const FALLBACK_RATES: RateMap = {
  IDR: 1,
  USD: 0.000055,
  EUR: 0.000049,
  SGD: 0.000071,
  MYR: 0.000226,
  JPY: 0.008761,
  GBP: 0.000042,
  AUD: 0.00008,
  SAR: 0.000208,
  CNY: 0.000373,
  KRW: 0.073875,
  THB: 0.001854,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function supportedRates(value: unknown): RateMap | null {
  if (!isRecord(value)) return null;
  const rates = {} as RateMap;
  for (const currency of CURRENCIES) {
    if (currency.code === 'IDR') {
      rates.IDR = 1;
      continue;
    }
    const rate = value[currency.code];
    if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) return null;
    rates[currency.code] = rate;
  }
  return rates;
}

function toResponse(rates: RateMap, updatedAt: Date, source: RateSource) {
  return {
    base: 'IDR',
    updatedAt: updatedAt.toISOString(),
    source,
    currencies: CURRENCIES.map((currency) => ({ ...currency, rate: rates[currency.code] })),
  };
}

async function fetchRates(): Promise<RateMap> {
  const response = await fetch(PROVIDER_URL, { signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS) });
  if (!response.ok) throw new Error('Exchange rate provider returned an unsuccessful status.');

  const payload: unknown = await response.json();
  if (!isRecord(payload) || payload.result !== 'success' || payload.base_code !== 'IDR') {
    throw new Error('Exchange rate provider returned an invalid response.');
  }
  const rates = supportedRates(payload.rates);
  if (!rates) throw new Error('Exchange rate provider omitted a supported currency.');
  return rates;
}

export async function getCurrencies() {
  const cached = await prisma.exchangeRateCache.findUnique({ where: { id: 1 } });
  const cachedRates = supportedRates(cached?.rates);
  const now = new Date();

  if (
    cached &&
    cachedRates &&
    cached.baseCode === 'IDR' &&
    now.getTime() - cached.fetchedAt.getTime() < CACHE_TTL_MS
  ) {
    return toResponse(cachedRates, cached.fetchedAt, 'cache');
  }

  let rates: RateMap;
  try {
    rates = await fetchRates();
  } catch {
    if (cached && cachedRates && cached.baseCode === 'IDR') {
      return toResponse(cachedRates, cached.fetchedAt, 'cache');
    }
    return toResponse(FALLBACK_RATES, now, 'fallback');
  }

  const fetchedAt = new Date();
  await prisma.exchangeRateCache.upsert({
    where: { id: 1 },
    create: { id: 1, baseCode: 'IDR', rates, fetchedAt },
    update: { baseCode: 'IDR', rates, fetchedAt },
  });
  return toResponse(rates, fetchedAt, 'live');
}
