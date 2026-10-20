import type { ApiSuccess, DashboardSummaryResponse } from '@/types/api';
import { apiClient } from './client';

export async function getDashboardSummary(
  month: number,
  year: number,
): Promise<DashboardSummaryResponse> {
  const response = await apiClient.get<ApiSuccess<DashboardSummaryResponse>>('/dashboard/summary', {
    params: { month, year },
  });
  const d = response.data.data;
  return {
    ...d,
    balance: Number(d.balance ?? 0),
    income: Number(d.income ?? 0),
    expense: Number(d.expense ?? 0),
    totalSavings: Number(d.totalSavings ?? 0),
    expenseByCategory: (d.expenseByCategory ?? []).map((item) => ({
      ...item,
      amount: Number(item.amount ?? 0),
      percentage: Number(item.percentage ?? 0),
    })),
    trend: (d.trend ?? []).map((item) => ({
      ...item,
      income: Number(item.income ?? 0),
      expense: Number(item.expense ?? 0),
    })),
    recentTransactions: (d.recentTransactions ?? []).map((tx) => ({
      ...tx,
      amount: Number(tx.amount ?? 0),
    })),
    insights: d.insights ?? [],
  };
}
