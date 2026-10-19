import type {
  ApiSuccess,
  CreateTransactionInput,
  PaginationMeta,
  Transaction,
  TransactionListParams,
  UpdateTransactionInput,
} from '@/types/api';
import { apiClient } from './client';

function normalizeTransaction(tx: Transaction): Transaction {
  return {
    ...tx,
    amount: typeof tx.amount === 'string' ? Number(tx.amount) : tx.amount,
  };
}

export async function getTransactions(
  params?: TransactionListParams,
): Promise<ApiSuccess<Transaction[], PaginationMeta>> {
  const cleanParams: Record<string, string | number> = {};
  if (params?.page !== undefined) cleanParams.page = params.page;
  if (params?.limit !== undefined) cleanParams.limit = params.limit;
  if (params?.type) cleanParams.type = params.type;
  if (params?.categoryId) cleanParams.categoryId = params.categoryId;
  if (params?.search && params.search.trim().length > 0) {
    cleanParams.search = params.search.trim().slice(0, 50);
  }
  if (params?.dateFrom) cleanParams.dateFrom = params.dateFrom;
  if (params?.dateTo) cleanParams.dateTo = params.dateTo;
  if (params?.sortBy) cleanParams.sortBy = params.sortBy;
  if (params?.sortOrder) cleanParams.sortOrder = params.sortOrder;

  const response = await apiClient.get<ApiSuccess<Transaction[], PaginationMeta>>('/transactions', {
    params: cleanParams,
  });
  return {
    data: response.data.data.map(normalizeTransaction),
    meta: response.data.meta,
  };
}

export async function getTransactionById(id: string): Promise<Transaction> {
  const response = await apiClient.get<ApiSuccess<Transaction>>(`/transactions/${id}`);
  return normalizeTransaction(response.data.data);
}

export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  const response = await apiClient.post<ApiSuccess<Transaction>>('/transactions', input);
  return normalizeTransaction(response.data.data);
}

export async function updateTransaction(
  id: string,
  input: UpdateTransactionInput,
): Promise<Transaction> {
  const response = await apiClient.patch<ApiSuccess<Transaction>>(`/transactions/${id}`, input);
  return normalizeTransaction(response.data.data);
}

export async function deleteTransaction(id: string): Promise<void> {
  await apiClient.delete(`/transactions/${id}`);
}
