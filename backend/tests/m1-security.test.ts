import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import { Prisma } from '@prisma/client';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  userCreate: vi.fn(),
  userFindUnique: vi.fn(),
  categoryCreateMany: vi.fn(),
  categoryCreate: vi.fn(),
  categoryFindFirst: vi.fn(),
  categoryFindMany: vi.fn(),
  categoryUpdateMany: vi.fn(),
  categoryDeleteMany: vi.fn(),
  transactionCount: vi.fn(),
  transactionFindFirst: vi.fn(),
  budgetCreate: vi.fn(),
  budgetCount: vi.fn(),
  sessionCreate: vi.fn(),
  sessionFindFirst: vi.fn(),
  sessionUpdateMany: vi.fn(),
  savingsGoalCount: vi.fn(),
  savingsDepositGroupBy: vi.fn(),
}));

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    $transaction: mocks.transaction,
    user: { create: mocks.userCreate, findUnique: mocks.userFindUnique },
    category: {
      createMany: mocks.categoryCreateMany,
      create: mocks.categoryCreate,
      findFirst: mocks.categoryFindFirst,
      findMany: mocks.categoryFindMany,
      updateMany: mocks.categoryUpdateMany,
      deleteMany: mocks.categoryDeleteMany,
    },
    transaction: { count: mocks.transactionCount, findFirst: mocks.transactionFindFirst },
    budget: { create: mocks.budgetCreate, count: mocks.budgetCount },
    session: { create: mocks.sessionCreate, findFirst: mocks.sessionFindFirst, updateMany: mocks.sessionUpdateMany },
    savingsGoal: { count: mocks.savingsGoalCount },
    savingsDeposit: { groupBy: mocks.savingsDepositGroupBy },
  },
}));

import { createApp } from '../src/app';
import { addDeposit } from '../src/modules/savings/savings.service';

const USER_ID = '9fdc0e9b-7031-4d7c-ae2a-862dc41518ad';
const SESSION_ID = '16eeed00-d4bd-45a4-8092-67d869a7fa35';
const SECRET = 'm1-test-secret-that-is-not-a-production-secret-000';
let app: ReturnType<typeof createApp>;

function signedToken(options: {
  secret?: string;
  algorithm?: jwt.Algorithm;
  issuer?: string;
  audience?: string;
  expiresIn?: number;
  sid?: string;
  includeSid?: boolean;
} = {}): string {
  return jwt.sign(
    options.includeSid === false ? {} : { sid: options.sid ?? SESSION_ID },
    options.secret ?? SECRET,
    {
      algorithm: options.algorithm ?? 'HS256',
      subject: USER_ID,
      issuer: options.issuer ?? 'finmanage-api',
      audience: options.audience ?? 'finmanage-mobile',
      expiresIn: options.expiresIn ?? 7 * 24 * 60 * 60,
    },
  );
}

beforeEach(() => {
  process.env.DATABASE_URL = 'postgresql://localhost:5432/finmanage_test';
  process.env.JWT_SECRET = SECRET;
  vi.clearAllMocks();
  app = createApp({ nodeEnv: 'test', rateLimitMax: 1000 });
  mocks.sessionFindFirst.mockResolvedValue({ id: SESSION_ID, userId: USER_ID, lastUsedAt: new Date() });
  mocks.sessionUpdateMany.mockResolvedValue({ count: 1 });
  mocks.userFindUnique.mockResolvedValue({
    id: USER_ID,
    name: 'Pengguna Uji',
    email: 'uji@example.com',
    avatarData: null,
    receiptScanConsentAt: null,
    status: 'active',
  });
  mocks.transactionCount.mockResolvedValue(0);
  mocks.budgetCount.mockResolvedValue(0);
  mocks.savingsGoalCount.mockResolvedValue(0);
  mocks.savingsDepositGroupBy.mockResolvedValue([]);
});

describe('M1 authentication and ownership security', () => {
  it('registers atomically with Argon2id, 13 default categories, and a seven-day session', async () => {
    const tx = {
      user: {
        create: vi.fn(async ({ data }: { data: { name: string; email: string; passwordHash: string } }) => ({
          id: USER_ID,
          ...data,
          avatarData: null,
        })),
      },
      category: { createMany: vi.fn().mockResolvedValue({ count: 13 }) },
      session: { create: vi.fn().mockResolvedValue({ id: SESSION_ID }) },
    };
    mocks.transaction.mockImplementation(async (callback) => callback(tx));

    const response = await request(app).post('/api/v1/auth/register').send({
      name: ' Pengguna Uji ',
      email: ' UJI@EXAMPLE.COM ',
      password: 'SimpanAman123',
    });

    expect(response.status).toBe(201);
    expect(response.body.data.user).toEqual({ id: USER_ID, name: 'Pengguna Uji', email: 'uji@example.com', avatar: null });
    expect(response.body.data).not.toHaveProperty('user.passwordHash');
    expect(tx.user.create.mock.calls[0]?.[0].data.passwordHash).toMatch(/^\$argon2id\$/);
    expect(tx.category.createMany).toHaveBeenCalledWith({ data: expect.arrayContaining([
      expect.objectContaining({ name: 'Salary', type: 'income' }),
      expect.objectContaining({ name: 'Food', type: 'expense' }),
    ]) });
    const sessionData = tx.session.create.mock.calls[0]?.[0].data;
    expect(sessionData.userAgent).toBeUndefined();
    expect(sessionData.expiresAt.getTime() - sessionData.createdAt.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
    const payload = jwt.decode(response.body.data.token) as jwt.JwtPayload;
    expect(payload).toMatchObject({ sub: USER_ID, sid: sessionData.id, iss: 'finmanage-api', aud: 'finmanage-mobile' });
    expect(payload).not.toHaveProperty('jti');
  });

  it('rejects weak passwords and strict-schema mass assignment before database access', async () => {
    const weak = await request(app).post('/api/v1/auth/register').send({
      name: 'Pengguna', email: 'uji@example.com', password: 'password1',
    });
    expect(weak.status).toBe(400);

    const massAssignment = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${signedToken()}`)
      .send({ name: 'Kategori', type: 'expense', color: '#112233', userId: USER_ID });
    expect(massAssignment.status).toBe(400);
    expect(massAssignment.body.error.code).toBe('VALIDATION_ERROR');
    expect(mocks.categoryFindFirst).not.toHaveBeenCalled();
  });

  it('uses one generic login error and throttles five failures per IP and email', async () => {
    mocks.userFindUnique.mockResolvedValue(null);
    let lastResponse;
    for (let attempt = 0; attempt < 6; attempt++) {
      lastResponse = await request(app).post('/api/v1/auth/login').send({
        email: 'unknown@example.com',
        password: 'Incorrect123',
      });
      if (attempt < 5) {
        expect(lastResponse.status).toBe(401);
        expect(lastResponse.body.error.code).toBe('INVALID_CREDENTIALS');
      }
    }
    expect(lastResponse?.status).toBe(429);
    expect(lastResponse?.body.error.code).toBe('RATE_LIMITED');
    expect(JSON.stringify(lastResponse?.body)).not.toContain('unknown@example.com');
    const otherEmail = await request(app).post('/api/v1/auth/login').send({
      email: 'different@example.com',
      password: 'Incorrect123',
    });
    expect(otherEmail.status).toBe(401);
    expect(otherEmail.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('logs in with a valid Argon2id password and starts a new seven-day session', async () => {
    const passwordHash = await argon2.hash('SimpanAman123', { type: argon2.argon2id, memoryCost: 19_456, timeCost: 2, parallelism: 1 });
    mocks.userFindUnique.mockResolvedValue({
      id: USER_ID, name: 'Pengguna Uji', email: 'uji@example.com', passwordHash,
      avatarData: null, status: 'active',
    });
    mocks.sessionCreate.mockResolvedValue({ id: SESSION_ID });
    const response = await request(app).post('/api/v1/auth/login').send({
      email: ' UJI@EXAMPLE.COM ', password: 'SimpanAman123',
    });
    expect(response.status).toBe(200);
    expect(response.body.data.user).toEqual({ id: USER_ID, name: 'Pengguna Uji', email: 'uji@example.com', avatar: null });
    expect(response.body.data.token).toEqual(expect.any(String));
    expect(mocks.userFindUnique).toHaveBeenCalledWith({ where: { email: 'uji@example.com' } });
    expect(mocks.sessionCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ userId: USER_ID, expiresAt: expect.any(Date) }),
    }));
  });

  it('rejects a transaction relation that does not belong to the authenticated user', async () => {
    mocks.categoryFindFirst.mockResolvedValue(null);
    mocks.transaction.mockImplementation(async (callback) => callback({ category: { findFirst: mocks.categoryFindFirst } }));
    const response = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${signedToken()}`)
      .send({
        type: 'expense', categoryId: '6a17dd44-0572-4b64-8d4f-13ae088a3ccf', amount: 12000,
        transactionDate: '2026-10-19', description: 'Tes',
      });
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(mocks.categoryFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: '6a17dd44-0572-4b64-8d4f-13ae088a3ccf', userId: USER_ID },
    }));
  });

  it('rejects budgets for income categories and reports duplicate categories safely', async () => {
    mocks.categoryFindFirst.mockResolvedValue({ id: SESSION_ID, userId: USER_ID, type: 'income' });
    const invalidBudget = await request(app)
      .post('/api/v1/budgets')
      .set('Authorization', `Bearer ${signedToken()}`)
      .send({ categoryId: SESSION_ID, month: 10, year: 2026, budgetAmount: 100000 });
    expect(invalidBudget.status).toBe(400);
    expect(mocks.budgetCreate).not.toHaveBeenCalled();

    mocks.categoryCreate.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('unique key leaked', {
      code: 'P2002', clientVersion: 'test',
    }));
    const duplicateCategory = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${signedToken()}`)
      .send({ name: ' Food ', type: 'expense', color: '#F59E0B' });
    expect(duplicateCategory.status).toBe(409);
    expect(duplicateCategory.body.error.code).toBe('CATEGORY_DUPLICATE');
    expect(JSON.stringify(duplicateCategory.body)).not.toContain('unique key leaked');
  });

  it('returns usage counts when deleting an in-use category', async () => {
    mocks.categoryFindFirst.mockResolvedValue({ id: SESSION_ID });
    mocks.transactionCount.mockResolvedValue(4);
    mocks.budgetCount.mockResolvedValue(2);
    const response = await request(app)
      .delete(`/api/v1/categories/${SESSION_ID}`)
      .set('Authorization', `Bearer ${signedToken()}`);
    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({
      error: { code: 'CATEGORY_IN_USE', details: { transactionCount: 4, budgetCount: 2 } },
    });
    expect(mocks.categoryDeleteMany).not.toHaveBeenCalled();
  });

  it.each([
    ['no token', undefined],
    ['wrong secret', signedToken({ secret: 'not-the-secret' })],
    ['HS384', signedToken({ algorithm: 'HS384' })],
    ['expired', signedToken({ expiresIn: -60 })],
    ['wrong issuer', signedToken({ issuer: 'other-api' })],
    ['wrong audience', signedToken({ audience: 'other-client' })],
    ['missing sid', signedToken({ includeSid: false })],
  ])('rejects invalid credentials (%s) with the same 401', async (_label, token) => {
    const call = request(app).get('/api/v1/profile');
    const response = token ? await call.set('Authorization', `Bearer ${token}`) : await call;
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
    expect(response.body.error.message).toBe('Sesi tidak valid.');
    expect(mocks.sessionFindFirst).not.toHaveBeenCalled();
  });

  it('rejects unsigned JWTs and revoked or suspended sessions', async () => {
    const signed = signedToken();
    const segments = signed.split('.');
    const unsigned = `${Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')}.${segments[1]}.`;
    const unsignedResponse = await request(app).get('/api/v1/profile').set('Authorization', `Bearer ${unsigned}`);
    expect(unsignedResponse.status).toBe(401);

    mocks.sessionFindFirst.mockResolvedValueOnce(null);
    const inactive = await request(app).get('/api/v1/profile').set('Authorization', `Bearer ${signed}`);
    expect(inactive.status).toBe(401);
  });

  it('revokes the current session on logout and returns 204', async () => {
    const response = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${signedToken()}`);
    expect(response.status).toBe(204);
    expect(mocks.sessionUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: SESSION_ID, userId: USER_ID, revokedAt: null }),
      data: expect.objectContaining({ revokedAt: expect.any(Date) }),
    }));
    mocks.sessionFindFirst.mockResolvedValueOnce(null);
    const afterLogout = await request(app).get('/api/v1/profile').set('Authorization', `Bearer ${signedToken()}`);
    expect(afterLogout.status).toBe(401);
  });

  it('returns profile statistics scoped to the authenticated user', async () => {
    mocks.transactionCount.mockResolvedValue(12);
    mocks.savingsGoalCount.mockResolvedValue(2);
    const response = await request(app).get('/api/v1/profile').set('Authorization', `Bearer ${signedToken()}`);
    expect(response.status).toBe(200);
    expect(response.body.data.stats).toEqual({ transactionCount: 12, savingsGoalCount: 2, totalSavings: 0 });
    expect(mocks.userFindUnique).toHaveBeenCalledWith({ where: { id: USER_ID } });
    expect(mocks.transactionCount).toHaveBeenCalledWith({ where: { userId: USER_ID } });
  });

  it('returns 404 for an unowned category and does not query without the authenticated owner id', async () => {
    mocks.categoryFindFirst.mockResolvedValue(null);
    const response = await request(app)
      .patch('/api/v1/categories/6a17dd44-0572-4b64-8d4f-13ae088a3ccf')
      .set('Authorization', `Bearer ${signedToken()}`)
      .send({ name: 'Private' });
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(mocks.categoryFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: '6a17dd44-0572-4b64-8d4f-13ae088a3ccf', userId: USER_ID },
    }));
  });

  it('rejects fractional, string, oversized, and mass-assigned transaction amounts', async () => {
    const token = `Bearer ${signedToken()}`;
    const base = {
      type: 'expense',
      categoryId: '6a17dd44-0572-4b64-8d4f-13ae088a3ccf',
      transactionDate: '2026-10-19',
    };
    const invalidBodies = [
      { ...base, amount: 1.5 },
      { ...base, amount: '1500' },
      { ...base, amount: 1_000_000_000_000 },
      { ...base, amount: 1500, source: 'scan' },
    ];
    for (const body of invalidBodies) {
      const response = await request(app).post('/api/v1/transactions').set('Authorization', token).send(body);
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    }
    expect(mocks.categoryFindFirst).not.toHaveBeenCalled();
  });

  it('serializes parallel deposits under a goal row lock so total savings cannot exceed target', async () => {
    let saved = new Prisma.Decimal(0);
    let completedAt: Date | null = null;
    let lockTail: Promise<void> = Promise.resolve();
    const acquireLock = async (): Promise<() => void> => {
      let releaseCurrent: () => void = () => { return; };
      const current = new Promise<void>((resolve) => { releaseCurrent = resolve; });
      const previous = lockTail;
      lockTail = previous.then(() => current);
      await previous;
      return releaseCurrent;
    };

    mocks.transaction.mockImplementation(async (callback) => {
      let release: (() => void) | undefined;
      const goal = { id: SESSION_ID, title: 'Dana darurat', targetAmount: new Prisma.Decimal(100), deadline: null, completedAt };
      const tx = {
        $queryRaw: vi.fn(async () => { release = await acquireLock(); return []; }),
        savingsGoal: {
          findFirst: vi.fn(async () => ({ ...goal, completedAt })),
          updateMany: vi.fn(async ({ data }: { data: { completedAt: Date | null } }) => {
            completedAt = data.completedAt;
            return { count: 1 };
          }),
          findFirstOrThrow: vi.fn(async () => ({ ...goal, completedAt })),
        },
        savingsDeposit: {
          groupBy: vi.fn(async () => saved.isZero() ? [] : [{ entryType: 'deposit' as const, _sum: { amount: saved } }]),
          create: vi.fn(async ({ data }: { data: { amount: Prisma.Decimal; depositDate: Date; note: string | null } }) => {
            saved = saved.add(data.amount);
            return { id: USER_ID, entryType: 'deposit', ...data };
          }),
        },
        notification: { createMany: vi.fn().mockResolvedValue({ count: 0 }) },
      };
      try {
        return await callback(tx);
      } finally {
        release?.();
      }
    });

    const results = await Promise.allSettled([
      ...Array.from({ length: 10 }, () => addDeposit(USER_ID, SESSION_ID, { amount: 15, depositDate: '2026-10-19' })),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(6);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(4);
    expect(saved.toNumber()).toBe(90);
    expect(mocks.transaction).toHaveBeenCalledTimes(10);
  });
});
