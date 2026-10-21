import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  commitTransactionsImport,
  downloadImportTemplate,
  getImportSpec,
  previewTransactionsImport,
  type PickedExcelFile,
} from '@/api/imports';
import type { ImportCommitInput } from '@/types/api';

export const IMPORTS_QUERY_KEY = ['imports'] as const;

export function useImportSpec() {
  return useQuery({
    queryKey: [...IMPORTS_QUERY_KEY, 'spec'],
    queryFn: () => getImportSpec(),
  });
}

export function useDownloadImportTemplate() {
  return useMutation({
    mutationFn: () => downloadImportTemplate(),
  });
}

export function usePreviewTransactionsImport() {
  return useMutation({
    mutationFn: (file: PickedExcelFile) => previewTransactionsImport(file),
  });
}

export function useCommitTransactionsImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ImportCommitInput) => commitTransactionsImport(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['categories'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['budgets'] }),
        queryClient.invalidateQueries({ queryKey: ['reports'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
      ]);
    },
  });
}
