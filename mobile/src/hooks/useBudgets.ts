import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createBudget, deleteBudget, getBudgets, topUpBudget, updateBudget } from '@/api/budgets';
import type { CreateBudgetInput, TopUpBudgetInput, UpdateBudgetInput } from '@/types/api';

export const BUDGETS_QUERY_KEY = ['budgets'] as const;

async function invalidateAfterBudgetMutation(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: BUDGETS_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    queryClient.invalidateQueries({ queryKey: ['categories'] }),
  ]);
}

export function useBudgets(month: number, year: number) {
  return useQuery({
    queryKey: [...BUDGETS_QUERY_KEY, month, year],
    queryFn: () => getBudgets(month, year),
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBudgetInput) => createBudget(input),
    onSuccess: async () => {
      await invalidateAfterBudgetMutation(queryClient);
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBudgetInput }) =>
      updateBudget(id, input),
    onSuccess: async () => {
      await invalidateAfterBudgetMutation(queryClient);
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBudget(id),
    onSuccess: async () => {
      await invalidateAfterBudgetMutation(queryClient);
    },
  });
}

export function useTopUpBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TopUpBudgetInput }) =>
      topUpBudget(id, input),
    onSuccess: async () => {
      await invalidateAfterBudgetMutation(queryClient);
    },
  });
}

