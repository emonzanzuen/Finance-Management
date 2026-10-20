import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  cacheFindUnique: vi.fn(),
  cacheUpsert: vi.fn(),
  sessionFindFirst: vi.fn(),
  sessionUpdateMany: vi.fn(),
}));

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    exchangeRateCache: { findUnique: mocks.cacheFindUnique, upsert: mocks.cacheUpsert },
    session: { findFirst: mocks.sessionFindFirst, updateMany: mocks.sessionUpdateMany },
  },
}));

import { createApp } from '../src/app';

const USER_ID = '9fdc0e9b-7031-4d7c-ae2a-862dc41518ad';
const SESSION_ID = '16eeed00-d4bd-45a4-8092-67d869a7fa35';
const SECRET = 'm2-test-secret-not-for-production-0123456789';
const PROVIDER_RATES = {
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

function token(): string {
  return jwt.sign({ sid: SESSION_ID }, SECRET, {
    algorithm: 'HS256',
    subject: USER_ID,
    issuer: 'finmanage-api',
    audience: 'finmanage-mobile',
    expiresIn: '1h',
  });
}

function cached(fetchedAt: Date, rates: Record<string, number> = PROVIDER_RATES) {
  return { id: 1, baseCode: 'IDR', rates, fetchedAt };
}

describe('GET /api/v1/currencies', () => {
  beforeEach(() => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/finmanage_test';
    process.env.JWT_SECRET = SECRET;
    mocks.cacheFindUnique.mockReset();
    mocks.cacheUpsert.mockReset().mockResolvedValue({});
    mocks.sessionFindFirst.mockReset().mockResolvedValue({ id: SESSION_ID, userId: USER_ID, lastUsedAt: new Date() });
    mocks.sessionUpdateMany.mockReset().mockResolvedValue({ count: 1 });
    vi.stubGlobal('fetch', vi.fn());
  });

  it('requires a valid bearer session', async () => {
    const response = await request(createApp({ nodeEnv: 'test' })).get('/api/v1/currencies');

    expect(response.status).toBe(401);
    expect(mocks.cacheFindUnique).not.toHaveBeenCalled();
  });

  it('uses the database cache while it is younger than one hour', async () => {
    const fetchedAt = new Date(Date.now() - 30 * 60_000);
    mocks.cacheFindUnique.mockResolvedValue(cached(fetchedAt));

    const response = await request(createApp({ nodeEnv: 'test' }))
      .get('/api/v1/currencies')
      .set('Authorization', `Bearer ${token()}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ base: 'IDR', updatedAt: fetchedAt.toISOString(), source: 'cache' });
    expect(response.body.data.currencies).toHaveLength(12);
    expect(response.body.data.currencies.find((currency: { code: string }) => currency.code === 'JPY')).toMatchObject({ decimals: 0, rate: PROVIDER_RATES.JPY });
    expect(response.body.data).not.toHaveProperty('isFallback');
    expect(fetch).not.toHaveBeenCalled();
    expect(mocks.cacheUpsert).not.toHaveBeenCalled();
  });

  it('fetches and persists live rates when the cache is empty', async () => {
    mocks.cacheFindUnique.mockResolvedValue(null);
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ result: 'success', base_code: 'IDR', rates: PROVIDER_RATES }), { status: 200 }));

    const response = await request(createApp({ nodeEnv: 'test' }))
      .get('/api/v1/currencies')
      .set('Authorization', `Bearer ${token()}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ base: 'IDR', source: 'live' });
    expect(response.body.data.currencies).toHaveLength(12);
    expect(mocks.cacheUpsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 1 },
      create: expect.objectContaining({ id: 1, baseCode: 'IDR', rates: PROVIDER_RATES }),
    }));
  });

  it('returns stale cache after a failed provider request', async () => {
    const fetchedAt = new Date(Date.now() - 3 * 60 * 60_000);
    mocks.cacheFindUnique.mockResolvedValue(cached(fetchedAt));
    vi.mocked(fetch).mockRejectedValue(new Error('provider unavailable'));

    const response = await request(createApp({ nodeEnv: 'test' }))
      .get('/api/v1/currencies')
      .set('Authorization', `Bearer ${token()}`);

    expect(response.status).toBe(200);
    expect(response.body.data.source).toBe('cache');
    expect(response.body.data.updatedAt).toBe(fetchedAt.toISOString());
    expect(response.body.data.currencies.find((currency: { code: string }) => currency.code === 'USD').rate).toBe(PROVIDER_RATES.USD);
  });

  it('returns static fallback rates when both provider and cache are unavailable', async () => {
    mocks.cacheFindUnique.mockResolvedValue(null);
    vi.mocked(fetch).mockRejectedValue(new Error('provider unavailable'));

    const response = await request(createApp({ nodeEnv: 'test' }))
      .get('/api/v1/currencies')
      .set('Authorization', `Bearer ${token()}`);

    expect(response.status).toBe(200);
    expect(response.body.data.source).toBe('fallback');
    expect(response.body.data.currencies).toHaveLength(12);
    expect(response.body.data.currencies.find((currency: { code: string }) => currency.code === 'IDR').rate).toBe(1);
  });
});
