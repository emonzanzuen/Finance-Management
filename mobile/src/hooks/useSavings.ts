import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createSavingsDeposit,
  createSavingsGoal,
  deleteSavingsDeposit,
  deleteSavingsGoal,
  getSavingsGoalById,
  getSavingsGoals,
  updateSavingsGoal,
} from '@/api/savings';
import type {
  CreateSavingsDepositInput,
  CreateSavingsGoalInput,
  UpdateSavingsGoalInput,
} from '@/types/api';

export const SAVINGS_QUERY_KEY = ['savings'] as const;

async function invalidateAfterSavingsMutation(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: SAVINGS_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    queryClient.invalidateQueries({ queryKey: ['profile'] }),
  ]);
}

export function useSavingsGoals() {
  return useQuery({
    queryKey: SAVINGS_QUERY_KEY,
    queryFn: () => getSavingsGoals(),
  });
}

export function useSavingsGoalDetail(id: string | undefined) {
  return useQuery({
    queryKey: [...SAVINGS_QUERY_KEY, 'detail', id],
    queryFn: () => getSavingsGoalById(id!),
    enabled: Boolean(id),
  });
}

export function useCreateSavingsGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSavingsGoalInput) => createSavingsGoal(input),
    onSuccess: async () => {
      await invalidateAfterSavingsMutation(queryClient);
    },
  });
}

export function useUpdateSavingsGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSavingsGoalInput }) =>
      updateSavingsGoal(id, input),
    onSuccess: async () => {
      await invalidateAfterSavingsMutation(queryClient);
    },
  });
}

export function useDeleteSavingsGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSavingsGoal(id),
    onSuccess: async () => {
      await invalidateAfterSavingsMutation(queryClient);
    },
  });
}

export function useCreateSavingsDeposit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, input }: { goalId: string; input: CreateSavingsDepositInput }) =>
      createSavingsDeposit(goalId, input),
    onSuccess: async () => {
      await invalidateAfterSavingsMutation(queryClient);
    },
  });
}

export function useDeleteSavingsDeposit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, entryId }: { goalId: string; entryId: string }) =>
      deleteSavingsDeposit(goalId, entryId),
    onSuccess: async () => {
      await invalidateAfterSavingsMutation(queryClient);
    },
  });
}

