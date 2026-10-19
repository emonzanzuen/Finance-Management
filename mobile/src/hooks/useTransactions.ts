import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import {
  createTransaction,
  deleteTransaction,
  getTransactionById,
  getTransactions,
  updateTransaction,
} from '@/api/transactions';
import type {
  ApiError,
  ApiSuccess,
  CreateTransactionInput,
  PaginationMeta,
  Transaction,
  TransactionListParams,
  UpdateTransactionInput,
} from '@/types/api';

export const TRANSACTIONS_PAGE_SIZE = 20;

export type TransactionFilters = Omit<TransactionListParams, 'page' | 'limit'>;

async function invalidateTransactionDependents(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['transactions'] }),
    queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    queryClient.invalidateQueries({ queryKey: ['budgets'] }),
    queryClient.invalidateQueries({ queryKey: ['reports'] }),
    queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    queryClient.invalidateQueries({ queryKey: ['categories'] }),
  ]);
}

export function useTransactionsInfinite(filters: TransactionFilters = {}) {
  return useInfiniteQuery<
    ApiSuccess<Transaction[], PaginationMeta>,
    ApiError,
    InfiniteData<ApiSuccess<Transaction[], PaginationMeta>>,
    readonly ['transactions', 'list', TransactionFilters],
    number
  >({
    queryKey: ['transactions', 'list', filters] as const,
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      getTransactions({
        ...filters,
        page: pageParam,
        limit: TRANSACTIONS_PAGE_SIZE,
      }),
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined;
    },
  });
}

export function useTransactionDetail(id?: string) {
  return useQuery<Transaction, ApiError>({
    queryKey: ['transactions', 'detail', id] as const,
    queryFn: () => getTransactionById(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation<Transaction, ApiError, CreateTransactionInput>({
    mutationFn: (input) => createTransaction(input),
    onSuccess: async () => {
      await invalidateTransactionDependents(queryClient);
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation<Transaction, ApiError, { id: string; input: UpdateTransactionInput }>({
    mutationFn: ({ id, input }) => updateTransaction(id, input),
    onSuccess: async () => {
      await invalidateTransactionDependents(queryClient);
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (id) => deleteTransaction(id),
    onSuccess: async () => {
      await invalidateTransactionDependents(queryClient);
    },
  });
}
