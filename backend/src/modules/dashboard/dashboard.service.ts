import { Prisma } from '@prisma/client';
import { currentWibMonth, monthRange } from '../../lib/dates';
import { decimalToAmount, ratioPercent } from '../../lib/money';
import { prisma } from '../../lib/prisma';

type Period = { month: number; year: number };

async function transactionSums(userId: string, start?: Date, end?: Date) {
  const groups = await prisma.transaction.groupBy({
    by: ['type'],
    where: { userId, ...(start && end ? { transactionDate: { gte: start, lt: end } } : {}) },
    _sum: { amount: true },
  });
  return {
    income: groups.find((group) => group.type === 'income')?._sum.amount ?? new Prisma.Decimal(0),
    expense: groups.find((group) => group.type === 'expense')?._sum.amount ?? new Prisma.Decimal(0),
  };
}

function previousMonth(period: Period): Period {
  return period.month === 1 ? { month: 12, year: period.year - 1 } : { month: period.month - 1, year: period.year };
}

export async function getDashboardSummary(userId: string, requestedMonth?: number, requestedYear?: number) {
  const current = currentWibMonth();
  const period = { month: requestedMonth ?? current.month, year: requestedYear ?? current.year };
  const { start, end } = monthRange(period.month, period.year);
  const previous = previousMonth(period);
  const previousRange = monthRange(previous.month, previous.year);
  const [allSums, monthSums, previousSums, savingsGroups, expenseGroups, recentTransactions, trendGroups, budgets] = await Promise.all([
    transactionSums(userId),
    transactionSums(userId, start, end),
    transactionSums(userId, previousRange.start, previousRange.end),
    prisma.savingsDeposit.groupBy({ by: ['entryType'], where: { userId }, _sum: { amount: true } }),
    prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId, type: 'expense', transactionDate: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
    prisma.transaction.findMany({
      where: { userId },
      orderBy: [{ transactionDate: 'desc' }, { createdAt: 'desc' }],
      take: 5,
      include: { category: { select: { id: true, name: true, color: true } } },
    }),
    prisma.transaction.groupBy({
      by: ['type', 'transactionDate'],
      where: { userId, transactionDate: { gte: new Date(Date.UTC(period.year, period.month - 6, 1)), lt: end } },
      _sum: { amount: true },
    }),
    prisma.budget.findMany({ where: { userId, month: period.month, year: period.year }, include: { category: { select: { name: true } } } }),
  ]);

  const totalSavings = savingsGroups.reduce((sum, group) => {
    const amount = group._sum.amount ?? new Prisma.Decimal(0);
    return group.entryType === 'deposit' ? sum.add(amount) : sum.sub(amount);
  }, new Prisma.Decimal(0));
  const totalExpense = expenseGroups.reduce((sum, group) => sum.add(group._sum.amount ?? 0), new Prisma.Decimal(0));
  const categoryIds = expenseGroups.map((group) => group.categoryId);
  const categories = await prisma.category.findMany({ where: { userId, id: { in: categoryIds } }, select: { id: true, name: true, color: true } });
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const expenseByCategory = expenseGroups
    .map((group) => {
      const category = categoryById.get(group.categoryId);
      if (!category) return null;
      const amount = group._sum.amount ?? new Prisma.Decimal(0);
      return {
        categoryId: category.id,
        name: category.name,
        color: category.color,
        amount: decimalToAmount(amount),
        percentage: ratioPercent(amount, totalExpense),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => b.amount - a.amount);

  const trendStart = new Date(Date.UTC(period.year, period.month - 6, 1));
  const monthTotals = new Map<string, { income: Prisma.Decimal; expense: Prisma.Decimal }>();
  for (const group of trendGroups) {
    const key = `${group.transactionDate.getUTCFullYear()}-${group.transactionDate.getUTCMonth() + 1}`;
    const item = monthTotals.get(key) ?? { income: new Prisma.Decimal(0), expense: new Prisma.Decimal(0) };
    const amount = group._sum.amount ?? new Prisma.Decimal(0);
    if (group.type === 'income') item.income = item.income.add(amount);
    else item.expense = item.expense.add(amount);
    monthTotals.set(key, item);
  }
  const trend = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(trendStart.getUTCFullYear(), trendStart.getUTCMonth() + index, 1));
    const month = date.getUTCMonth() + 1;
    const year = date.getUTCFullYear();
    const totals = monthTotals.get(`${year}-${month}`) ?? { income: new Prisma.Decimal(0), expense: new Prisma.Decimal(0) };
    return { month, year, income: decimalToAmount(totals.income), expense: decimalToAmount(totals.expense) };
  });

  const insights: Array<Record<string, string | number>> = [];
  if (!previousSums.expense.isZero()) {
    const change = monthSums.expense.sub(previousSums.expense).div(previousSums.expense).mul(100).toDecimalPlaces(1);
    insights.push({ type: 'expense_change', direction: change.isZero() ? 'same' : change.gt(0) ? 'up' : 'down', percent: Math.abs(change.toNumber()) });
  }
  if (expenseByCategory[0]) {
    insights.push({
      type: 'top_category',
      categoryId: expenseByCategory[0].categoryId,
      name: expenseByCategory[0].name,
      amount: expenseByCategory[0].amount,
      percentage: expenseByCategory[0].percentage,
    });
  }
  const budgetIds = budgets.map((budget) => budget.categoryId);
  const budgetSpent = budgetIds.length ? await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: { userId, type: 'expense', categoryId: { in: budgetIds }, transactionDate: { gte: start, lt: end } },
    _sum: { amount: true },
  }) : [];
  const spentByCategory = new Map(budgetSpent.map((row) => [row.categoryId, row._sum.amount ?? new Prisma.Decimal(0)]));
  const budgetsNearLimit = budgets.filter((budget) => (spentByCategory.get(budget.categoryId) ?? new Prisma.Decimal(0)).gte(budget.budgetAmount.mul('0.9'))).length;
  if (budgetsNearLimit) insights.push({ type: 'budgets_near_limit', count: budgetsNearLimit });

  return {
    period,
    balance: decimalToAmount(allSums.income.sub(allSums.expense)),
    income: decimalToAmount(monthSums.income),
    expense: decimalToAmount(monthSums.expense),
    totalSavings: decimalToAmount(totalSavings),
    expenseByCategory,
    trend,
    recentTransactions: recentTransactions.map((item) => ({
      id: item.id,
      type: item.type,
      amount: decimalToAmount(item.amount),
      transactionDate: item.transactionDate.toISOString().slice(0, 10),
      description: item.description,
      source: item.source,
      category: item.category,
      createdAt: item.createdAt.toISOString(),
    })),
    insights,
  };
}
