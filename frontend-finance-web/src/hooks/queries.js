import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categoryService } from "../api/services/categories.js";
import { transactionService } from "../api/services/transactions.js";
import { dashboardService } from "../api/services/dashboard.js";
import { budgetService } from "../api/services/budgets.js";
import { savingsService } from "../api/services/savings.js";
import { reportService } from "../api/services/reports.js";
import { currencyService } from "../api/services/currencies.js";
import { notificationService } from "../api/services/notifications.js";
import { importService } from "../api/services/imports.js";
import { receiptService } from "../api/services/receipts.js";

/** Cache yang harus dimuat ulang setelah mutasi (docs/screens.md bagian 5). */
const AFTER_TRANSACTION = ["transactions", "dashboard", "budgets", "reports", "notifications", "profile"];
const AFTER_CATEGORY = ["categories", "transactions", "budgets", "dashboard", "reports"];
const AFTER_BUDGET = ["budgets", "dashboard", "notifications", "savings"];
const AFTER_SAVINGS = ["savings", "dashboard", "notifications", "budgets"];

function useInvalidator(roots) {
  const qc = useQueryClient();
  return () => Promise.all(roots.map((r) => qc.invalidateQueries({ queryKey: [r] })));
}

// ---------- Kategori ----------
export const useCategories = (type) =>
  useQuery({ queryKey: ["categories", type ?? "all"], queryFn: () => categoryService.list(type), staleTime: 60_000 });

export function useCreateCategory() {
  const invalidate = useInvalidator(AFTER_CATEGORY);
  return useMutation({ mutationFn: categoryService.create, onSuccess: invalidate });
}
export function useUpdateCategory() {
  const invalidate = useInvalidator(AFTER_CATEGORY);
  return useMutation({ mutationFn: ({ id, body }) => categoryService.update(id, body), onSuccess: invalidate });
}
export function useDeleteCategory() {
  const invalidate = useInvalidator(AFTER_CATEGORY);
  return useMutation({ mutationFn: categoryService.remove, onSuccess: invalidate });
}

// ---------- Transaksi ----------
export const useTransactions = (params) =>
  useQuery({
    queryKey: ["transactions", "list", params],
    queryFn: () => transactionService.list(params),
    placeholderData: keepPreviousData,
  });
export const useTransaction = (id) => useQuery({
  queryKey: ["transactions", "detail", id], queryFn: () => transactionService.get(id), enabled: Boolean(id),
});

export function useCreateTransaction() {
  const invalidate = useInvalidator(AFTER_TRANSACTION);
  return useMutation({ mutationFn: transactionService.create, onSuccess: invalidate });
}
export function useUpdateTransaction() {
  const invalidate = useInvalidator(AFTER_TRANSACTION);
  return useMutation({ mutationFn: ({ id, body }) => transactionService.update(id, body), onSuccess: invalidate });
}
export function useDeleteTransaction() {
  const invalidate = useInvalidator(AFTER_TRANSACTION);
  return useMutation({ mutationFn: transactionService.remove, onSuccess: invalidate });
}

// ---------- Ringkasan, budget, tabungan, laporan ----------
export const useDashboard = (month, year) => useQuery({
  queryKey: ["dashboard", month, year], queryFn: () => dashboardService.summary(month, year),
});
export const useBudgets = (month, year) => useQuery({
  queryKey: ["budgets", month, year], queryFn: () => budgetService.list(month, year),
});
export function useCreateBudget() {
  const invalidate = useInvalidator(AFTER_BUDGET);
  return useMutation({ mutationFn: budgetService.create, onSuccess: invalidate });
}
export function useUpdateBudget() {
  const invalidate = useInvalidator(AFTER_BUDGET);
  return useMutation({ mutationFn: budgetService.update, onSuccess: invalidate });
}
export function useDeleteBudget() {
  const invalidate = useInvalidator(AFTER_BUDGET);
  return useMutation({ mutationFn: budgetService.remove, onSuccess: invalidate });
}
export function useTopUpBudget() {
  const invalidate = useInvalidator(AFTER_BUDGET);
  return useMutation({ mutationFn: budgetService.topUp, onSuccess: invalidate });
}
export const useSavingsGoals = () => useQuery({
  queryKey: ["savings"], queryFn: savingsService.list,
});
export const useSavingsGoal = (id) => useQuery({
  queryKey: ["savings", id], queryFn: () => savingsService.get(id), enabled: Boolean(id),
});
export function useSavingsMutation(mutationFn) {
  const invalidate = useInvalidator(AFTER_SAVINGS);
  return useMutation({ mutationFn, onSuccess: invalidate });
}
export const useMonthlyReport = (month, year) => useQuery({
  queryKey: ["reports", "monthly", month, year], queryFn: () => reportService.monthly(month, year),
});
export const useYearlyTrend = (year) => useQuery({
  queryKey: ["reports", "trend", year], queryFn: () => reportService.trend(year),
});

// ---------- Preferensi dan layanan tambahan backend ----------
export const useCurrencies = (enabled = true) => useQuery({ queryKey: ["currencies"], queryFn: currencyService.list, staleTime: 60 * 60_000, enabled });
export const useNotifications = (params) => useQuery({
  queryKey: ["notifications", params], queryFn: () => notificationService.list(params),
});
export function useNotificationMutation(mutationFn) {
  const invalidate = useInvalidator(["notifications"]);
  return useMutation({ mutationFn, onSuccess: invalidate });
}
export const useImportSpec = () => useQuery({ queryKey: ["imports", "spec"], queryFn: importService.spec });
export const useImportPreview = () => useMutation({ mutationFn: importService.preview });
export function useImportMutation(mutationFn) {
  const invalidate = useInvalidator(["transactions", "dashboard", "budgets", "reports", "notifications"]);
  return useMutation({ mutationFn, onSuccess: invalidate });
}
export function useReceiptMutation(mutationFn) {
  const invalidate = useInvalidator(["profile"]);
  return useMutation({ mutationFn, onSuccess: invalidate });
}
