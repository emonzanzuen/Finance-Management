import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  sessionFindFirst: vi.fn(), sessionUpdateMany: vi.fn(), userFindUnique: vi.fn(), userUpdate: vi.fn(),
  categoryFindMany: vi.fn(), transaction: vi.fn(), receiptScanCount: vi.fn(), receiptScanCreate: vi.fn(), receiptScanUpdateMany: vi.fn(),
}));

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    $transaction: mocks.transaction,
    session: { findFirst: mocks.sessionFindFirst, updateMany: mocks.sessionUpdateMany },
    user: { findUnique: mocks.userFindUnique, update: mocks.userUpdate },
    category: { findMany: mocks.categoryFindMany },
    receiptScan: { count: mocks.receiptScanCount, create: mocks.receiptScanCreate, updateMany: mocks.receiptScanUpdateMany },
  },
}));

import { createApp } from '../src/app';
import type { ReceiptExtractor } from '../src/modules/receipts/receipts.extractor';

const USER_ID = '9fdc0e9b-7031-4d7c-ae2a-862dc41518ad';
const SESSION_ID = '16eeed00-d4bd-45a4-8092-67d869a7fa35';
const FOREIGN_CATEGORY_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const SECRET = 'm4-receipt-test-secret-not-for-production-123456';
let consent = true;
let app: ReturnType<typeof createApp>;
let extractor: ReceiptExtractor;

function token(): string {
  return jwt.sign({ sid: SESSION_ID }, SECRET, { algorithm: 'HS256', subject: USER_ID, issuer: 'finmanage-api', audience: 'finmanage-mobile', expiresIn: '1h' });
}

function png(width = 64, height = 32): Buffer {
  const data = Buffer.alloc(24);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(data, 0);
  data.writeUInt32BE(13, 8);
  Buffer.from('IHDR').copy(data, 12);
  data.writeUInt32BE(width, 16);
  data.writeUInt32BE(height, 20);
  return data;
}

beforeEach(() => {
  process.env.DATABASE_URL = 'postgresql://localhost:5432/finmanage_test';
  process.env.JWT_SECRET = SECRET;
  consent = true;
  vi.clearAllMocks();
  mocks.sessionFindFirst.mockResolvedValue({ id: SESSION_ID, userId: USER_ID, lastUsedAt: new Date() });
  mocks.sessionUpdateMany.mockResolvedValue({ count: 0 });
  mocks.userFindUnique.mockImplementation(async () => ({ receiptScanConsentAt: consent ? new Date() : null }));
  mocks.userUpdate.mockImplementation(async ({ data }: { data: { receiptScanConsentAt: Date | null } }) => { consent = Boolean(data.receiptScanConsentAt); return {}; });
  mocks.categoryFindMany.mockResolvedValue([{ id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', name: 'Food', type: 'expense' }]);
  mocks.receiptScanCount.mockResolvedValue(0);
  mocks.receiptScanCreate.mockResolvedValue({ id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' });
  mocks.receiptScanUpdateMany.mockResolvedValue({ count: 1 });
  const tx = {
    $queryRaw: vi.fn().mockResolvedValue([{ id: USER_ID }]),
    receiptScan: { count: mocks.receiptScanCount, create: mocks.receiptScanCreate },
  };
  mocks.transaction.mockImplementation(async (callback: (client: typeof tx) => unknown) => callback(tx));
  extractor = { extract: vi.fn().mockResolvedValue({ type: 'expense', amount: 5000, currency: 'IDR', transactionDate: '2026-10-20', description: 'Warung', suggestedCategoryName: 'Food', confidence: 'high', warnings: [] }) };
  app = createApp({ nodeEnv: 'test', rateLimitMax: 1000, scanEnabled: true, scanDailyLimit: 10, receiptExtractor: extractor });
});

describe('M4 receipt scan security', () => {
  it('requires stored consent and supports consent grant and revoke', async () => {
    consent = false;
    const denied = await request(app).post('/api/v1/receipts/scan').set('Authorization', `Bearer ${token()}`).attach('image', png(), 'receipt.png');
    expect(denied.status).toBe(403);
    expect(denied.body.error.code).toBe('CONSENT_REQUIRED');
    expect(mocks.receiptScanCreate).not.toHaveBeenCalled();

    const granted = await request(app).post('/api/v1/receipts/consent').set('Authorization', `Bearer ${token()}`);
    expect(granted.status).toBe(204);
    expect(mocks.userUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ data: { receiptScanConsentAt: expect.any(Date) } }));
    const revoked = await request(app).delete('/api/v1/receipts/consent').set('Authorization', `Bearer ${token()}`);
    expect(revoked.status).toBe(204);
    expect(mocks.userUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ data: { receiptScanConsentAt: null } }));
  });

  it('rejects scans when the global feature switch is off', async () => {
    const disabled = createApp({ nodeEnv: 'test', rateLimitMax: 1000, scanEnabled: false, receiptExtractor: extractor });
    const response = await request(disabled).post('/api/v1/receipts/scan').set('Authorization', `Bearer ${token()}`).attach('image', png(), 'receipt.png');
    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe('SCAN_FAILED');
    expect(mocks.receiptScanCreate).not.toHaveBeenCalled();
  });

  it('rejects PDF content even when the filename and content type claim it is an image', async () => {
    const response = await request(app).post('/api/v1/receipts/scan').set('Authorization', `Bearer ${token()}`)
      .attach('image', Buffer.from('%PDF-1.7 fake'), { filename: 'receipt.jpg', contentType: 'image/jpeg' });
    expect(response.status).toBe(415);
    expect(response.body.error.code).toBe('UNSUPPORTED_FILE');
    expect(mocks.receiptScanCreate).toHaveBeenCalledWith(expect.objectContaining({ data: { userId: USER_ID, status: 'failed' } }));
    expect(mocks.receiptScanUpdateMany).not.toHaveBeenCalled();
  });

  it('rejects image dimensions above the limit and files above 3 MB', async () => {
    const oversizedDimension = await request(app).post('/api/v1/receipts/scan').set('Authorization', `Bearer ${token()}`).attach('image', png(4097, 32), 'receipt.png');
    expect(oversizedDimension.status).toBe(400);
    expect(oversizedDimension.body.error.code).toBe('VALIDATION_ERROR');

    const tooLarge = await request(app).post('/api/v1/receipts/scan').set('Authorization', `Bearer ${token()}`)
      .attach('image', Buffer.alloc(3 * 1024 * 1024 + 1), { filename: 'large.png', contentType: 'image/png' });
    expect(tooLarge.status).toBe(413);
    expect(tooLarge.body.error.code).toBe('FILE_TOO_LARGE');
  });

  it('validates and cleans model output and only resolves a category by the user category name', async () => {
    const privateExtractor: ReceiptExtractor = {
      extract: vi.fn(async () => ({
          type: 'expense', amount: -20, currency: 'IDR', transactionDate: '2099-01-01',
          description: 'A\u0000B\nC', suggestedCategoryId: FOREIGN_CATEGORY_ID, confidence: 'medium', warnings: [],
        })),
    };
    const testApp = createApp({ nodeEnv: 'test', rateLimitMax: 1000, scanEnabled: true, scanDailyLimit: 10, receiptExtractor: privateExtractor });
    const response = await request(testApp).post('/api/v1/receipts/scan').set('Authorization', `Bearer ${token()}`).attach('image', png(), 'receipt.png');
    expect(response.status, JSON.stringify(response.body)).toBe(200);
    expect(privateExtractor.extract).toHaveBeenCalledWith(expect.objectContaining({
      image: expect.any(Buffer), mimeType: 'image/png', categories: [{ name: 'Food', type: 'expense' }],
    }), expect.any(AbortSignal));
    expect(response.body.data).toMatchObject({
      type: 'expense', amount: null, transactionDate: null, description: 'ABC', suggestedCategoryId: null, confidence: 'medium',
    });
    expect(response.body.data.warnings.length).toBeGreaterThanOrEqual(2);
    expect(mocks.receiptScanUpdateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { status: 'success' } }));
    expect(mocks.receiptScanCreate.mock.calls[0]?.[0]).toEqual({ data: { userId: USER_ID, status: 'failed' }, select: { id: true } });
  });

  it('enforces the daily quota and maps an extractor timeout to 503', async () => {
    mocks.receiptScanCount.mockResolvedValueOnce(10);
    const quota = await request(app).post('/api/v1/receipts/scan').set('Authorization', `Bearer ${token()}`).attach('image', png(), 'receipt.png');
    expect(quota.status).toBe(429);
    expect(quota.body.error.code).toBe('SCAN_QUOTA_EXCEEDED');

    mocks.receiptScanCount.mockResolvedValue(0);
    const never: ReceiptExtractor = { extract: () => new Promise(() => undefined) };
    const timeoutApp = createApp({ nodeEnv: 'test', rateLimitMax: 1000, scanEnabled: true, scanDailyLimit: 10, receiptRequestTimeoutMs: 20, receiptExtractor: never });
    const timedOut = await request(timeoutApp).post('/api/v1/receipts/scan').set('Authorization', `Bearer ${token()}`).attach('image', png(), 'receipt.png');
    expect(timedOut.status).toBe(503);
    expect(timedOut.body.error.code).toBe('SCAN_FAILED');
    expect(mocks.receiptScanUpdateMany).not.toHaveBeenCalledWith(expect.objectContaining({ data: { status: 'success' } }));
  });

  it('limits concurrent scans to one per user', async () => {
    let releaseExtraction: (() => void) | undefined;
    const waitingExtractor: ReceiptExtractor = {
      extract: vi.fn(() => new Promise((resolve) => {
        releaseExtraction = () => resolve({ type: 'expense', amount: 100, currency: 'IDR', transactionDate: '2026-10-20', description: null, confidence: 'low', warnings: [] });
      })),
    };
    const concurrentApp = createApp({ nodeEnv: 'test', rateLimitMax: 1000, scanEnabled: true, scanDailyLimit: 10, receiptExtractor: waitingExtractor });
    const firstRequest = request(concurrentApp).post('/api/v1/receipts/scan').set('Authorization', `Bearer ${token()}`).attach('image', png(), 'receipt.png');
    const firstResponse = firstRequest.then((response) => response);
    for (let attempt = 0; attempt < 50 && !releaseExtraction; attempt += 1) await new Promise((resolve) => setTimeout(resolve, 10));
    expect(releaseExtraction).toBeTypeOf('function');
    const second = await request(concurrentApp).post('/api/v1/receipts/scan').set('Authorization', `Bearer ${token()}`).attach('image', png(), 'receipt.png');
    expect(second.status).toBe(429);
    expect(second.body.error.code).toBe('RATE_LIMITED');
    releaseExtraction?.();
    expect((await firstResponse).status).toBe(200);
  });
});
