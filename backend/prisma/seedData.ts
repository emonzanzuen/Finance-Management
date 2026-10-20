export interface DemoPeriod {
  month: number;
  year: number;
}

export interface DemoTransactionPlan {
  id: string;
  categoryType: 'income' | 'expense';
  categoryName: string;
  amount: number;
  transactionDate: string;
  description: string;
}

export interface DemoBudgetPlan {
  categoryName: string;
  budgetAmount: number;
}

export interface DemoGoalPlan {
  id: string;
  depositId: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string;
  depositDate: string;
}

function monthOffset(period: DemoPeriod, offset: number): DemoPeriod {
  const date = new Date(Date.UTC(period.year, period.month - 1 + offset, 1));
  return { month: date.getUTCMonth() + 1, year: date.getUTCFullYear() };
}

function demoId(sequence: number): string {
  return `20000000-0000-4000-8000-${sequence.toString().padStart(12, '0')}`;
}

function dateInMonth(period: DemoPeriod, day: number): string {
  const lastDay = new Date(Date.UTC(period.year, period.month, 0)).getUTCDate();
  const safeDay = Math.max(1, Math.min(day, lastDay));
  return `${period.year}-${String(period.month).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
}

export function buildDemoTransactions(currentPeriod: DemoPeriod, currentDay = 31): DemoTransactionPlan[] {
  const transactions: DemoTransactionPlan[] = [];
  let sequence = 1;

  for (let index = 0; index < 6; index += 1) {
    const period = monthOffset(currentPeriod, index - 5);
    const isCurrentMonth = index === 5;
    const periodLabel = `${period.year}-${String(period.month).padStart(2, '0')}`;
    const expenses = isCurrentMonth
      ? [
          { categoryName: 'Food', amount: 500_000 },
          { categoryName: 'Transportation', amount: 750_000 },
          { categoryName: 'Bills', amount: 950_000 },
          { categoryName: 'Shopping', amount: 1_200_000 },
        ]
      : [
          { categoryName: 'Food', amount: 700_000 + index * 50_000 },
          { categoryName: 'Transportation', amount: 280_000 + index * 20_000 },
          { categoryName: 'Bills', amount: 500_000 + index * 25_000 },
          { categoryName: 'Entertainment', amount: 180_000 + index * 15_000 },
        ];

    transactions.push({
      id: demoId(sequence++),
      categoryType: 'income',
      categoryName: 'Salary',
      amount: 7_000_000 + index * 150_000,
      transactionDate: dateInMonth(period, isCurrentMonth ? Math.min(2, currentDay) : 2),
      description: `Demo salary ${periodLabel}`,
    });
    expenses.forEach((expense, expenseIndex) => {
      transactions.push({
        id: demoId(sequence++),
        categoryType: 'expense',
        categoryName: expense.categoryName,
        amount: expense.amount,
        transactionDate: dateInMonth(period, isCurrentMonth ? Math.min(5 + expenseIndex, currentDay) : 5 + expenseIndex),
        description: `Demo ${expense.categoryName.toLowerCase()} ${periodLabel}`,
      });
    });
  }

  return transactions;
}

export function buildDemoBudgets(): DemoBudgetPlan[] {
  return ['Food', 'Transportation', 'Bills', 'Shopping'].map((categoryName) => ({
    categoryName,
    budgetAmount: 1_000_000,
  }));
}

export function buildDemoGoals(currentPeriod: DemoPeriod, currentDay = 31): DemoGoalPlan[] {
  const plan = [
    { id: '30000000-0000-4000-8000-000000000001', depositId: '40000000-0000-4000-8000-000000000001', title: 'Dana darurat', targetAmount: 10_000_000, savedAmount: 3_000_000, deadline: '2027-06-30' },
    { id: '30000000-0000-4000-8000-000000000002', depositId: '40000000-0000-4000-8000-000000000002', title: 'Laptop baru', targetAmount: 5_000_000, savedAmount: 4_500_000, deadline: '2027-03-31' },
    { id: '30000000-0000-4000-8000-000000000003', depositId: '40000000-0000-4000-8000-000000000003', title: 'Liburan keluarga', targetAmount: 2_000_000, savedAmount: 2_000_000, deadline: '2026-12-31' },
  ];

  return plan.map((goal, index) => ({
    ...goal,
    depositDate: dateInMonth(currentPeriod, Math.min(10 + index, currentDay)),
  }));
}
