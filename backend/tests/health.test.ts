import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('GET /api/v1/health & app security baseline', () => {
  const app = createApp({ nodeEnv: 'test' });

  it('returns 200 with contract data shape, ISO time, and integer uptime', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data.status).toBe('ok');
    expect(typeof res.body.data.time).toBe('string');
    expect(Number.isNaN(Date.parse(res.body.data.time))).toBe(false);
    expect(typeof res.body.data.uptime).toBe('number');
    expect(Number.isInteger(res.body.data.uptime)).toBe(true);
    expect(res.body.data.uptime).toBeGreaterThanOrEqual(0);
  });

  it('disables X-Powered-By and sets Helmet security headers + X-Request-Id', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-request-id']).toMatch(UUID_REGEX);
  });

  it('returns 404 NOT_FOUND in contract error shape for unknown routes', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: expect.any(String),
        details: null,
        requestId: expect.stringMatching(UUID_REGEX),
      },
    });
  });

  it('blocks disallowed cross-origin requests when CORS_ORIGINS is empty', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'https://untrusted.example.com');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('allows explicitly configured CORS origin', async () => {
    const appWithCors = createApp({
      nodeEnv: 'test',
      corsOrigins: ['https://allowed.example.com'],
    });

    const res = await request(appWithCors)
      .get('/api/v1/health')
      .set('Origin', 'https://allowed.example.com');

    expect(res.headers['access-control-allow-origin']).toBe('https://allowed.example.com');
  });
});
