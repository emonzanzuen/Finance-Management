import { Prisma } from '@prisma/client';
import { AppError } from '../../lib/errors';
import { currentWibMonth, monthRange } from '../../lib/dates';
import { amountToDecimal, decimalToAmount, ratioPercent } from '../../lib/money';
import { prisma } from '../../lib/prisma';
import type { CreateBudgetInput } from './budgets.schema';

const notFound = () => new AppError('NOT_FOUND', 404, 'Sumber daya tidak ditemukan.');

function budgetStatus(spent: Prisma.Decimal, amount: Prisma.Decimal): 'safe' | 'warning' | 'critical' | 'exceeded' {
  const percentage = spent.div(amount).mul(100);
  if (percentage.gt(100)) return 'exceeded';
  if (percentage.gte(90)) return 'critical';
  if (percentage.gte(70)) return 'warning';
  return 'safe';
}

export async function listBudgets(userId: string, requestedMonth?: number, requestedYear?: number) {
  const now = currentWibMonth();
  const month = requestedMonth ?? now.month;
  const year = requestedYear ?? now.year;
  const { start, end } = monthRange(month, year);
  const [budgets, spentGroups] = await Promise.all([
    prisma.budget.findMany({
      where: { userId, month, year },
      include: { category: { select: { id: true, name: true, color: true } } },
      orderBy: { category: { name: 'asc' } },
    }),
    prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId, type: 'expense', transactionDate: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
  ]);
  const spentByCategory = new Map(spentGroups.map((group) => [group.categoryId, group._sum.amount ?? new Prisma.Decimal(0)]));
  const items = budgets.map((budget) => {
    const spent = spentByCategory.get(budget.categoryId) ?? new Prisma.Decimal(0);
    const remaining = budget.budgetAmount.sub(spent);
    return {
      id: budget.id,
      category: budget.category,
      budgetAmount: decimalToAmount(budget.budgetAmount),
      spentAmount: decimalToAmount(spent),
      remaining: decimalToAmount(remaining),
      percentage: ratioPercent(spent, budget.budgetAmount),
      status: budgetStatus(spent, budget.budgetAmount),
    };
  });
  const totalBudget = budgets.reduce((sum, budget) => sum.add(budget.budgetAmount), new Prisma.Decimal(0));
  const totalSpent = items.reduce((sum, item) => sum.add(item.spentAmount), new Prisma.Decimal(0));
  const totalRemaining = totalBudget.sub(totalSpent);
  return {
    month,
    year,
    summary: {
      totalBudget: decimalToAmount(totalBudget),
      totalSpent: decimalToAmount(totalSpent),
      remaining: decimalToAmount(totalRemaining),
      percentage: ratioPercent(totalSpent, totalBudget),
    },
    items,
  };
}

export async function createBudget(userId: string, input: CreateBudgetInput) {
  const category = await prisma.category.findFirst({ where: { id: input.categoryId, userId } });
  if (!category) throw notFound();
  if (category.type !== 'expense') {
    throw new AppError('VALIDATION_ERROR', 400, 'Budget hanya dapat dibuat untuk kategori pengeluaran.');
  }
  try {
    const budget = await prisma.budget.create({
      data: { ...input, userId, budgetAmount: amountToDecimal(input.budgetAmount) },
      include: { category: { select: { id: true, name: true, color: true } } },
    });
    return {
      id: budget.id,
      category: budget.category,
      month: budget.month,
      year: budget.year,
      budgetAmount: decimalToAmount(budget.budgetAmount),
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError('BUDGET_DUPLICATE', 409, 'Budget untuk kategori dan periode ini sudah ada.');
    }
    throw error;
  }
}

export async function updateBudget(userId: string, id: string, amount: number) {
  const updated = await prisma.budget.updateMany({
    where: { id, userId },
    data: { budgetAmount: amountToDecimal(amount) },
  });
  if (updated.count !== 1) throw notFound();
  const budget = await prisma.budget.findFirstOrThrow({
    where: { id, userId },
    include: { category: { select: { id: true, name: true, color: true } } },
  });
  return {
    id: budget.id,
    category: budget.category,
    month: budget.month,
    year: budget.year,
    budgetAmount: decimalToAmount(budget.budgetAmount),
  };
}

export async function deleteBudget(userId: string, id: string): Promise<void> {
  const result = await prisma.budget.deleteMany({ where: { id, userId } });
  if (result.count !== 1) throw notFound();
}

export async function topUpBudget(userId: string, id: string, amount: number) {
  return prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT id FROM budgets WHERE id = ${id}::uuid AND user_id = ${userId}::uuid FOR UPDATE
    `);
    if (locked.length !== 1) throw notFound();
    const budget = await tx.budget.findFirst({
      where: { id, userId },
      include: { category: { select: { id: true, name: true, color: true } } },
    });
    if (!budget) throw notFound();
    const nextAmount = budget.budgetAmount.add(amount);
    if (nextAmount.gt(999_999_999_999)) {
      throw new AppError('VALIDATION_ERROR', 400, 'Total budget melebihi batas nominal.');
    }
    const updateResult = await tx.budget.updateMany({ where: { id, userId }, data: { budgetAmount: nextAmount } });
    if (updateResult.count !== 1) throw notFound();
    const updated = await tx.budget.findFirstOrThrow({ where: { id, userId } });
    const { start, end } = monthRange(budget.month, budget.year);
    const aggregate = await tx.transaction.aggregate({
      where: { userId, categoryId: budget.categoryId, type: 'expense', transactionDate: { gte: start, lt: end } },
      _sum: { amount: true },
    });
    const spent = aggregate._sum.amount ?? new Prisma.Decimal(0);
    const remaining = updated.budgetAmount.sub(spent);
    return {
      id: updated.id,
      category: budget.category,
      month: updated.month,
      year: updated.year,
      budgetAmount: decimalToAmount(updated.budgetAmount),
      spentAmount: decimalToAmount(spent),
      remaining: decimalToAmount(remaining),
      percentage: ratioPercent(spent, updated.budgetAmount),
      status: budgetStatus(spent, updated.budgetAmount),
    };
  });
}
