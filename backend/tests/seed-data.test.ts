import { describe, expect, it } from 'vitest';
import { buildDemoBudgets, buildDemoGoals, buildDemoTransactions } from '../prisma/seedData';

describe('demo seed plan', () => {
  const period = { month: 10, year: 2026 };

  it('creates stable transaction samples across the current and previous five months', () => {
    const firstRun = buildDemoTransactions(period);
    const secondRun = buildDemoTransactions(period);
    const months = new Set(firstRun.map((transaction) => transaction.transactionDate.slice(0, 7)));

    expect(months).toEqual(new Set(['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10']));
    expect(firstRun).toEqual(secondRun);
    expect(new Set(firstRun.map((transaction) => transaction.id)).size).toBe(firstRun.length);
  });

  it('does not place current-month sample entries in the future', () => {
    const currentTransactions = buildDemoTransactions(period, 3).filter((transaction) => transaction.transactionDate.startsWith('2026-10'));
    const currentDeposits = buildDemoGoals(period, 3).map((goal) => goal.depositDate);

    expect(currentTransactions.every((transaction) => Number(transaction.transactionDate.slice(-2)) <= 3)).toBe(true);
    expect(currentDeposits.every((date) => Number(date.slice(-2)) <= 3)).toBe(true);
  });

  it('seeds current-month budgets and goals for every progress status', () => {
    const currentExpenses = buildDemoTransactions(period).filter((transaction) => transaction.categoryType === 'expense' && transaction.transactionDate.startsWith('2026-10'));
    const spendingByCategory = new Map(currentExpenses.map((transaction) => [transaction.categoryName, transaction.amount]));
    const budgets = buildDemoBudgets();
    const statuses = budgets.map((budget) => {
      const percentage = (spendingByCategory.get(budget.categoryName) ?? 0) / budget.budgetAmount * 100;
      return percentage > 100 ? 'exceeded' : percentage >= 90 ? 'critical' : percentage >= 70 ? 'warning' : 'safe';
    });
    const goalStatuses = buildDemoGoals(period).map((goal) => {
      const percentage = goal.savedAmount / goal.targetAmount * 100;
      return percentage >= 100 ? 'completed' : percentage >= 80 ? 'almost_done' : 'in_progress';
    });

    expect(statuses).toEqual(['safe', 'warning', 'critical', 'exceeded']);
    expect(goalStatuses).toEqual(['in_progress', 'almost_done', 'completed']);
  });
});
