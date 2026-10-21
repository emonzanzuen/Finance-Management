import type {
  ApiSuccess,
  CreateSavingsDepositInput,
  CreateSavingsGoalInput,
  SavingsDepositResponse,
  SavingsGoal,
  SavingsGoalDetail,
  SavingsGoalsResponse,
  UpdateSavingsGoalInput,
} from '@/types/api';
import { apiClient } from './client';

function normalizeGoal(goal: SavingsGoal): SavingsGoal {
  return {
    ...goal,
    targetAmount: Number(goal.targetAmount ?? 0),
    currentAmount: Number(goal.currentAmount ?? 0),
    remaining: Number(goal.remaining ?? Math.max(0, Number(goal.targetAmount ?? 0) - Number(goal.currentAmount ?? 0))),
    percentage: Number(goal.percentage ?? 0),
  };
}

export async function getSavingsGoals(): Promise<SavingsGoalsResponse> {
  const response = await apiClient.get<ApiSuccess<SavingsGoalsResponse>>('/savings-goals');
  const d = response.data.data;
  return {
    items: (d.items ?? []).map(normalizeGoal),
    summary: {
      totalTarget: Number(d.summary?.totalTarget ?? 0),
      totalSaved: Number(d.summary?.totalSaved ?? 0),
      percentage: Number(d.summary?.percentage ?? 0),
    },
  };
}

export async function getSavingsGoalById(id: string): Promise<SavingsGoalDetail> {
  const response = await apiClient.get<ApiSuccess<SavingsGoalDetail>>(`/savings-goals/${id}`);
  const d = response.data.data;
  return {
    ...normalizeGoal(d),
    entries: (d.entries ?? []).map((e) => ({
      ...e,
      amount: Number(e.amount ?? 0),
    })),
  };
}

export async function createSavingsGoal(input: CreateSavingsGoalInput): Promise<SavingsGoal> {
  const response = await apiClient.post<ApiSuccess<SavingsGoal>>('/savings-goals', input);
  return normalizeGoal(response.data.data);
}

export async function updateSavingsGoal(
  id: string,
  input: UpdateSavingsGoalInput,
): Promise<SavingsGoal> {
  const response = await apiClient.patch<ApiSuccess<SavingsGoal>>(`/savings-goals/${id}`, input);
  return normalizeGoal(response.data.data);
}

export async function deleteSavingsGoal(id: string): Promise<void> {
  await apiClient.delete(`/savings-goals/${id}`);
}

export async function createSavingsDeposit(
  goalId: string,
  input: CreateSavingsDepositInput,
): Promise<SavingsDepositResponse> {
  const response = await apiClient.post<ApiSuccess<SavingsDepositResponse>>(
    `/savings-goals/${goalId}/deposits`,
    input,
  );
  const d = response.data.data;
  return {
    entry: {
      ...d.entry,
      amount: Number(d.entry?.amount ?? input.amount),
    },
    goal: normalizeGoal(d.goal),
  };
}

export async function deleteSavingsDeposit(goalId: string, entryId: string): Promise<void> {
  await apiClient.delete(`/savings-goals/${goalId}/deposits/${entryId}`);
}

