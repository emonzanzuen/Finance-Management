import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deleteReceiptConsent,
  postReceiptConsent,
  scanReceipt,
} from '@/api/receipts';

export const RECEIPTS_QUERY_KEY = ['receipts'] as const;

async function invalidateAfterReceiptMutation(
  queryClient: ReturnType<typeof useQueryClient>
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['profile'] }),
    queryClient.invalidateQueries({ queryKey: RECEIPTS_QUERY_KEY }),
  ]);
}

export function usePostReceiptConsent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => postReceiptConsent(),
    onSuccess: async () => {
      await invalidateAfterReceiptMutation(queryClient);
    },
  });
}

export function useDeleteReceiptConsent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteReceiptConsent(),
    onSuccess: async () => {
      await invalidateAfterReceiptMutation(queryClient);
    },
  });
}

export function useScanReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (imageUri: string) => scanReceipt(imageUri),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}