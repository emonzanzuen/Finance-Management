import { Prisma } from '@prisma/client';
import { currentWibMonth, monthRange } from '../../lib/dates';
import { decimalToAmount, ratioPercent } from '../../lib/money';
import { prisma } from '../../lib/prisma';

export async function getMonthlyReport(userId: string, requestedMonth?: number, requestedYear?: number) {
  const current = currentWibMonth();
  const month = requestedMonth ?? current.month;
  const year = requestedYear ?? current.year;
  const { start, end } = monthRange(month, year);
  const groups = await prisma.transaction.groupBy({
    by: ['type', 'categoryId'],
    where: { userId, transactionDate: { gte: start, lt: end } },
    _sum: { amount: true },
  });
  const [categories] = await Promise.all([
    prisma.category.findMany({ where: { userId, id: { in: groups.map((group) => group.categoryId) } }, select: { id: true, name: true, color: true } }),
  ]);
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const income = groups.filter((group) => group.type === 'income').reduce((total, group) => total.add(group._sum.amount ?? 0), new Prisma.Decimal(0));
  const expense = groups.filter((group) => group.type === 'expense').reduce((total, group) => total.add(group._sum.amount ?? 0), new Prisma.Decimal(0));
  const mapByType = (type: 'income' | 'expense') => groups
    .filter((group) => group.type === type)
    .map((group) => {
      const category = categoryById.get(group.categoryId);
      if (!category) return null;
      const amount = group._sum.amount ?? new Prisma.Decimal(0);
      const total = type === 'income' ? income : expense;
      return { categoryId: category.id, name: category.name, color: category.color, amount: decimalToAmount(amount), percentage: ratioPercent(amount, total) };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => b.amount - a.amount);
  return {
    period: { month, year },
    income: decimalToAmount(income),
    expense: decimalToAmount(expense),
    difference: decimalToAmount(income.sub(expense)),
    expenseByCategory: mapByType('expense'),
    incomeByCategory: mapByType('income'),
  };
}

export async function getTrendReport(userId: string, year: number) {
  const groups = await prisma.transaction.groupBy({
    by: ['type', 'transactionDate'],
    where: { userId, transactionDate: { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) } },
    _sum: { amount: true },
  });
  const totals = new Map<number, { income: Prisma.Decimal; expense: Prisma.Decimal }>();
  for (const group of groups) {
    const month = group.transactionDate.getUTCMonth() + 1;
    const values = totals.get(month) ?? { income: new Prisma.Decimal(0), expense: new Prisma.Decimal(0) };
    const amount = group._sum.amount ?? new Prisma.Decimal(0);
    if (group.type === 'income') values.income = values.income.add(amount);
    else values.expense = values.expense.add(amount);
    totals.set(month, values);
  }
  return {
    year,
    months: Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const values = totals.get(month) ?? { income: new Prisma.Decimal(0), expense: new Prisma.Decimal(0) };
      return { month, income: decimalToAmount(values.income), expense: decimalToAmount(values.expense) };
    }),
  };
}
