import type {
  ApiSuccess,
  BudgetItem,
  BudgetsResponse,
  CreateBudgetInput,
  UpdateBudgetInput,
} from '@/types/api';
import { apiClient } from './client';

function normalizeBudgetItem(item: BudgetItem): BudgetItem {
  return {
    ...item,
    budgetAmount: Number(item.budgetAmount ?? 0),
    spentAmount: Number(item.spentAmount ?? 0),
    remaining: Number(item.remaining ?? 0),
    percentage: Number(item.percentage ?? 0),
  };
}

export async function getBudgets(month: number, year: number): Promise<BudgetsResponse> {
  const response = await apiClient.get<ApiSuccess<BudgetsResponse>>('/budgets', {
    params: { month, year },
  });
  const d = response.data.data;
  return {
    ...d,
    summary: {
      totalBudget: Number(d.summary?.totalBudget ?? 0),
      totalSpent: Number(d.summary?.totalSpent ?? 0),
      remaining: Number(d.summary?.remaining ?? 0),
      percentage: Number(d.summary?.percentage ?? 0),
    },
    items: (d.items ?? []).map(normalizeBudgetItem),
  };
}

export async function createBudget(input: CreateBudgetInput): Promise<BudgetItem> {
  const response = await apiClient.post<ApiSuccess<BudgetItem>>('/budgets', input);
  return normalizeBudgetItem(response.data.data);
}

export async function updateBudget(id: string, input: UpdateBudgetInput): Promise<BudgetItem> {
  const response = await apiClient.patch<ApiSuccess<BudgetItem>>(`/budgets/${id}`, input);
  return normalizeBudgetItem(response.data.data);
}

export async function deleteBudget(id: string): Promise<void> {
  await apiClient.delete(`/budgets/${id}`);
}
