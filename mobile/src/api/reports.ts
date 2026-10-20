import type {
  ApiSuccess,
  MonthlyReportResponse,
  YearlyTrendResponse,
} from '@/types/api';
import { apiClient } from './client';

export async function getMonthlyReport(
  month: number,
  year: number,
): Promise<MonthlyReportResponse> {
  const response = await apiClient.get<ApiSuccess<MonthlyReportResponse>>('/reports/monthly', {
    params: { month, year },
  });
  const d = response.data.data;
  return {
    ...d,
    income: Number(d.income ?? 0),
    expense: Number(d.expense ?? 0),
    difference: Number(d.difference ?? 0),
    expenseByCategory: (d.expenseByCategory ?? []).map((item) => ({
      ...item,
      amount: Number(item.amount ?? 0),
      percentage: Number(item.percentage ?? 0),
    })),
    incomeByCategory: (d.incomeByCategory ?? []).map((item) => ({
      ...item,
      amount: Number(item.amount ?? 0),
      percentage: Number(item.percentage ?? 0),
    })),
  };
}

export async function getYearlyTrend(year: number): Promise<YearlyTrendResponse> {
  const response = await apiClient.get<ApiSuccess<YearlyTrendResponse>>('/reports/trend', {
    params: { year },
  });
  const d = response.data.data;
  return {
    ...d,
    months: (d.months ?? []).map((m) => ({
      ...m,
      income: Number(m.income ?? 0),
      expense: Number(m.expense ?? 0),
    })),
  };
}
