export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
};

export type ApiSuccess<T, M = undefined> = M extends undefined ? { data: T } : { data: T; meta: M };

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/** Normalized error thrown by the API client. */
export class ApiError extends Error {
  readonly code: string;
  readonly details: unknown;
  readonly status: number;

  constructor(params: { code: string; message: string; details?: unknown; status: number }) {
    super(params.message);
    this.name = 'ApiError';
    this.code = params.code;
    this.details = params.details;
    this.status = params.status;
  }
}

export const NETWORK_ERROR_CODE = 'NETWORK_ERROR';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
};

export type AuthSessionResponse = {
  token: string;
  user: AuthUser;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type ProfileStats = {
  transactionCount: number;
  savingsGoalCount: number;
  totalSavings: number;
};

export type UserProfile = AuthUser & {
  receiptScanConsent: boolean;
  stats: ProfileStats;
};

export type CategoryType = 'income' | 'expense';

export type Category = {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
  usageCount?: number;
  transactionCount?: number;
  budgetCount?: number;
  isUsed?: boolean;
};

export type CreateCategoryInput = {
  name: string;
  type: CategoryType;
  color: string;
};

export type UpdateCategoryInput = {
  name?: string;
  type?: CategoryType;
  color?: string;
};

export type CategoryInUseDetails = {
  usageCount?: number;
  count?: number;
  transactionCount?: number;
  transactions?: number;
  budgetCount?: number;
  budgets?: number;
};

export type TransactionSource = 'manual' | 'scan' | 'import';

export type TransactionCategory = {
  id: string;
  name: string;
  color: string;
};

export type Transaction = {
  id: string;
  type: CategoryType;
  amount: number;
  transactionDate: string;
  description: string | null;
  source?: TransactionSource;
  category: TransactionCategory;
  createdAt?: string;
};

export type TransactionSortBy = 'transactionDate' | 'amount';
export type SortOrder = 'asc' | 'desc';

export type TransactionListParams = {
  page?: number;
  limit?: number;
  type?: CategoryType;
  categoryId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: TransactionSortBy;
  sortOrder?: SortOrder;
};

export type CreateTransactionInput = {
  type: CategoryType;
  categoryId: string;
  amount: number;
  transactionDate: string;
  description?: string;
};

export type UpdateTransactionInput = {
  type?: CategoryType;
  categoryId?: string;
  amount?: number;
  transactionDate?: string;
  description?: string;
};

// GET /health: the contract only lists the endpoint (public, server status); body is kept loose.
export type HealthResponse = {
  data?: { status?: string; [key: string]: unknown };
  [key: string]: unknown;
};
