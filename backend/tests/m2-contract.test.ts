import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  sessionFindFirst: vi.fn(),
  sessionUpdateMany: vi.fn(),
  transactionGroupBy: vi.fn(),
  transactionFindMany: vi.fn(),
  transactionCreate: vi.fn(),
  transactionAggregate: vi.fn(),
  transactionRun: vi.fn(),
  categoryFindFirst: vi.fn(),
  categoryFindMany: vi.fn(),
  budgetFindMany: vi.fn(),
  savingsGoalFindMany: vi.fn(),
  savingsGoalFindFirst: vi.fn(),
  savingsDepositGroupBy: vi.fn(),
  savingsDepositFindMany: vi.fn(),
}));

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    $transaction: mocks.transactionRun,
    session: { findFirst: mocks.sessionFindFirst, updateMany: mocks.sessionUpdateMany },
    transaction: {
      groupBy: mocks.transactionGroupBy,
      findMany: mocks.transactionFindMany,
      create: mocks.transactionCreate,
      aggregate: mocks.transactionAggregate,
    },
    category: { findFirst: mocks.categoryFindFirst, findMany: mocks.categoryFindMany },
    budget: { findMany: mocks.budgetFindMany },
    savingsGoal: { findMany: mocks.savingsGoalFindMany, findFirst: mocks.savingsGoalFindFirst },
    savingsDeposit: { groupBy: mocks.savingsDepositGroupBy, findMany: mocks.savingsDepositFindMany },
    notification: { createMany: vi.fn() },
  },
}));

import { createApp } from '../src/app';
import { wibToday } from '../src/lib/dates';

const USER_ID = '9fdc0e9b-7031-4d7c-ae2a-862dc41518ad';
const SESSION_ID = '16eeed00-d4bd-45a4-8092-67d869a7fa35';
const SECRET = 'm2-test-secret-not-for-production-0123456789';
const CATEGORY_IDS = {
  salary: '11111111-1111-4111-8111-111111111111',
  food: '22222222-2222-4222-8222-222222222222',
  bills: '33333333-3333-4333-8333-333333333333',
  shopping: '44444444-4444-4444-8444-444444444444',
};
const SAMPLE_TRANSACTIONS = [
  { type: 'income', categoryId: CATEGORY_IDS.salary, amount: 15_000, transactionDate: new Date('2026-09-08T00:00:00.000Z') },
  { type: 'expense', categoryId: CATEGORY_IDS.food, amount: 1_000, transactionDate: new Date('2026-09-10T00:00:00.000Z') },
  { type: 'income', categoryId: CATEGORY_IDS.salary, amount: 10_000, transactionDate: new Date('2026-10-02T00:00:00.000Z') },
  { type: 'expense', categoryId: CATEGORY_IDS.food, amount: 2_500, transactionDate: new Date('2026-10-04T00:00:00.000Z') },
  { type: 'expense', categoryId: CATEGORY_IDS.bills, amount: 1_500, transactionDate: new Date('2026-10-05T00:00:00.000Z') },
  { type: 'expense', categoryId: CATEGORY_IDS.shopping, amount: 5_000, transactionDate: new Date('2026-10-06T00:00:00.000Z') },
];
const CATEGORIES = [
  { id: CATEGORY_IDS.salary, name: 'Salary', color: '#10B981' },
  { id: CATEGORY_IDS.food, name: 'Food', color: '#F59E0B' },
  { id: CATEGORY_IDS.bills, name: 'Bills', color: '#8B5CF6' },
  { id: CATEGORY_IDS.shopping, name: 'Shopping', color: '#EC4899' },
];

function token(): string {
  return jwt.sign({ sid: SESSION_ID }, SECRET, {
    algorithm: 'HS256',
    subject: USER_ID,
    issuer: 'finmanage-api',
    audience: 'finmanage-mobile',
    expiresIn: '1h',
  });
}

function groupRows(by: string[], where: Record<string, unknown> = {}) {
  const range = where.transactionDate as { gte?: Date; lt?: Date } | undefined;
  const categoryFilter = where.categoryId as string | { in?: string[] } | undefined;
  const filtered = SAMPLE_TRANSACTIONS.filter((row) => {
    if (where.type && row.type !== where.type) return false;
    if (typeof categoryFilter === 'string' && row.categoryId !== categoryFilter) return false;
    if (categoryFilter && typeof categoryFilter !== 'string' && categoryFilter.in && !categoryFilter.in.includes(row.categoryId)) return false;
    if (range?.gte && row.transactionDate < range.gte) return false;
    if (range?.lt && row.transactionDate >= range.lt) return false;
    return true;
  });
  const grouped = new Map<string, { fields: Record<string, unknown>; amount: Prisma.Decimal }>();
  for (const row of filtered) {
    const fields: Record<string, unknown> = {};
    for (const key of by) fields[key] = row[key as keyof typeof row];
    const key = by.map((field) => {
      const value = fields[field];
      return value instanceof Date ? value.toISOString() : String(value);
    }).join('|');
    const current = grouped.get(key) ?? { fields, amount: new Prisma.Decimal(0) };
    current.amount = current.amount.add(row.amount);
    grouped.set(key, current);
  }
  return [...grouped.values()].map(({ fields, amount }) => ({ ...fields, _sum: { amount } }));
}

describe('M2 P0 response contracts and financial consistency', () => {
  beforeEach(() => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/finmanage_test';
    process.env.JWT_SECRET = SECRET;
    vi.clearAllMocks();
    mocks.sessionFindFirst.mockResolvedValue({ id: SESSION_ID, userId: USER_ID, lastUsedAt: new Date() });
    mocks.sessionUpdateMany.mockResolvedValue({ count: 1 });
    mocks.transactionGroupBy.mockImplementation(async (args: { by: string[]; where?: Record<string, unknown> }) => groupRows(args.by, args.where));
    mocks.categoryFindMany.mockImplementation(async ({ where }: { where: { id: { in: string[] } } }) => CATEGORIES.filter((category) => where.id.in.includes(category.id)));
  });

  it('keeps dashboard and reports totals aligned and uses the documented response shape', async () => {
    mocks.transactionFindMany.mockResolvedValue([{
      id: '55555555-5555-4555-8555-555555555555',
      type: 'expense',
      amount: new Prisma.Decimal(5_000),
      transactionDate: new Date('2026-10-06T00:00:00.000Z'),
      description: 'Belanja demo',
      source: 'manual',
      category: { id: CATEGORY_IDS.shopping, name: 'Shopping', color: '#EC4899' },
      createdAt: new Date('2026-10-06T08:00:00.000Z'),
    }]);
    mocks.budgetFindMany.mockResolvedValue([]);
    mocks.savingsDepositGroupBy.mockResolvedValue([
      { entryType: 'deposit', _sum: { amount: new Prisma.Decimal(3_000) } },
      { entryType: 'withdrawal', _sum: { amount: new Prisma.Decimal(1_000) } },
    ]);
    const app = createApp({ nodeEnv: 'test', rateLimitMax: 1000 });
    const authorization = `Bearer ${token()}`;

    const dashboard = await request(app).get('/api/v1/dashboard/summary?month=10&year=2026').set('Authorization', authorization);
    const monthly = await request(app).get('/api/v1/reports/monthly?month=10&year=2026').set('Authorization', authorization);
    const trend = await request(app).get('/api/v1/reports/trend?year=2026').set('Authorization', authorization);

    expect(dashboard.status).toBe(200);
    expect(dashboard.body.data).toMatchObject({
      period: { month: 10, year: 2026 },
      balance: 15_000,
      income: 10_000,
      expense: 9_000,
      totalSavings: 2_000,
      recentTransactions: [expect.objectContaining({ category: { id: CATEGORY_IDS.shopping, name: 'Shopping', color: '#EC4899' } })],
    });
    expect(dashboard.body.data.expenseByCategory.reduce((sum: number, row: { amount: number }) => sum + row.amount, 0)).toBe(9_000);
    expect(dashboard.body.data.trend).toHaveLength(6);
    expect(dashboard.body.data.trend.at(-1)).toMatchObject({ month: 10, year: 2026, income: 10_000, expense: 9_000 });

    expect(monthly.status).toBe(200);
    expect(monthly.body.data).toMatchObject({ period: { month: 10, year: 2026 }, income: 10_000, expense: 9_000, difference: 1_000 });
    expect(dashboard.body.data.income - dashboard.body.data.expense).toBe(monthly.body.data.difference);
    expect(monthly.body.data.expenseByCategory.reduce((sum: number, row: { amount: number }) => sum + row.amount, 0)).toBe(monthly.body.data.expense);
    expect(monthly.body.data.incomeByCategory.reduce((sum: number, row: { amount: number }) => sum + row.amount, 0)).toBe(monthly.body.data.income);
    expect(monthly.body.data).not.toHaveProperty('summary');

    expect(trend.status).toBe(200);
    expect(trend.body.data.year).toBe(2026);
    expect(trend.body.data.months).toHaveLength(12);
    expect(trend.body.data.months[9]).toMatchObject({ month: 10, income: 10_000, expense: 9_000 });
  });

  it('counts only budgeted categories and permits a negative remainder', async () => {
    mocks.budgetFindMany.mockResolvedValue([
      { id: '66666666-6666-4666-8666-666666666666', categoryId: CATEGORY_IDS.food, month: 10, year: 2026, budgetAmount: new Prisma.Decimal(2_000), category: CATEGORIES[1] },
      { id: '77777777-7777-4777-8777-777777777777', categoryId: CATEGORY_IDS.bills, month: 10, year: 2026, budgetAmount: new Prisma.Decimal(1_000), category: CATEGORIES[2] },
    ]);

    const response = await request(createApp({ nodeEnv: 'test', rateLimitMax: 1000 }))
      .get('/api/v1/budgets?month=10&year=2026')
      .set('Authorization', `Bearer ${token()}`);

    expect(response.status).toBe(200);
    expect(response.body.data.summary).toEqual({ totalBudget: 3_000, totalSpent: 4_000, remaining: -1_000, percentage: 133.3 });
    expect(response.body.data.items.map((item: { status: string }) => item.status)).toEqual(['exceeded', 'exceeded']);
    expect(response.body.data.items.map((item: { remaining: number }) => item.remaining)).toEqual([-500, -500]);
  });

  it('returns savings progress names and statuses from the API contract', async () => {
    mocks.savingsGoalFindMany.mockResolvedValue([
      { id: '88888888-8888-4888-8888-888888888881', title: 'Dana darurat', targetAmount: new Prisma.Decimal(10_000), deadline: null, completedAt: null, createdAt: new Date('2026-01-03T00:00:00Z') },
      { id: '88888888-8888-4888-8888-888888888882', title: 'Laptop', targetAmount: new Prisma.Decimal(5_000), deadline: null, completedAt: null, createdAt: new Date('2026-01-02T00:00:00Z') },
      { id: '88888888-8888-4888-8888-888888888883', title: 'Liburan', targetAmount: new Prisma.Decimal(2_000), deadline: null, completedAt: new Date(), createdAt: new Date('2026-01-01T00:00:00Z') },
    ]);
    mocks.savingsDepositGroupBy.mockResolvedValue([
      { goalId: '88888888-8888-4888-8888-888888888881', entryType: 'deposit', _sum: { amount: new Prisma.Decimal(3_000) } },
      { goalId: '88888888-8888-4888-8888-888888888882', entryType: 'deposit', _sum: { amount: new Prisma.Decimal(4_500) } },
      { goalId: '88888888-8888-4888-8888-888888888883', entryType: 'deposit', _sum: { amount: new Prisma.Decimal(2_000) } },
    ]);

    const response = await request(createApp({ nodeEnv: 'test', rateLimitMax: 1000 }))
      .get('/api/v1/savings-goals')
      .set('Authorization', `Bearer ${token()}`);

    expect(response.status).toBe(200);
    expect(response.body.data.summary).toEqual({ totalTarget: 17_000, totalSaved: 9_500, percentage: 55.9 });
    expect(response.body.data.items.map((goal: { currentAmount: number; remaining: number; status: string }) => goal)).toEqual([
      expect.objectContaining({ currentAmount: 3_000, remaining: 7_000, status: 'in_progress' }),
      expect.objectContaining({ currentAmount: 4_500, remaining: 500, status: 'almost_done' }),
      expect.objectContaining({ currentAmount: 2_000, remaining: 0, status: 'completed' }),
    ]);
    expect(response.body.data.items[0]).not.toHaveProperty('savedAmount');
    expect(response.body.data.items[0]).not.toHaveProperty('remainingAmount');
  });

  it('returns savings goal detail and deposit history in the documented shape', async () => {
    const goalId = '88888888-8888-4888-8888-888888888881';
    mocks.savingsGoalFindFirst.mockResolvedValue({
      id: goalId,
      title: 'Dana darurat',
      targetAmount: new Prisma.Decimal(10_000),
      deadline: null,
      completedAt: null,
    });
    mocks.savingsDepositGroupBy.mockResolvedValue([
      { entryType: 'deposit', _sum: { amount: new Prisma.Decimal(3_000) } },
    ]);
    mocks.savingsDepositFindMany.mockResolvedValue([{
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      entryType: 'deposit',
      amount: new Prisma.Decimal(3_000),
      depositDate: new Date('2026-10-10T00:00:00.000Z'),
      note: 'Setoran demo',
    }]);

    const response = await request(createApp({ nodeEnv: 'test', rateLimitMax: 1000 }))
      .get(`/api/v1/savings-goals/${goalId}`)
      .set('Authorization', `Bearer ${token()}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ id: goalId, currentAmount: 3_000, remaining: 7_000, entries: [
      { entryType: 'deposit', amount: 3_000, depositDate: '2026-10-10', note: 'Setoran demo' },
    ] });
  });

  it('persists an over-budget expense and deduplicates budget_exceeded notifications', async () => {
    const today = wibToday();
    const [yearText, monthText] = today.split('-');
    const month = Number(monthText);
    const year = Number(yearText);
    const budget = {
      id: '99999999-9999-4999-8999-999999999999',
      userId: USER_ID,
      categoryId: CATEGORY_IDS.food,
      month,
      year,
      budgetAmount: new Prisma.Decimal(1_000),
      category: { id: CATEGORY_IDS.food, name: 'Food', color: '#F59E0B' },
    };
    const notificationKeys = new Map<string, string>();
    const transactionDate = new Date(`${today}T00:00:00.000Z`);
    const transaction = {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      type: 'expense',
      amount: new Prisma.Decimal(100),
      transactionDate,
      description: 'Makan',
      source: 'manual',
      category: budget.category,
    };
    const tx = {
      category: { findFirst: vi.fn().mockResolvedValue({ id: CATEGORY_IDS.food, type: 'expense' }) },
      transaction: {
        create: vi.fn().mockResolvedValue(transaction),
        aggregate: vi.fn().mockResolvedValue({ _sum: { amount: new Prisma.Decimal(1_100) } }),
      },
      budget: { findMany: vi.fn().mockResolvedValue([budget]) },
      notification: {
        createManyAndReturn: vi.fn(async ({ data, skipDuplicates }: { data: Array<{ userId: string; type: 'budget_warning' | 'budget_exceeded'; dedupeKey: string }>; skipDuplicates: boolean }) => {
          const created: Array<{ userId: string; type: 'budget_warning' | 'budget_exceeded' }> = [];
          for (const row of data) {
            if (!skipDuplicates || !notificationKeys.has(row.dedupeKey)) {
              notificationKeys.set(row.dedupeKey, row.type);
              created.push({ userId: row.userId, type: row.type });
            }
          }
          return created;
        }),
      },
    };
    mocks.transactionRun.mockImplementation(async (callback) => callback(tx));
    mocks.budgetFindMany.mockResolvedValue([budget]);
    mocks.transactionGroupBy.mockResolvedValue([{ categoryId: CATEGORY_IDS.food, _sum: { amount: new Prisma.Decimal(1_100) } }]);
    const app = createApp({ nodeEnv: 'test', rateLimitMax: 1000 });

    const first = await request(app).post('/api/v1/transactions').set('Authorization', `Bearer ${token()}`).send({
      type: 'expense', categoryId: CATEGORY_IDS.food, amount: 100, transactionDate: today, description: 'Makan',
    });
    const second = await request(app).post('/api/v1/transactions').set('Authorization', `Bearer ${token()}`).send({
      type: 'expense', categoryId: CATEGORY_IDS.food, amount: 100, transactionDate: today, description: 'Makan',
    });
    const budgetsResponse = await request(app).get(`/api/v1/budgets?month=${month}&year=${year}`).set('Authorization', `Bearer ${token()}`);

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(budgetsResponse.body.data.items[0]).toMatchObject({ status: 'exceeded', remaining: -100 });
    expect(tx.notification.createManyAndReturn).toHaveBeenCalledWith(expect.objectContaining({ skipDuplicates: true }));
    expect([...notificationKeys.values()].filter((type) => type === 'budget_exceeded')).toHaveLength(1);
  });
});
