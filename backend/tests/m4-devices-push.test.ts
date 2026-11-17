import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  sessionFindFirst: vi.fn(), sessionUpdateMany: vi.fn(), deviceTokenUpsert: vi.fn(), deviceTokenDeleteMany: vi.fn(), deviceTokenFindMany: vi.fn(),
  sendPushNotificationsAsync: vi.fn(),
}));

vi.mock('expo-server-sdk', () => ({
  Expo: class MockExpo {
    static isExpoPushToken(token: string): boolean { return /^ExponentPushToken\[[A-Za-z0-9_-]+\]$/.test(token); }
    chunkPushNotifications(messages: unknown[]): unknown[][] { return messages.length ? [messages] : []; }
    sendPushNotificationsAsync(messages: unknown[]): Promise<unknown[]> { return mocks.sendPushNotificationsAsync(messages); }
  },
}));

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    session: { findFirst: mocks.sessionFindFirst, updateMany: mocks.sessionUpdateMany },
    deviceToken: { upsert: mocks.deviceTokenUpsert, deleteMany: mocks.deviceTokenDeleteMany, findMany: mocks.deviceTokenFindMany },
  },
}));

import { createApp } from '../src/app';
import { dispatchPushNotifications } from '../src/lib/pushNotifications';

const USER_ID = '9fdc0e9b-7031-4d7c-ae2a-862dc41518ad';
const SESSION_ID = '16eeed00-d4bd-45a4-8092-67d869a7fa35';
const SECRET = 'm4-device-push-test-secret-not-for-production-12345';
const TOKEN_A = 'ExponentPushToken[abcdefghijklmnopqrstuvwx]';
const TOKEN_B = 'ExponentPushToken[zyxwvutsrqponmlkjihgfedc]';

function authToken(): string {
  return jwt.sign({ sid: SESSION_ID }, SECRET, { algorithm: 'HS256', subject: USER_ID, issuer: 'finmanage-api', audience: 'finmanage-mobile', expiresIn: '1h' });
}

beforeEach(() => {
  process.env.DATABASE_URL = 'postgresql://localhost:5432/finmanage_test';
  process.env.JWT_SECRET = SECRET;
  vi.clearAllMocks();
  mocks.sessionFindFirst.mockResolvedValue({ id: SESSION_ID, userId: USER_ID, lastUsedAt: new Date() });
  mocks.sessionUpdateMany.mockResolvedValue({ count: 0 });
  mocks.deviceTokenUpsert.mockResolvedValue({});
  mocks.deviceTokenDeleteMany.mockResolvedValue({ count: 1 });
  mocks.deviceTokenFindMany.mockResolvedValue([
    { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', userId: USER_ID, expoPushToken: TOKEN_A, locale: 'id' },
    { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', userId: USER_ID, expoPushToken: TOKEN_B, locale: 'en' },
  ]);
  mocks.sendPushNotificationsAsync.mockResolvedValue([{ status: 'ok' }, { status: 'ok' }]);
});

describe('M4 device token and push notifications', () => {
  it('validates and upserts a device token for the authenticated user', async () => {
    const app = createApp({ nodeEnv: 'test', rateLimitMax: 1000 });
    const response = await request(app).post('/api/v1/devices').set('Authorization', `Bearer ${authToken()}`).send({ expoPushToken: TOKEN_A, locale: 'en' });
    expect(response.status).toBe(204);
    expect(mocks.deviceTokenUpsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { expoPushToken: TOKEN_A },
      create: expect.objectContaining({ userId: USER_ID, locale: 'en' }),
      update: expect.objectContaining({ userId: USER_ID, locale: 'en', lastSeenAt: expect.any(Date) }),
    }));
    const invalid = await request(app).post('/api/v1/devices').set('Authorization', `Bearer ${authToken()}`).send({ expoPushToken: 'not-a-token', locale: 'id' });
    expect(invalid.status).toBe(400);
    const strict = await request(app).post('/api/v1/devices').set('Authorization', `Bearer ${authToken()}`).send({ expoPushToken: TOKEN_A, userId: USER_ID });
    expect(strict.status).toBe(400);
  });

  it('scopes token deletion to the authenticated user and returns 404 for a foreign token', async () => {
    const app = createApp({ nodeEnv: 'test', rateLimitMax: 1000 });
    const deleted = await request(app).delete(`/api/v1/devices/${encodeURIComponent(TOKEN_A)}`).set('Authorization', `Bearer ${authToken()}`);
    expect(deleted.status).toBe(204);
    expect(mocks.deviceTokenDeleteMany).toHaveBeenCalledWith({ where: { userId: USER_ID, expoPushToken: TOKEN_A } });
    mocks.deviceTokenDeleteMany.mockResolvedValueOnce({ count: 0 });
    const foreign = await request(app).delete(`/api/v1/devices/${encodeURIComponent(TOKEN_A)}`).set('Authorization', `Bearer ${authToken()}`);
    expect(foreign.status).toBe(404);
  });

  it('sends localized messages without amounts and removes DeviceNotRegistered tokens', async () => {
    mocks.sendPushNotificationsAsync.mockResolvedValueOnce([
      { status: 'error', details: { error: 'DeviceNotRegistered' } },
      { status: 'ok' },
    ]);
    await dispatchPushNotifications([
      { userId: USER_ID, type: 'budget_warning' },
    ]);
    expect(mocks.sendPushNotificationsAsync).toHaveBeenCalledOnce();
    const messages = mocks.sendPushNotificationsAsync.mock.calls[0]?.[0] as Array<{ to: string; title: string; body: string; data: { targetScreen: string } }>;
    expect(messages).toHaveLength(2);
    expect(messages[0]).toMatchObject({ to: TOKEN_A, body: expect.any(String), data: { targetScreen: 'budget' } });
    expect(messages[1]).toMatchObject({ to: TOKEN_B, body: expect.any(String), data: { targetScreen: 'budget' } });
    expect(messages[0]?.body).not.toMatch(/\d/);
    expect(messages[0]?.body).not.toBe(messages[1]?.body);
    expect(mocks.deviceTokenDeleteMany).toHaveBeenCalledWith({ where: { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' } });
  });

  it('does not reject callers when the Expo push service fails', async () => {
    mocks.sendPushNotificationsAsync.mockRejectedValueOnce(new Error('provider unavailable'));
    await expect(dispatchPushNotifications([{ userId: USER_ID, type: 'goal_completed' }])).resolves.toBeUndefined();
  });
});
