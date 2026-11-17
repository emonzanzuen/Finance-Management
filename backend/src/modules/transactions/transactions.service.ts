import { Prisma } from '@prisma/client';
import { AppError } from '../../lib/errors';
import { dateOnly, monthRange } from '../../lib/dates';
import { amountToDecimal, decimalToAmount, ratioPercent } from '../../lib/money';
import { prisma } from '../../lib/prisma';
import { schedulePushNotifications, type PushEvent } from '../../lib/pushNotifications';
import type { CreateTransactionInput, ListTransactionsQuery, UpdateTransactionInput } from './transactions.schema';

const NOT_FOUND = () => new AppError('NOT_FOUND', 404, 'Sumber daya tidak ditemukan.');

function transactionResponse<T extends { amount: Prisma.Decimal; transactionDate: Date; category: { id: string; name: string; color: string } }>(item: T) {
  return {
    ...item,
    amount: decimalToAmount(item.amount),
    transactionDate: dateOnly(item.transactionDate),
  };
}

async function ownedCategory(tx: Prisma.TransactionClient, userId: string, categoryId: string, type: 'income' | 'expense') {
  const category = await tx.category.findFirst({ where: { id: categoryId, userId } });
  if (!category) throw NOT_FOUND();
  if (category.type !== type) {
    throw new AppError('VALIDATION_ERROR', 400, 'Tipe kategori tidak sesuai dengan tipe transaksi.');
  }
  return category;
}

export async function listTransactions(userId: string, query: ListTransactionsQuery) {
  const where: Prisma.TransactionWhereInput = {
    userId,
    ...(query.type ? { type: query.type } : {}),
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.dateFrom || query.dateTo ? {
      transactionDate: {
        ...(query.dateFrom ? { gte: new Date(`${query.dateFrom}T00:00:00.000Z`) } : {}),
        ...(query.dateTo ? { lte: new Date(`${query.dateTo}T00:00:00.000Z`) } : {}),
      },
    } : {}),
    ...(query.search ? {
      OR: [
        { description: { contains: query.search, mode: 'insensitive' } },
        { category: { name: { contains: query.search, mode: 'insensitive' } } },
      ],
    } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: { select: { id: true, name: true, color: true } } },
      orderBy: { [query.sortBy]: query.sortOrder },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.transaction.count({ where }),
  ]);
  return {
    data: items.map(transactionResponse),
    meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
  };
}

export async function getTransaction(userId: string, id: string) {
  const item = await prisma.transaction.findFirst({
    where: { id, userId },
    include: { category: { select: { id: true, name: true, color: true } } },
  });
  if (!item) throw NOT_FOUND();
  return transactionResponse(item);
}

export async function refreshBudgetNotifications(tx: Prisma.TransactionClient, userId: string, categoryId: string, date: Date): Promise<PushEvent[]> {
  const month = date.getUTCMonth() + 1;
  const year = date.getUTCFullYear();
  const { start, end } = monthRange(month, year);
  const budgets = await tx.budget.findMany({
    where: { userId, categoryId, month, year },
    include: { category: { select: { name: true } } },
  });
  if (!budgets.length) return [];
  const aggregate = await tx.transaction.aggregate({
    where: { userId, categoryId, type: 'expense', transactionDate: { gte: start, lt: end } },
    _sum: { amount: true },
  });
  const spent = aggregate._sum.amount ?? new Prisma.Decimal(0);
  const rows = [];
  for (const budget of budgets) {
    const pct = ratioPercent(spent, budget.budgetAmount);
    if (spent.gte(budget.budgetAmount.mul('0.9'))) {
      rows.push({
        userId,
        type: 'budget_warning' as const,
        data: { budgetId: budget.id, categoryName: budget.category.name, percentage: pct, month, year },
        dedupeKey: `budget:${budget.id}:90`,
      });
    }
    if (spent.gt(budget.budgetAmount)) {
      rows.push({
        userId,
        type: 'budget_exceeded' as const,
        data: { budgetId: budget.id, categoryName: budget.category.name, percentage: pct, month, year },
        dedupeKey: `budget:${budget.id}:100`,
      });
    }
  }
  if (!rows.length) return [];
  const created = await tx.notification.createManyAndReturn({
    data: rows,
    skipDuplicates: true,
    select: { userId: true, type: true },
  });
  return created.map(({ userId: ownerId, type }) => ({ userId: ownerId, type }));
}

export async function createTransaction(userId: string, input: CreateTransactionInput) {
  const result = await prisma.$transaction(async (tx) => {
    await ownedCategory(tx, userId, input.categoryId, input.type);
    const item = await tx.transaction.create({
      data: {
        userId,
        categoryId: input.categoryId,
        type: input.type,
        amount: amountToDecimal(input.amount),
        transactionDate: new Date(`${input.transactionDate}T00:00:00.000Z`),
        description: input.description ?? null,
      },
      include: { category: { select: { id: true, name: true, color: true } } },
    });
    const pushEvents = input.type === 'expense'
      ? await refreshBudgetNotifications(tx, userId, input.categoryId, item.transactionDate)
      : [];
    return { data: transactionResponse(item), pushEvents };
  });
  schedulePushNotifications(result.pushEvents);
  return result.data;
}

export async function updateTransaction(userId: string, id: string, input: UpdateTransactionInput) {
  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.transaction.findFirst({ where: { id, userId } });
    if (!current) throw NOT_FOUND();
    const nextType = input.type ?? current.type;
    const nextCategoryId = input.categoryId ?? current.categoryId;
    await ownedCategory(tx, userId, nextCategoryId, nextType);
    const updated = await tx.transaction.updateMany({
      where: { id, userId },
      data: {
        ...(input.type ? { type: input.type } : {}),
        ...(input.categoryId ? { categoryId: input.categoryId } : {}),
        ...(input.amount !== undefined ? { amount: amountToDecimal(input.amount) } : {}),
        ...(input.transactionDate ? { transactionDate: new Date(`${input.transactionDate}T00:00:00.000Z`) } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
      },
    });
    if (updated.count !== 1) throw NOT_FOUND();
    const item = await tx.transaction.findFirstOrThrow({
      where: { id, userId },
      include: { category: { select: { id: true, name: true, color: true } } },
    });
    const pushEvents: PushEvent[] = [];
    if (current.type === 'expense') pushEvents.push(...await refreshBudgetNotifications(tx, userId, current.categoryId, current.transactionDate));
    if (item.type === 'expense') pushEvents.push(...await refreshBudgetNotifications(tx, userId, item.categoryId, item.transactionDate));
    return { data: transactionResponse(item), pushEvents };
  });
  schedulePushNotifications(result.pushEvents);
  return result.data;
}

export async function deleteTransaction(userId: string, id: string): Promise<void> {
  const item = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!item) throw NOT_FOUND();
  const result = await prisma.transaction.deleteMany({ where: { id, userId } });
  if (result.count !== 1) throw NOT_FOUND();
}
