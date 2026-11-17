import { Prisma } from '@prisma/client';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(), sessionFindFirst: vi.fn(), sessionUpdateMany: vi.fn(), userUpdate: vi.fn(), deviceTokenDeleteMany: vi.fn(),
  transaction: vi.fn(), passwordResetUpdateMany: vi.fn(), passwordResetCreate: vi.fn(), passwordResetFindFirst: vi.fn(),
  goalLock: vi.fn(), savingsGoalFindFirst: vi.fn(), savingsDepositGroupBy: vi.fn(), savingsDepositCreate: vi.fn(), savingsGoalUpdate: vi.fn(),
  budgetFindFirst: vi.fn(), budgetUpdateMany: vi.fn(), budgetFindFirstOrThrow: vi.fn(), transactionAggregate: vi.fn(),
}));

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    $transaction: mocks.transaction,
    user: { findUnique: mocks.userFindUnique, update: mocks.userUpdate },
    session: { findFirst: mocks.sessionFindFirst, updateMany: mocks.sessionUpdateMany },
    deviceToken: { deleteMany: mocks.deviceTokenDeleteMany },
    passwordReset: { updateMany: mocks.passwordResetUpdateMany, create: mocks.passwordResetCreate, findFirst: mocks.passwordResetFindFirst },
    savingsGoal: {
      findFirst: mocks.savingsGoalFindFirst,
      updateMany: vi.fn(async (args: { data: { completedAt: Date | null } }) => { await mocks.savingsGoalUpdate(args); return { count: 1 }; }),
      findFirstOrThrow: vi.fn(async () => ({ id: GOAL_ID, userId: USER_ID, title: 'Dana darurat', targetAmount: goalTarget, deadline: null, completedAt: goalCompletedAt })),
    },
    savingsDeposit: { groupBy: mocks.savingsDepositGroupBy, create: mocks.savingsDepositCreate },
    budget: { findFirst: mocks.budgetFindFirst, updateMany: mocks.budgetUpdateMany, findFirstOrThrow: mocks.budgetFindFirstOrThrow },
    transaction: { aggregate: mocks.transactionAggregate },
  },
}));

import { createApp } from '../src/app';
import { forgotPassword, resetPassword, sendResendEmail } from '../src/modules/auth/auth.passwordReset.service';
import { topUpBudget } from '../src/modules/budgets/budgets.service';
import { withdrawSavings } from '../src/modules/savings/savings.service';

const USER_ID = '9fdc0e9b-7031-4d7c-ae2a-862dc41518ad';
const GOAL_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const BUDGET_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const SECRET = 'm4-auth-savings-test-secret-not-for-production-123';
const EMAIL = 'user@example.com';
let resetRow: { id: string; userId: string; codeHash: string; expiresAt: Date; attempts: number; usedAt: Date | null; createdAt: Date };
let saved = new Prisma.Decimal(700);
let goalCompletedAt: Date | null;
let budgetAmount = new Prisma.Decimal(1_000);
let goalTarget = new Prisma.Decimal(1_000);
let capturedCode = '';

beforeEach(() => {
  process.env.DATABASE_URL = 'postgresql://localhost:5432/finmanage_test';
  process.env.JWT_SECRET = SECRET;
  capturedCode = '';
  saved = new Prisma.Decimal(700);
  goalCompletedAt = new Date('2026-10-01T00:00:00.000Z');
  budgetAmount = new Prisma.Decimal(1_000);
  goalTarget = new Prisma.Decimal(1_000);
  resetRow = { id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', userId: USER_ID, codeHash: '', expiresAt: new Date(Date.now() + 600_000), attempts: 0, usedAt: null, createdAt: new Date() };
  vi.clearAllMocks();
  mocks.userFindUnique.mockImplementation(async ({ where }: { where: { email?: string; id?: string } }) => where.email === EMAIL || where.id === USER_ID
    ? { id: USER_ID, email: EMAIL, receiptScanConsentAt: null }
    : null);
  mocks.userUpdate.mockResolvedValue({});
  mocks.sessionFindFirst.mockResolvedValue(null);
  mocks.sessionUpdateMany.mockResolvedValue({ count: 1 });
  mocks.deviceTokenDeleteMany.mockResolvedValue({ count: 1 });
  mocks.passwordResetUpdateMany.mockResolvedValue({ count: 1 });
  mocks.passwordResetCreate.mockImplementation(async ({ data }: { data: { codeHash: string; expiresAt: Date; attempts: number } }) => {
    resetRow = { ...resetRow, ...data, usedAt: null };
    return { id: resetRow.id };
  });
  mocks.passwordResetFindFirst.mockImplementation(async ({ where }: { where: { attempts: { lt: number } } }) => resetRow.usedAt === null && resetRow.expiresAt > new Date() && resetRow.attempts < where.attempts.lt ? { ...resetRow } : null);
  const tx = {
    passwordReset: {
      updateMany: vi.fn(async ({ where, data }: { where: { id?: string; attempts?: { lt: number } }; data: { attempts?: { increment: number }; usedAt?: Date } }) => {
        if (where.id && where.id !== resetRow.id) return { count: 0 };
        if (where.attempts && resetRow.attempts >= where.attempts.lt) return { count: 0 };
        if (data.attempts) resetRow.attempts += data.attempts.increment;
        if (data.usedAt) resetRow.usedAt = data.usedAt;
        return { count: 1 };
      }),
      create: mocks.passwordResetCreate,
    },
    user: { update: mocks.userUpdate },
    session: { updateMany: mocks.sessionUpdateMany },
    deviceToken: { deleteMany: mocks.deviceTokenDeleteMany },
    $queryRaw: vi.fn().mockResolvedValue([{ id: GOAL_ID }]),
    savingsGoal: {
      findFirst: mocks.savingsGoalFindFirst,
      updateMany: vi.fn(async (args: { data: { completedAt: Date | null } }) => { await mocks.savingsGoalUpdate(args); return { count: 1 }; }),
      findFirstOrThrow: vi.fn(async () => ({ id: GOAL_ID, userId: USER_ID, title: 'Dana darurat', targetAmount: goalTarget, deadline: null, completedAt: goalCompletedAt })),
    },
    savingsDeposit: { groupBy: mocks.savingsDepositGroupBy, create: mocks.savingsDepositCreate },
    budget: { findFirst: mocks.budgetFindFirst, updateMany: mocks.budgetUpdateMany, findFirstOrThrow: mocks.budgetFindFirstOrThrow },
    transaction: { aggregate: mocks.transactionAggregate },
  };
  mocks.transaction.mockImplementation(async (callback: (client: typeof tx) => unknown) => {
    const before = { saved: new Prisma.Decimal(saved), goalCompletedAt, budgetAmount: new Prisma.Decimal(budgetAmount) };
    try {
      return await callback(tx);
    } catch (error) {
      saved = before.saved;
      goalCompletedAt = before.goalCompletedAt;
      budgetAmount = before.budgetAmount;
      throw error;
    }
  });
  mocks.savingsGoalFindFirst.mockResolvedValue({ id: GOAL_ID, userId: USER_ID, title: 'Dana darurat', targetAmount: goalTarget, deadline: null, completedAt: goalCompletedAt });
  mocks.savingsDepositGroupBy.mockImplementation(async () => saved.isZero() ? [] : [{ entryType: 'deposit', _sum: { amount: saved } }]);
  mocks.savingsDepositCreate.mockImplementation(async ({ data }: { data: { amount: Prisma.Decimal; entryType: 'deposit' | 'withdrawal'; depositDate: Date; note: string | null } }) => {
    saved = data.entryType === 'deposit' ? saved.add(data.amount) : saved.sub(data.amount);
    return { id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', ...data };
  });
  mocks.savingsGoalUpdate.mockImplementation(async ({ data }: { data: { completedAt: Date | null } }) => {
    goalCompletedAt = data.completedAt;
    return { id: GOAL_ID, userId: USER_ID, title: 'Dana darurat', targetAmount: goalTarget, deadline: null, completedAt: goalCompletedAt };
  });
  mocks.budgetFindFirst.mockResolvedValue({ id: BUDGET_ID, userId: USER_ID, categoryId: GOAL_ID, month: 10, year: 2026, budgetAmount, category: { id: GOAL_ID, name: 'Food', color: '#123456' } });
  mocks.budgetUpdateMany.mockImplementation(async ({ data }: { data: { budgetAmount: Prisma.Decimal } }) => { budgetAmount = data.budgetAmount; return { count: 1 }; });
  mocks.budgetFindFirstOrThrow.mockImplementation(async () => ({ id: BUDGET_ID, month: 10, year: 2026, budgetAmount }));
  mocks.transactionAggregate.mockResolvedValue({ _sum: { amount: new Prisma.Decimal(100) } });
});

describe('M4 password reset OTP', () => {
  it('sends through Resend with the configured key in the authorization header', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ id: 'email-message-id' }), { status: 200 }));
    await sendResendEmail(EMAIL, '123456', { EMAIL_API_KEY: 'resend-test-key', EMAIL_FROM: 'FinManage <onboarding@resend.dev>' }, fetcher as typeof fetch);
    expect(fetcher).toHaveBeenCalledOnce();
    const [url, options] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.resend.com/emails');
    expect(options.headers).toEqual({ authorization: 'Bearer resend-test-key', 'content-type': 'application/json' });
    expect(JSON.parse(String(options.body))).toMatchObject({
      from: 'FinManage <onboarding@resend.dev>', to: [EMAIL], subject: 'Kode reset password FinManage',
      text: expect.stringContaining('123456'),
    });
  });

  it('does not report missing credentials or Resend rejection as successful delivery', async () => {
    await expect(sendResendEmail(EMAIL, '123456', { EMAIL_API_KEY: undefined, EMAIL_FROM: 'FinManage <onboarding@resend.dev>' }))
      .rejects.toMatchObject({ name: 'ResendDeliveryError', reason: 'missing_api_key' });
    const rejectedFetch = vi.fn(async () => new Response(JSON.stringify({ name: 'validation_error', message: 'The sender domain is not verified: private.example' }), { status: 403 }));
    await expect(sendResendEmail(EMAIL, '123456', { EMAIL_API_KEY: 'resend-test-key', EMAIL_FROM: 'invalid@gmail.com' }, rejectedFetch as typeof fetch))
      .rejects.toMatchObject({ name: 'ResendDeliveryError', reason: 'provider_rejected', providerStatus: 403, providerCode: 'validation_error', providerHint: 'sender_domain_not_verified' });
  });

  it('invalidates a stored OTP and logs a safe failure when delivery fails', async () => {
    const sender = { sendPasswordResetCode: vi.fn().mockRejectedValue(new Error('provider detail must not be logged')) };
    const logger = { info: vi.fn(), warn: vi.fn() };
    await forgotPassword({ email: EMAIL }, sender, logger);
    expect(mocks.passwordResetUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: resetRow.id, usedAt: null }, data: { usedAt: expect.any(Date) },
    }));
    const serializedLog = JSON.stringify([...logger.info.mock.calls, ...logger.warn.mock.calls]);
    expect(serializedLog).not.toContain(EMAIL);
    expect(serializedLog).not.toContain('123456');
    expect(serializedLog).not.toContain('provider detail must not be logged');
    expect(serializedLog).toContain('auth.password_reset.email_failed');
  });

  it('returns the same generic response for known and unknown email and stores only a hash', async () => {
    const sender = { sendPasswordResetCode: vi.fn(async (_email: string, code: string) => { capturedCode = code; }) };
    const app = createApp({ nodeEnv: 'test', rateLimitMax: 1000, emailSender: sender });
    const known = await request(app).post('/api/v1/auth/forgot-password').send({ email: EMAIL });
    const unknown = await request(app).post('/api/v1/auth/forgot-password').send({ email: 'missing@example.com' });
    expect(known.status).toBe(200);
    expect(known.body).toEqual(unknown.body);
    expect(sender.sendPasswordResetCode).toHaveBeenCalledWith(EMAIL, expect.stringMatching(/^\d{6}$/));
    expect(resetRow.codeHash).not.toBe(capturedCode);
    expect(resetRow.codeHash).toMatch(/^[a-f0-9]{64}$/);
    expect(resetRow.attempts).toBe(0);
    expect(resetRow.expiresAt.getTime()).toBeGreaterThan(Date.now() + 9 * 60_000);
  });

  it('rate-limits forgot-password by email and IP', async () => {
    const app = createApp({ nodeEnv: 'test', rateLimitMax: 1000, emailSender: { sendPasswordResetCode: async () => undefined } });
    const results = [];
    for (let index = 0; index < 4; index += 1) results.push(await request(app).post('/api/v1/auth/forgot-password').send({ email: EMAIL }));
    expect(results.slice(0, 3).every((response) => response.status === 200)).toBe(true);
    expect(results[3]?.status).toBe(429);
    expect(results[3]?.headers['retry-after']).toBeTruthy();
  });

  it('rejects expired OTP and the sixth attempt after five incorrect codes', async () => {
    resetRow = { ...resetRow, codeHash: '0'.repeat(64) };
    for (let index = 0; index < 5; index += 1) {
      await expect(resetPassword({ email: EMAIL, code: '000000', newPassword: 'NewPassword123' })).rejects.toMatchObject({ code: 'OTP_INVALID_OR_EXPIRED' });
      resetRow.attempts += 1;
    }
    await expect(resetPassword({ email: EMAIL, code: '123456', newPassword: 'NewPassword123' })).rejects.toMatchObject({ code: 'OTP_INVALID_OR_EXPIRED' });
    resetRow = { ...resetRow, attempts: 0, expiresAt: new Date(Date.now() - 1) };
    await expect(resetPassword({ email: EMAIL, code: '123456', newPassword: 'NewPassword123' })).rejects.toMatchObject({ code: 'OTP_INVALID_OR_EXPIRED' });
  });

  it('uses a valid OTP once, hashes the new password, revokes sessions, and deletes push tokens', async () => {
    const sender = { sendPasswordResetCode: vi.fn(async (_email: string, code: string) => { capturedCode = code; }) };
    const app = createApp({ nodeEnv: 'test', rateLimitMax: 1000, emailSender: sender });
    const forgot = await request(app).post('/api/v1/auth/forgot-password').send({ email: EMAIL });
    expect(forgot.status).toBe(200);
    const reset = await request(app).post('/api/v1/auth/reset-password').send({ email: EMAIL, code: capturedCode, newPassword: 'NewPassword123' });
    expect(reset.status, JSON.stringify(reset.body)).toBe(204);
    expect(mocks.userUpdate).toHaveBeenCalledWith(expect.objectContaining({ where: { id: USER_ID }, data: { passwordHash: expect.stringContaining('$argon2id$') } }));
    expect(mocks.sessionUpdateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: USER_ID, revokedAt: null } }));
    expect(mocks.deviceTokenDeleteMany).toHaveBeenCalledWith({ where: { userId: USER_ID } });
    expect(resetRow.usedAt).toBeInstanceOf(Date);
  });
});

describe('M4 savings withdrawal and budget transfer', () => {
  it('creates a withdrawal and clears completion when the goal falls below target', async () => {
    const result = await withdrawSavings(USER_ID, GOAL_ID, { amount: 200, depositDate: '2026-10-20', note: 'Tarik' });
    expect(result.entry).toMatchObject({ entryType: 'withdrawal', amount: 200, note: 'Tarik' });
    expect(result.goal).toMatchObject({ currentAmount: 500, status: 'in_progress', completedAt: null });
    expect(goalCompletedAt).toBeNull();
  });

  it('rejects withdrawal above savings with the exact saved amount', async () => {
    await expect(withdrawSavings(USER_ID, GOAL_ID, { amount: 701, depositDate: '2026-10-20' })).rejects.toMatchObject({
      code: 'WITHDRAWAL_EXCEEDS_SAVED', status: 400, details: { savedAmount: 700 },
    });
    expect(mocks.savingsDepositCreate).not.toHaveBeenCalled();
  });

  it('atomically withdraws from savings and tops up the owned budget', async () => {
    const result = await topUpBudget(USER_ID, BUDGET_ID, { amount: 300, source: 'savings', goalId: GOAL_ID });
    expect(saved.toNumber()).toBe(400);
    expect(budgetAmount.toNumber()).toBe(1_300);
    expect(result).toMatchObject({ budgetAmount: 1_300, spentAmount: 100 });
    const withdrawal = mocks.savingsDepositCreate.mock.calls.at(-1)?.[0] as { data: { amount: Prisma.Decimal; note: string } };
    expect(withdrawal.data).toMatchObject({ entryType: 'withdrawal', note: 'Alih dana ke budget' });
    expect(withdrawal.data.amount.toNumber()).toBe(300);
  });

  it('rejects a transfer above savings and rolls back if budget update fails', async () => {
    await expect(topUpBudget(USER_ID, BUDGET_ID, { amount: 701, source: 'savings', goalId: GOAL_ID })).rejects.toMatchObject({
      code: 'TOPUP_EXCEEDS_SAVED', status: 400, details: { savedAmount: 700 },
    });
    mocks.budgetUpdateMany.mockRejectedValueOnce(new Error('simulated failure'));
    const savedBefore = saved.toNumber();
    const budgetBefore = budgetAmount.toNumber();
    await expect(topUpBudget(USER_ID, BUDGET_ID, { amount: 100, source: 'savings', goalId: GOAL_ID })).rejects.toThrow('simulated failure');
    expect(mocks.transaction).toHaveBeenCalled();
    expect(saved.toNumber()).toBe(savedBefore);
    expect(budgetAmount.toNumber()).toBe(budgetBefore);
  });
});
