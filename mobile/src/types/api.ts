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
  readonly serverMessage?: string;

  constructor(params: {
    code: string;
    message: string;
    details?: unknown;
    status: number;
    serverMessage?: string;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.code = params.code;
    this.details = params.details;
    this.status = params.status;
    this.serverMessage = params.serverMessage;
  }
}

export const NETWORK_ERROR_CODE = 'NETWORK_ERROR';
export const REQUEST_TIMEOUT_CODE = 'REQUEST_TIMEOUT';

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

export type UpdateProfileInput = {
  name?: string;
  email?: string;
  currentPassword?: string;
  avatar?: string | null;
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

export type ChangePasswordResponse = {
  token: string;
};

export type ForgotPasswordInput = {
  email: string;
};

export type ResetPasswordInput = {
  email: string;
  otp: string;
  newPassword: string;
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

export type CurrencyRateItem = {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
  rate: number;
};

export type CurrenciesResponse = {
  base: string;
  updatedAt: string;
  source: 'live' | 'cache' | 'fallback';
  currencies: CurrencyRateItem[];
};

export type BudgetStatus = 'safe' | 'warning' | 'critical' | 'exceeded';

export type BudgetSummary = {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  percentage: number;
};

export type BudgetItem = {
  id: string;
  category: {
    id: string;
    name: string;
    color: string;
  };
  budgetAmount: number;
  spentAmount: number;
  remaining: number;
  percentage: number;
  status: BudgetStatus;
};

export type BudgetsResponse = {
  month: number;
  year: number;
  summary: BudgetSummary;
  items: BudgetItem[];
};

export type CreateBudgetInput = {
  categoryId: string;
  month: number;
  year: number;
  budgetAmount: number;
};

export type UpdateBudgetInput = {
  budgetAmount: number;
};

export type TopUpBudgetInput =
  | { amount: number; source: 'manual' }
  | { amount: number; source: 'savings'; goalId: string };

export type SavingsGoalStatus = 'in_progress' | 'almost_done' | 'completed';

export type SavingsGoal = {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  remaining: number;
  percentage: number;
  status: SavingsGoalStatus;
  deadline: string | null;
  completedAt: string | null;
};

export type SavingsSummary = {
  totalTarget: number;
  totalSaved: number;
  percentage: number;
};

export type SavingsGoalsResponse = {
  items: SavingsGoal[];
  summary: SavingsSummary;
};

export type SavingsEntry = {
  id: string;
  entryType: 'deposit' | 'withdrawal';
  amount: number;
  depositDate: string;
  note: string | null;
};

export type SavingsGoalDetail = SavingsGoal & {
  entries: SavingsEntry[];
};

export type CreateSavingsGoalInput = {
  title: string;
  targetAmount: number;
  deadline?: string | null;
};

export type UpdateSavingsGoalInput = {
  title?: string;
  targetAmount?: number;
  deadline?: string | null;
};

export type CreateSavingsDepositInput = {
  amount: number;
  depositDate: string;
  note?: string;
};

export type CreateSavingsWithdrawalInput = CreateSavingsDepositInput;

export type SavingsDepositResponse = {
  entry: SavingsEntry;
  goal: SavingsGoal;
};

export type DepositExceedsTargetDetails = {
  remaining?: number;
};

export type CategoryAggregateItem = {
  categoryId: string;
  name: string;
  color: string;
  amount: number;
  percentage: number;
};

export type DashboardTrendItem = {
  month: number;
  year: number;
  income: number;
  expense: number;
};

export type DashboardInsight = {
  type: 'expense_change' | 'top_category' | 'budgets_near_limit';
  direction?: 'up' | 'down';
  percent?: number;
  categoryName?: string;
  amount?: number;
  count?: number;
};

export type DashboardSummaryResponse = {
  period: {
    month: number;
    year: number;
  };
  balance: number;
  income: number;
  expense: number;
  totalSavings: number;
  expenseByCategory: CategoryAggregateItem[];
  trend: DashboardTrendItem[];
  recentTransactions: Transaction[];
  insights: DashboardInsight[];
};

export type MonthlyReportResponse = {
  period: {
    month: number;
    year: number;
  };
  income: number;
  expense: number;
  difference: number;
  expenseByCategory: CategoryAggregateItem[];
  incomeByCategory: CategoryAggregateItem[];
};

export type YearlyTrendMonthItem = {
  month: number;
  income: number;
  expense: number;
};

export type YearlyTrendResponse = {
  year: number;
  months: YearlyTrendMonthItem[];
};

export type ReportExportFormat = 'pdf' | 'xlsx';

export type NotificationType = 'budget_warning' | 'budget_exceeded' | 'goal_completed';

export type NotificationData = {
  budgetId?: string;
  categoryName?: string;
  percentage?: number;
  month?: number;
  year?: number;
  goalId?: string;
  title?: string;
};

export type NotificationItem = {
  id: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  data: NotificationData;
};

export type NotificationPaginationMeta = PaginationMeta & {
  unreadCount: number;
};

export type NotificationListParams = {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
};

export type ImportColumnSpec = {
  name: string;
  required: boolean;
  format?: string;
  allowed?: string[];
  maxLength?: number;
  emptyCellAllowed?: boolean;
};

export type ImportSpecResponse = {
  columns: ImportColumnSpec[];
  ignoredColumns: string[];
  limits: {
    maxFileBytes: number;
    maxRows: number;
  };
};

export type ImportHeaderMismatchDetails = {
  allowed?: string[];
  ignored?: string[];
  required?: string[];
  unknown?: string[];
  missing?: string[];
};

export type ImportPreviewRow = {
  row: number;
  status: 'valid' | 'invalid';
  type?: CategoryType;
  category?: string;
  amount?: number;
  transactionDate?: string;
  description?: string;
  duplicate?: boolean;
  errors?: string[];
};

export type ImportPreviewResponse = {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  unknownCategories: string[];
  rows: ImportPreviewRow[];
};

export type UnknownCategoryMode = 'create' | 'other';

export type ImportCommitRowInput = {
  type: CategoryType;
  category: string;
  amount: number;
  transactionDate: string;
  description?: string;
};

export type ImportCommitInput = {
  unknownCategoryMode: UnknownCategoryMode;
  skipDuplicates: boolean;
  rows: ImportCommitRowInput[];
};

export type ImportCommitResponse = {
  imported: number;
  skipped: number;
  createdCategories: string[];
};

export type ReceiptScanConfidence = 'high' | 'medium' | 'low';

export type ReceiptScanResponse = {
  type: CategoryType;
  amount: number | null;
  transactionDate: string | null;
  description: string | null;
  suggestedCategoryId: string | null;
  confidence: ReceiptScanConfidence;
  warnings: string[];
};

export type ReceiptConsentResponse = { receiptScanConsent: boolean };

// GET /health: the contract only lists the endpoint (public, server status); body is kept loose.
export type HealthResponse = {
  data?: { status?: string; [key: string]: unknown };
  [key: string]: unknown;
};
