import { Router } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createApp } from '../src/app';
import { AppError } from '../src/lib/errors';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function buildTestApp() {
  const router = Router();

  router.get('/test-unknown-error', () => {
    throw new Error(
      'Invalid `prisma.transaction.findMany()` invocation in D:\\finance-management-backend\\backend\\src\\secret.ts: SELECT * FROM "users"',
    );
  });

  router.post('/test-zod-error', (req, res) => {
    const schema = z
      .object({
        email: z.string().email(),
        amount: z.number().int().positive(),
      })
      .strict();

    const parsed = schema.parse(req.body);
    res.json({ data: parsed });
  });

  router.get('/test-app-error', () => {
    throw new AppError('CONSENT_REQUIRED', 403, 'Persetujuan scan nota diperlukan.');
  });

  return createApp({ nodeEnv: 'test', extraRoutes: router });
}

describe('Global error handling & security redaction', () => {
  const app = buildTestApp();

  it('maps unknown errors to generic 500 without leaking stack, SQL, Prisma, or file paths', async () => {
    const res = await request(app).get('/api/v1/test-unknown-error');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Terjadi kesalahan pada server.',
        details: null,
        requestId: expect.stringMatching(UUID_REGEX),
      },
    });

    const serialized = JSON.stringify(res.body);
    expect(serialized.toLowerCase()).not.toContain('prisma');
    expect(serialized.toLowerCase()).not.toContain('select ');
    expect(serialized).not.toContain('at ');
    expect(serialized).not.toContain('finance-management-backend');
    expect(serialized).not.toContain('secret.ts');
  });

  it('logs unknown errors without their message or Prisma details', async () => {
    const res = await request(app).get('/api/v1/test-unknown-error');
    expect(res.status).toBe(500);
    // The test logger is silent; the error handler deliberately supplies only
    // name, optional code, and requestId to pino for this path.
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
  });

  it('maps ZodError to 400 VALIDATION_ERROR with field paths and without echoing input values', async () => {
    const sensitiveInput = 'leaked-input-value-99999';
    const res = await request(app).post('/api/v1/test-zod-error').send({
      email: sensitiveInput,
      amount: -500,
      unknownField: sensitiveInput,
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.requestId).toMatch(UUID_REGEX);
    expect(Array.isArray(res.body.error.details)).toBe(true);
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'email' }),
        expect.objectContaining({ path: 'amount' }),
      ]),
    );

    const serialized = JSON.stringify(res.body);
    expect(serialized).not.toContain(sensitiveInput);
    expect(serialized).not.toContain('-500');
  });

  it('maps malformed JSON to 400 VALIDATION_ERROR with requestId', async () => {
    const res = await request(app)
      .post('/api/v1/test-zod-error')
      .set('Content-Type', 'application/json')
      .send('{"broken": ');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.requestId).toMatch(UUID_REGEX);
  });

  it('maps AppError to its configured status, code, message, and includes requestId', async () => {
    const res = await request(app).get('/api/v1/test-app-error');

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      error: {
        code: 'CONSENT_REQUIRED',
        message: 'Persetujuan scan nota diperlukan.',
        details: null,
        requestId: expect.stringMatching(UUID_REGEX),
      },
    });
  });
});
