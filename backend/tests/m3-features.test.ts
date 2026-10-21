import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import ExcelJS from 'exceljs';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(), sessionFindFirst: vi.fn(), sessionUpdateMany: vi.fn(), sessionCreate: vi.fn(),
  userFindUnique: vi.fn(), userUpdate: vi.fn(), transactionCount: vi.fn(), savingsGoalCount: vi.fn(),
  savingsDepositGroupBy: vi.fn(), categoryFindMany: vi.fn(), transactionFindMany: vi.fn(),
  transactionGroupBy: vi.fn(),
  notificationFindMany: vi.fn(), notificationCount: vi.fn(), notificationUpdateMany: vi.fn(),
  deviceTokenDeleteMany: vi.fn(), budgetFindFirst: vi.fn(), budgetUpdate: vi.fn(), transactionAggregate: vi.fn(),
}));

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    $transaction: mocks.transaction,
    session: { findFirst: mocks.sessionFindFirst, updateMany: mocks.sessionUpdateMany, create: mocks.sessionCreate },
    user: { findUnique: mocks.userFindUnique },
    transaction: { count: mocks.transactionCount, findMany: mocks.transactionFindMany, aggregate: mocks.transactionAggregate, groupBy: mocks.transactionGroupBy },
    savingsGoal: { count: mocks.savingsGoalCount },
    savingsDeposit: { groupBy: mocks.savingsDepositGroupBy },
    category: { findMany: mocks.categoryFindMany },
    notification: { findMany: mocks.notificationFindMany, count: mocks.notificationCount, updateMany: mocks.notificationUpdateMany },
    deviceToken: { deleteMany: mocks.deviceTokenDeleteMany },
  },
}));

import { createApp } from '../src/app';
import { commitTransactionsImport } from '../src/modules/imports/imports.service';
import { previewImport } from '../src/modules/imports/imports.parser';

const USER_ID = '9fdc0e9b-7031-4d7c-ae2a-862dc41518ad';
const SESSION_A = '16eeed00-d4bd-45a4-8092-67d869a7fa35';
const SESSION_B = '26eeed00-d4bd-45a4-8092-67d869a7fa35';
const SECRET = 'm3-test-secret-never-use-in-production-123456';
const HASH = '$argon2id$v=19$m=19456,t=2,p=1$UXJxY2pVZmlDSk1JMEVzRA$HcYl1nRfFtXvT3YvVb3+I17KyjkdyXi1k1/BFXUN1VI';
let app: ReturnType<typeof createApp>;
let activeSessions: Set<string>;

function token(sessionId = SESSION_A, email = 'user@example.com'): string {
  void email;
  return jwt.sign({ sid: sessionId }, SECRET, {
    algorithm: 'HS256', subject: USER_ID, issuer: 'finmanage-api', audience: 'finmanage-mobile', expiresIn: '1h',
  });
}

async function xlsxBuffer(rows: unknown[][]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Transaksi');
  rows.forEach((row) => sheet.addRow(row));
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

beforeEach(() => {
  process.env.DATABASE_URL = 'postgresql://localhost:5432/finmanage_test';
  process.env.JWT_SECRET = SECRET;
  activeSessions = new Set([SESSION_A, SESSION_B]);
  vi.clearAllMocks();
  const user = { id: USER_ID, name: 'Pengguna Uji', email: 'user@example.com', avatarData: null, receiptScanConsentAt: null, status: 'active', passwordHash: HASH };
  mocks.userFindUnique.mockResolvedValue(user);
  mocks.transactionCount.mockResolvedValue(0);
  mocks.transactionFindMany.mockResolvedValue([]);
  mocks.transactionGroupBy.mockResolvedValue([]);
  mocks.categoryFindMany.mockResolvedValue([]);
  mocks.savingsGoalCount.mockResolvedValue(0);
  mocks.savingsDepositGroupBy.mockResolvedValue([]);
  mocks.sessionFindFirst.mockImplementation(async ({ where }: { where: { id: string } }) => activeSessions.has(where.id)
    ? { id: where.id, userId: USER_ID, lastUsedAt: new Date() }
    : null);
  mocks.sessionUpdateMany.mockImplementation(async ({ where }: { where: { userId?: string; id?: string; id_not?: string } }) => {
    if (where.id) activeSessions.delete(where.id);
    else if (where.userId) activeSessions.clear();
    return { count: 1 };
  });
  mocks.sessionCreate.mockImplementation(async ({ data }: { data: { id: string } }) => {
    activeSessions.add(data.id);
    return data;
  });
  const tx = {
    user: { update: vi.fn(async ({ data }: { data: { passwordHash: string } }) => ({ ...user, ...data })) },
    session: {
      updateMany: mocks.sessionUpdateMany,
      create: mocks.sessionCreate,
    },
    deviceToken: { deleteMany: mocks.deviceTokenDeleteMany },
  };
  mocks.transaction.mockImplementation(async (callback: (client: typeof tx) => unknown) => callback(tx));
  app = createApp({ nodeEnv: 'test', rateLimitMax: 1000, corsOrigins: ['http://localhost:8081'] });
});

describe('M3 auth and security', () => {
  it('changes password atomically, revokes both old sessions, and issues one usable token', async () => {
    mocks.userFindUnique.mockResolvedValue({
      id: USER_ID, name: 'Pengguna Uji', email: 'user@example.com', avatarData: null, status: 'active',
      passwordHash: await argon2.hash('OldPassword123'),
    });
    const response = await request(app).post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${token(SESSION_A)}`)
      .send({ currentPassword: 'OldPassword123', newPassword: 'NewPassword123' });
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ token: expect.any(String) });
    expect(response.body.data.user).toBeUndefined();
    const oldA = await request(app).get('/api/v1/profile').set('Authorization', `Bearer ${token(SESSION_A)}`);
    const oldB = await request(app).get('/api/v1/profile').set('Authorization', `Bearer ${token(SESSION_B)}`);
    const newToken = response.body.data.token as string;
    const accepted = await request(app).get('/api/v1/profile').set('Authorization', `Bearer ${newToken}`);
    expect(oldA.status).toBe(401);
    expect(oldB.status).toBe(401);
    expect(accepted.status).toBe(200);
  });

  it('rejects a wrong current password without changing sessions', async () => {
    mocks.userFindUnique.mockResolvedValue({
      id: USER_ID, email: 'user@example.com', passwordHash: await argon2.hash('ActualPassword123'),
    });
    const response = await request(app).post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${token()}`)
      .send({ currentPassword: 'WrongPassword123', newPassword: 'NewPassword123' });
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(activeSessions).toEqual(new Set([SESSION_A, SESSION_B]));
  });

  it('logout-all revokes sessions and removes all device tokens', async () => {
    const response = await request(app).post('/api/v1/auth/logout-all').set('Authorization', `Bearer ${token()}`);
    expect(response.status).toBe(204);
    expect(activeSessions.size).toBe(0);
    expect(mocks.deviceTokenDeleteMany).toHaveBeenCalledWith({ where: { userId: USER_ID } });
    const rejected = await request(app).get('/api/v1/profile').set('Authorization', `Bearer ${token(SESSION_B)}`);
    expect(rejected.status).toBe(401);
  });

  it('rate limits change-password with Retry-After and scopes other sensitive routes', async () => {
    const responses = [];
    for (let index = 0; index < 6; index += 1) {
      responses.push(await request(app).post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${token()}`).send({ extra: true }));
    }
    expect(responses[5]?.status).toBe(429);
    expect(responses[5]?.body.error.code).toBe('RATE_LIMITED');
    expect(responses[5]?.headers['retry-after']).toBeTruthy();
  });

  it('rate limits register, import commit, and report export at their configured thresholds', async () => {
    const registerResponses = [];
    for (let index = 0; index < 6; index += 1) {
      registerResponses.push(await request(app).post('/api/v1/auth/register').send({ invalid: true }));
    }
    expect(registerResponses[5]?.status).toBe(429);

    const importResponses = [];
    for (let index = 0; index < 11; index += 1) {
      importResponses.push(await request(app).post('/api/v1/imports/transactions/commit')
        .set('Authorization', `Bearer ${token()}`).send({ invalid: true }));
    }
    expect(importResponses[10]?.status).toBe(429);
    expect(importResponses[10]?.headers['retry-after']).toBeTruthy();

    const exportResponses = [];
    for (let index = 0; index < 21; index += 1) {
      exportResponses.push(await request(app).get('/api/v1/reports/export?format=bad')
        .set('Authorization', `Bearer ${token()}`).set('X-Forwarded-For', '203.0.113.8'));
    }
    expect(exportResponses[20]?.status).toBe(429);
    expect(exportResponses[20]?.headers['retry-after']).toBeTruthy();
  });

  it('serves secure response headers and never enables wildcard CORS', async () => {
    const response = await request(app).get('/api/v1/health').set('Origin', 'http://localhost:8081');
    expect(response.headers['x-powered-by']).toBeUndefined();
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['access-control-allow-origin']).not.toBe('*');
  });
});

describe('M3 profile, notifications, budget, and exports', () => {
  it('updates profile fields, returns contract-shaped profile data, and revokes other sessions on email change', async () => {
    const profileUser = {
      id: USER_ID, name: 'Pengguna Uji', email: 'user@example.com', avatarData: null,
      receiptScanConsentAt: null, createdAt: new Date('2026-01-01T00:00:00.000Z'),
      status: 'active', passwordHash: await argon2.hash('CurrentPassword123'),
    };
    mocks.userFindUnique.mockImplementation(async () => profileUser);
    const userUpdate = vi.fn(async ({ data }: { data: Partial<typeof profileUser> }) => Object.assign(profileUser, data));
    const tx = { user: { update: userUpdate }, session: { updateMany: mocks.sessionUpdateMany } };
    mocks.transaction.mockImplementationOnce(async (callback: (client: typeof tx) => unknown) => callback(tx));
    const response = await request(app).patch('/api/v1/profile')
      .set('Authorization', `Bearer ${token()}`)
      .send({ email: ' NEW@EXAMPLE.COM ', currentPassword: 'CurrentPassword123', avatar: 'data:image/png;base64,YWJj' });
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ email: 'new@example.com', avatar: 'data:image/png;base64,YWJj', receiptScanConsent: false });
    expect(response.body.data.createdAt).toBeUndefined();
    expect(mocks.sessionUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: USER_ID, revokedAt: null, id: { not: SESSION_A } },
    }));
  });

  it('requires a valid current password to change email and rejects oversized avatars', async () => {
    const missingPassword = await request(app).patch('/api/v1/profile')
      .set('Authorization', `Bearer ${token()}`).send({ email: 'new@example.com' });
    expect(missingPassword.status).toBe(400);
    const oversized = await request(app).patch('/api/v1/profile')
      .set('Authorization', `Bearer ${token()}`)
      .send({ avatar: `data:image/jpeg;base64,${'A'.repeat(4 * Math.ceil(100 * 1024 / 3))}` });
    expect(oversized.status).toBe(413);
    expect(oversized.body.error.code).toBe('FILE_TOO_LARGE');
  });

  it('lists notifications with unread count and scopes read updates to the owner', async () => {
    mocks.notificationFindMany.mockResolvedValue([{ id: SESSION_A, type: 'budget_warning', isRead: false, createdAt: new Date(), data: {} }]);
    mocks.notificationCount.mockImplementation(async ({ where }: { where: { isRead?: boolean } }) => where.isRead === false ? 1 : 4);
    mocks.notificationUpdateMany.mockResolvedValue({ count: 0 });
    const list = await request(app).get('/api/v1/notifications?page=1&limit=20&unreadOnly=false')
      .set('Authorization', `Bearer ${token()}`);
    expect(list.status).toBe(200);
    expect(list.body.meta).toMatchObject({ page: 1, limit: 20, total: 4, totalPages: 1, unreadCount: 1 });
    const missing = await request(app).patch(`/api/v1/notifications/${SESSION_A}/read`)
      .set('Authorization', `Bearer ${token()}`);
    expect(missing.status).toBe(404);
    expect(mocks.notificationUpdateMany).toHaveBeenCalledWith({ where: { id: SESSION_A, userId: USER_ID }, data: { isRead: true } });
  });

  it('tops up only an owned budget and returns recalculated status fields', async () => {
    const budget = { id: SESSION_B, userId: USER_ID, categoryId: SESSION_A, month: 10, year: 2026, budgetAmount: new Prisma.Decimal(100_000), category: { id: SESSION_A, name: 'Food', color: '#F59E0B' } };
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: SESSION_B }]),
      budget: {
        findFirst: vi.fn().mockResolvedValue(budget),
        updateMany: vi.fn(async ({ data }: { data: { budgetAmount: Prisma.Decimal } }) => {
          budget.budgetAmount = data.budgetAmount;
          return { count: 1 };
        }),
        findFirstOrThrow: vi.fn(async () => budget),
      },
      transaction: { aggregate: vi.fn().mockResolvedValue({ _sum: { amount: new Prisma.Decimal(95_000) } }) },
    };
    mocks.transaction.mockImplementationOnce(async (callback: (client: typeof tx) => unknown) => callback(tx));
    const response = await request(app).post(`/api/v1/budgets/${SESSION_B}/top-up`)
      .set('Authorization', `Bearer ${token()}`).send({ amount: 50_000, source: 'manual' });
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ budgetAmount: 150_000, spentAmount: 95_000, remaining: 55_000, percentage: 63.3, status: 'safe' });
    expect(tx.budget.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: SESSION_B, userId: USER_ID } }));
  });

  it('returns valid PDF and XLSX report downloads with IDR filenames and headers', async () => {
    mocks.userFindUnique.mockResolvedValue({ name: 'Pengguna Uji' });
    const pdf = await request(app).get('/api/v1/reports/export?format=pdf&month=10&year=2026')
      .set('Authorization', `Bearer ${token()}`);
    expect(pdf.status).toBe(200);
    expect(pdf.headers['content-type']).toContain('application/pdf');
    expect(pdf.headers['content-disposition']).toContain('FinManage_Laporan_2026-10.pdf');
    expect(String(pdf.body).startsWith('%PDF')).toBe(true);
    const xlsx = await request(app).get('/api/v1/reports/export?format=xlsx&month=10&year=2026')
      .set('Authorization', `Bearer ${token()}`)
      .buffer(true)
      .parse((response, callback) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () => callback(null, Buffer.concat(chunks)));
      });
    expect(xlsx.status).toBe(200);
    expect(xlsx.headers['content-disposition']).toContain('FinManage_Laporan_2026-10.xlsx');
    expect(Buffer.isBuffer(xlsx.body)).toBe(true);
    expect((xlsx.body as Buffer).subarray(0, 2).toString()).toBe('PK');
  });
});

describe('M3 Excel import validation', () => {
  it('rejects non-ZIP uploads and zip archives exceeding the entry cap', async () => {
    await expect(previewImport(USER_ID, Buffer.from('not a spreadsheet'))).rejects.toMatchObject({ code: 'UNSUPPORTED_FILE', status: 415 });
    const bomb = Buffer.alloc(26);
    bomb.writeUInt32LE(0x04034b50, 0);
    bomb.writeUInt32LE(0x06054b50, 4);
    bomb.writeUInt16LE(101, 14);
    await expect(previewImport(USER_ID, bomb)).rejects.toMatchObject({ code: 'IMPORT_LIMIT_EXCEEDED', status: 400 });
  });

  it('rejects unrecognized headers before reading rows and returns actionable lists', async () => {
    const buffer = await xlsxBuffer([
      ['No', 'Hari', 'Tanggal', 'Bulan', 'Tahun', 'Barang Yang Dibeli', 'Jumlah', 'Total Rp'],
      [1, 'Senin', 1, 1, 2026, 'Makan', 'Satu', 25_000],
    ]);
    await expect(previewImport(USER_ID, buffer)).rejects.toMatchObject({
      code: 'IMPORT_HEADER_MISMATCH',
      details: {
        unknown: ['Barang Yang Dibeli', 'Jumlah', 'Total Rp'],
        missing: ['Tipe', 'Kategori', 'Deskripsi', 'Nominal'],
      },
    });
    expect(mocks.categoryFindMany).not.toHaveBeenCalled();
  });

  it('accepts three-column dates and rupiah thousands separators', async () => {
    const buffer = await xlsxBuffer([
      ['Tanggal', 'Bulan', 'Tahun', 'Tipe', 'Kategori', 'Deskripsi', 'Nominal'],
      [15, 'Oktober', 2026, 'Pengeluaran', 'Food', 'Makan', 'Rp 25.000'],
    ]);
    mocks.categoryFindMany.mockResolvedValue([{ id: 'cat', name: 'Food', nameKey: 'food', type: 'expense' }]);
    mocks.transactionFindMany.mockResolvedValue([]);
    const result = await previewImport(USER_ID, buffer);
    expect(result).toMatchObject({ totalRows: 1, validCount: 1, invalidCount: 0, duplicateCount: 0 });
    expect(result.rows[0]).toMatchObject({ type: 'expense', category: 'Food', amount: 25_000, transactionDate: '2026-10-15', duplicate: false });
  });

  it('commits validated rows with import source in one transaction', async () => {
    const created: Array<Record<string, unknown>> = [];
    const tx = {
      transaction: {
        findMany: vi.fn().mockResolvedValue([]),
        createMany: vi.fn(async ({ data }: { data: Array<Record<string, unknown>> }) => { created.push(...data); return { count: data.length }; }),
      },
      category: { findMany: vi.fn().mockResolvedValue([{ id: 'food-id', name: 'Food', nameKey: 'food', type: 'expense' }]) },
      budget: { findMany: vi.fn().mockResolvedValue([]) },
      notification: { createMany: vi.fn() },
    };
    mocks.transaction.mockImplementationOnce(async (callback: (client: typeof tx) => unknown) => callback(tx));
    const result = await commitTransactionsImport(USER_ID, {
      unknownCategoryMode: 'create', skipDuplicates: true,
      rows: [{ type: 'expense', category: 'Food', amount: 25_000, transactionDate: '2026-10-15', description: 'Makan' }],
    });
    expect(result).toEqual({ imported: 1, skipped: 0, createdCategories: [] });
    expect(created[0]).toMatchObject({ userId: USER_ID, categoryId: 'food-id', source: 'import', amount: new Prisma.Decimal(25_000) });
  });

  it('rejects workbooks with more than 1,000 data rows', async () => {
    const values: unknown[][] = [['Tanggal', 'Tipe', 'Kategori', 'Deskripsi', 'Nominal']];
    for (let index = 0; index < 1001; index += 1) values.push(['2026-01-01', 'Expense', 'Food', 'Test', 100]);
    await expect(previewImport(USER_ID, await xlsxBuffer(values))).rejects.toMatchObject({ code: 'IMPORT_LIMIT_EXCEEDED', status: 400 });
  });

  it('runs import writes inside one transaction so a mid-commit failure rolls back', async () => {
    const database = { categories: [] as unknown[], transactions: [] as unknown[] };
    const tx = {
      transaction: {
        findMany: vi.fn().mockResolvedValue([]),
        createMany: vi.fn(async ({ data }: { data: unknown[] }) => {
          database.transactions.push(...data);
          throw new Error('simulated failure');
        }),
      },
      category: {
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn(async ({ data }: { data: unknown }) => {
          database.categories.push(data);
          return { id: 'category-id', name: 'Unlisted', nameKey: 'unlisted', type: 'expense' };
        }),
      },
      notification: { createMany: vi.fn() },
    };
    mocks.transaction.mockImplementationOnce(async (callback: (client: typeof tx) => unknown) => {
      const categorySnapshot = [...database.categories];
      const transactionSnapshot = [...database.transactions];
      try { return await callback(tx); }
      catch (error) {
        database.categories = categorySnapshot;
        database.transactions = transactionSnapshot;
        throw error;
      }
    });
    await expect(commitTransactionsImport(USER_ID, {
      unknownCategoryMode: 'create', skipDuplicates: true,
      rows: [{ type: 'expense', category: 'Unlisted', amount: 1000, transactionDate: '2026-01-01', description: 'Import' }],
    })).rejects.toThrow('simulated failure');
    expect(database.categories).toHaveLength(0);
    expect(database.transactions).toHaveLength(0);
  });
});
