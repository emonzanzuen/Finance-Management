import argon2 from 'argon2';
import { Prisma, PrismaClient } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { DEFAULT_CATEGORIES } from '../src/lib/defaultCategories';
import { currentWibMonth, wibToday } from '../src/lib/dates';
import { buildDemoBudgets, buildDemoGoals, buildDemoTransactions } from './seedData';

const prisma = new PrismaClient();
const DEMO_EMAIL = 'demo@finmanage.local';
const DEMO_NAME = 'Akun Demo FinManage';

function validateDemoPassword(password: string): void {
  if (password.length < 12 || password.length > 128 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new Error('DEMO_USER_PASSWORD harus 12-128 karakter dan memuat huruf serta angka.');
  }
  if (password.toLowerCase() === DEMO_EMAIL || ['password123', 'admin1234', 'qwerty123'].includes(password.toLowerCase())) {
    throw new Error('DEMO_USER_PASSWORD terlalu mudah ditebak.');
  }
}

async function seedDemoAccount(): Promise<void> {
  const existing = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  let password = process.env.DEMO_USER_PASSWORD;
  let generatedPassword: string | undefined;

  if (password) validateDemoPassword(password);
  if (!existing && !password) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('DEMO_USER_PASSWORD wajib diatur untuk membuat akun demo di production.');
    }
    generatedPassword = randomBytes(32).toString('base64url');
    password = generatedPassword;
  }

  const passwordHash = password
    ? await argon2.hash(password, { type: argon2.argon2id, memoryCost: 19_456, timeCost: 2, parallelism: 1 })
    : existing?.passwordHash;
  if (!passwordHash) throw new Error('Password akun demo tidak tersedia.');

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    create: { name: DEMO_NAME, email: DEMO_EMAIL, passwordHash, status: 'active' },
    update: {
      name: DEMO_NAME,
      status: 'active',
      ...(password ? { passwordHash } : {}),
    },
    select: { id: true },
  });

  const currentPeriod = currentWibMonth();
  const currentDay = Number(wibToday().slice(8, 10));
  const transactions = buildDemoTransactions(currentPeriod, currentDay);
  const budgets = buildDemoBudgets();
  const goals = buildDemoGoals(currentPeriod, currentDay);

  // The demo seed performs many idempotent upserts over Neon. The default
  // interactive-transaction timeout (5 seconds) is too short for that number
  // of round trips on a remote database.
  await prisma.$transaction(async (tx) => {
    const categoryIds = new Map<string, string>();
    for (const category of DEFAULT_CATEGORIES) {
      const nameKey = category.name.trim().toLowerCase();
      const saved = await tx.category.upsert({
        where: { userId_type_nameKey: { userId: user.id, type: category.type, nameKey } },
        create: { userId: user.id, name: category.name, nameKey, type: category.type, color: category.color },
        update: { name: category.name, color: category.color },
        select: { id: true, name: true, type: true },
      });
      categoryIds.set(`${saved.type}:${saved.name}`, saved.id);
    }

    for (const transaction of transactions) {
      const categoryId = categoryIds.get(`${transaction.categoryType}:${transaction.categoryName}`);
      if (!categoryId) throw new Error('Kategori demo tidak ditemukan.');
      const data = {
        userId: user.id,
        categoryId,
        type: transaction.categoryType,
        amount: new Prisma.Decimal(transaction.amount),
        transactionDate: new Date(`${transaction.transactionDate}T00:00:00.000Z`),
        description: transaction.description,
        source: 'manual' as const,
      };
      await tx.transaction.upsert({ where: { id: transaction.id }, create: { id: transaction.id, ...data }, update: data });
    }

    for (const budget of budgets) {
      const categoryId = categoryIds.get(`expense:${budget.categoryName}`);
      if (!categoryId) throw new Error('Kategori budget demo tidak ditemukan.');
      const data = {
        userId: user.id,
        categoryId,
        month: currentPeriod.month,
        year: currentPeriod.year,
        budgetAmount: new Prisma.Decimal(budget.budgetAmount),
      };
      await tx.budget.upsert({
        where: { userId_categoryId_month_year: { userId: user.id, categoryId, month: currentPeriod.month, year: currentPeriod.year } },
        create: data,
        update: { budgetAmount: data.budgetAmount },
      });
    }

    for (const goal of goals) {
      const completed = goal.savedAmount >= goal.targetAmount;
      const goalData = {
        userId: user.id,
        title: goal.title,
        targetAmount: new Prisma.Decimal(goal.targetAmount),
        deadline: new Date(`${goal.deadline}T00:00:00.000Z`),
        completedAt: completed ? new Date() : null,
      };
      await tx.savingsGoal.upsert({ where: { id: goal.id }, create: { id: goal.id, ...goalData }, update: goalData });
      const depositData = {
        goalId: goal.id,
        userId: user.id,
        entryType: 'deposit' as const,
        amount: new Prisma.Decimal(goal.savedAmount),
        depositDate: new Date(`${goal.depositDate}T00:00:00.000Z`),
        note: 'Setoran contoh akun demo',
      };
      await tx.savingsDeposit.upsert({
        where: { id: goal.depositId },
        create: { id: goal.depositId, ...depositData },
        update: depositData,
      });
      if (completed) {
        await tx.notification.upsert({
          where: { userId_dedupeKey: { userId: user.id, dedupeKey: `goal:${goal.id}:completed` } },
          create: {
            userId: user.id,
            type: 'goal_completed',
            data: { goalId: goal.id, title: goal.title },
            dedupeKey: `goal:${goal.id}:completed`,
          },
          update: { data: { goalId: goal.id, title: goal.title } },
        });
      }
    }
  }, { maxWait: 10_000, timeout: 60_000 });

  if (generatedPassword) {
    process.stdout.write(`Akun demo: ${DEMO_EMAIL}\nPassword demo satu kali: ${generatedPassword}\nSimpan kredensial ini di tempat aman.\n`);
  }
}

seedDemoAccount()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Seed akun demo gagal.';
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
