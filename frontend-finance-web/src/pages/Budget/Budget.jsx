import React, { useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ArrowUpCircle,
  ChevronLeft,
  ChevronRight,
  Wallet,
  TrendingDown,
  PiggyBank,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  OctagonAlert,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../../components/common/PageHeader";
import ErrorState from "../../components/common/ErrorState";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import EmptyState from "../../components/ui/EmptyState";
import SkeletonLoader from "../../components/ui/SkeletonLoader";
import ProgressBar from "../../components/ui/ProgessBar";
import { useApp } from "../../context/AppContext";
import {
  useBudgets,
  useCategories,
  useCreateBudget,
  useDeleteBudget,
  useTopUpBudget,
  useUpdateBudget,
  useSavingsGoals,
} from "../../hooks/queries";
import { formatCurrencyWithRate } from "../../utils/formatters";
import { apiMessage } from "../../lib/apiMessage";
import { useTranslation } from "../../hooks/useTranslation";

const EMPTY_FORM = {
  categoryId: "",
  budgetAmount: "",
  amount: "",
  source: "manual",
  goalId: "",
};

const getStatusMeta = (status, isEn) => {
  switch (status) {
    case "exceeded":
      return {
        label: isEn ? "Exceeded" : "Terlampaui",
        badge: "danger",
        bar: "danger",
        icon: OctagonAlert,
      };
    case "critical":
      return {
        label: isEn ? "Critical" : "Kritis",
        badge: "danger",
        bar: "danger",
        icon: AlertCircle,
      };
    case "warning":
      return {
        label: isEn ? "Warning" : "Waspada",
        badge: "warning",
        bar: "warning",
        icon: AlertTriangle,
      };
    default:
      return {
        label: isEn ? "Safe" : "Aman",
        badge: "success",
        bar: "success",
        icon: CheckCircle2,
      };
  }
};

export default function Budget() {
  const { t, language } = useTranslation();
  const isEn = language === "en";
  const locale = isEn ? "en-US" : "id-ID";
  const { currency, exchangeRates } = useApp();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [dialog, setDialog] = useState(null); // { mode: "create"|"edit"|"topup", item? }
  const [toDelete, setToDelete] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  const { data, isLoading, isError, error: queryError, refetch, isFetching } =
    useBudgets(month, year);
  const { data: categories = [] } = useCategories("expense");
  const { data: savings } = useSavingsGoals();

  const create = useCreateBudget();
  const update = useUpdateBudget();
  const remove = useDeleteBudget();
  const topUp = useTopUpBudget();

  const busy =
    create.isPending || update.isPending || remove.isPending || topUp.isPending;

  const money = (v) =>
    formatCurrencyWithRate(Number(v || 0), currency, exchangeRates);

  const items = data?.items ?? [];
  const summary = data?.summary;
  const savingsItems = savings?.items ?? [];

  const categoryIds = useMemo(
    () => new Set(items.map((x) => x.category?.id)),
    [items]
  );
  const categoriesAvailable = categories.filter((c) => !categoryIds.has(c.id));

  const periodLabel = new Date(year, month - 1, 1).toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });

  const openDialog = (mode, item = null) => {
    setError("");
    setDialog({ mode, item });
    setForm(
      item
        ? {
            ...EMPTY_FORM,
            categoryId: item.category?.id ?? "",
            budgetAmount: String(item.budgetAmount ?? ""),
          }
        : EMPTY_FORM
    );
  };

  const closeDialog = () => {
    if (!busy) setDialog(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    const numericValue = Number(
      dialog.mode === "topup" ? form.amount : form.budgetAmount
    );

    if (dialog.mode === "create" && !form.categoryId) {
      setError(isEn ? "Please select a category." : "Pilih kategori terlebih dahulu.");
      return;
    }
    if (dialog.mode === "topup" && form.source === "savings" && !form.goalId) {
      setError(
        isEn ? "Please select a savings goal." : "Pilih target tabungan terlebih dahulu."
      );
      return;
    }
    if (!Number.isFinite(numericValue) || numericValue < 1) {
      setError(
        isEn ? "Amount must be greater than 0." : "Nominal harus lebih dari 0."
      );
      return;
    }

    try {
      if (dialog.mode === "topup") {
        await topUp.mutateAsync({
          id: dialog.item.id,
          body: {
            amount: Math.round(numericValue),
            source: form.source,
            ...(form.source === "savings" ? { goalId: form.goalId } : {}),
          },
        });
        toast.success(
          isEn ? "Budget allocation added." : "Anggaran berhasil ditambah."
        );
      } else if (dialog.mode === "edit") {
        await update.mutateAsync({
          id: dialog.item.id,
          body: { budgetAmount: Math.round(numericValue) },
        });
        toast.success(
          isEn ? "Budget updated." : "Anggaran berhasil diperbarui."
        );
      } else {
        await create.mutateAsync({
          categoryId: form.categoryId,
          month,
          year,
          budgetAmount: Math.round(numericValue),
        });
        toast.success(
          isEn ? "Budget added." : "Anggaran berhasil ditambahkan."
        );
      }
      setDialog(null);
    } catch (err) {
      setError(apiMessage(t, err));
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await remove.mutateAsync(toDelete.id);
      toast.success(isEn ? "Budget deleted." : "Anggaran dihapus.");
    } catch (err) {
      toast.error(apiMessage(t, err));
    } finally {
      setToDelete(null);
    }
  };

  const changePeriod = (delta) => {
    const date = new Date(year, month - 1 + delta, 1);
    setMonth(date.getMonth() + 1);
    setYear(date.getFullYear());
  };

  const summaryRemaining = Number(summary?.remaining ?? 0);
  const summaryPct = Number(summary?.percentage ?? 0);
  const isOverallOver = summaryRemaining < 0;

  const summaryCards = [
    {
      label: t("budget.total_budget"),
      value: money(summary?.totalBudget),
      icon: Wallet,
      iconBg:
        "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400",
      valueClass: "text-gray-900 dark:text-white",
    },
    {
      label: t("budget.total_spent"),
      value: money(summary?.totalSpent),
      icon: TrendingDown,
      iconBg:
        "bg-amber-50 text-amber-600 dark:bg-amber-950/70 dark:text-amber-400",
      valueClass: "text-gray-900 dark:text-white",
      subtext: `${summaryPct.toFixed(0)}% ${t("budget.usage").toLowerCase()}`,
    },
    {
      label: t("budget.remaining"),
      value: money(summaryRemaining),
      icon: PiggyBank,
      iconBg: isOverallOver
        ? "bg-rose-50 text-rose-600 dark:bg-rose-950/70 dark:text-rose-400"
        : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400",
      valueClass: isOverallOver
        ? "text-rose-600 dark:text-rose-400"
        : "text-emerald-600 dark:text-emerald-400",
      subtext: isOverallOver
        ? isEn
          ? "Over total budget"
          : "Melebihi total anggaran"
        : undefined,
    },
  ];

  const modalTitle =
    dialog?.mode === "create"
      ? isEn
        ? "Add budget"
        : "Tambah anggaran"
      : dialog?.mode === "edit"
      ? `${t("budget.edit")} · ${dialog?.item?.category?.name || ""}`
      : `${isEn ? "Top up budget" : "Tambah alokasi"} · ${
          dialog?.item?.category?.name || ""
        }`;

  const activeAmountValue =
    dialog?.mode === "topup" ? Number(form.amount) : Number(form.budgetAmount);

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("budget.title")}
        subtitle={
          isEn
            ? "Track monthly spending limits and remaining budget per category."
            : "Pantau batas pengeluaran bulanan dan sisa anggaran per kategori."
        }
        icon={Wallet}
        className="mb-0"
        actions={
          <Button
            icon={Plus}
            onClick={() => openDialog("create")}
            disabled={!categoriesAvailable.length}
            title={
              !categoriesAvailable.length
                ? isEn
                  ? "All expense categories already have a budget for this period"
                  : "Semua kategori pengeluaran sudah memiliki anggaran pada periode ini"
                : undefined
            }
          >
            {isEn ? "Add budget" : "Tambah anggaran"}
          </Button>
        }
      />

      {/* Pemilih Periode */}
      <Card className="p-3.5 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => changePeriod(-1)}
              aria-label={isEn ? "Previous month" : "Bulan sebelumnya"}
              className="px-2.5"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>

            <div className="flex min-w-[168px] items-center justify-center gap-2 px-2 text-sm font-semibold text-gray-900 dark:text-white">
              <Calendar className="h-4 w-4 text-primary-500" aria-hidden="true" />
              <span className="capitalize">{periodLabel}</span>
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => changePeriod(1)}
              aria-label={isEn ? "Next month" : "Bulan berikutnya"}
              className="px-2.5"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          {!isLoading && !isError && items.length > 0 && (
            <span className="tabular-nums-finance text-xs font-medium text-gray-500 dark:text-gray-400">
              {items.length} {t("dashboard.categories")}
            </span>
          )}
        </div>
      </Card>

      {/* Error State */}
      {isError && (
        <Card padding={false}>
          <ErrorState
            message={
              apiMessage(t, queryError) ||
              (isEn ? "Failed to load budgets." : "Gagal memuat anggaran.")
            }
            onRetry={() => refetch()}
            retryText={t("common.retry")}
          />
        </Card>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonLoader key={i} variant="card" />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <SkeletonLoader variant="card" count={2} />
            <SkeletonLoader variant="card" count={2} />
          </div>
        </div>
      ) : (
        !isError && (
          <div
            className={`space-y-5 transition-opacity duration-200 ${
              isFetching ? "opacity-75" : ""
            }`}
          >
            {/* Ringkasan Anggaran */}
            <section
              aria-label={t("budget.usage")}
              className="grid gap-4 sm:grid-cols-3"
            >
              {summaryCards.map(
                ({ label, value, icon: Icon, iconBg, valueClass, subtext }) => (
                  <Card key={label} className="p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {label}
                      </p>
                      <div
                        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${iconBg}`}
                        aria-hidden="true"
                      >
                        <Icon className="h-[18px] w-[18px]" />
                      </div>
                    </div>
                    <p
                      className={`tabular-nums-finance mt-2.5 text-lg font-bold leading-snug tracking-tight sm:text-xl 2xl:text-2xl ${valueClass}`}
                      title={value}
                    >
                      {value}
                    </p>
                    {subtext && (
                      <p className="tabular-nums-finance mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {subtext}
                      </p>
                    )}
                  </Card>
                )
              )}
            </section>

            {/* Daftar Kartu Anggaran per Kategori */}
            {items.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {items.map((item) => {
                  const pct = Number(item.percentage || 0);
                  const remaining = Number(item.remaining || 0);
                  const isOver = remaining < 0 || item.status === "exceeded";
                  const statusMeta = getStatusMeta(item.status, isEn);
                  const StatusIcon = statusMeta.icon;

                  return (
                    <Card
                      key={item.id}
                      hover
                      className={`p-5 ${
                        isOver
                          ? "border-rose-200/90 dark:border-rose-900/70"
                          : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className="h-3 w-3 flex-shrink-0 rounded-full"
                              style={{
                                backgroundColor:
                                  item.category?.color || "#6366f1",
                              }}
                              aria-hidden="true"
                            />
                            <h3 className="truncate text-base font-semibold text-gray-900 dark:text-white">
                              {item.category?.name || "—"}
                            </h3>
                            <Badge variant={statusMeta.badge} size="sm">
                              <StatusIcon className="h-3 w-3" aria-hidden="true" />
                              <span>{statusMeta.label}</span>
                            </Badge>
                          </div>

                          <p className="tabular-nums-finance mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                            {isEn ? "Spent" : "Terpakai"}{" "}
                            <strong className="font-semibold text-gray-800 dark:text-gray-100">
                              {money(item.spentAmount)}
                            </strong>{" "}
                            {isEn ? "of" : "dari"} {money(item.budgetAmount)}
                          </p>
                        </div>

                        <div className="flex flex-shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openDialog("topup", item)}
                            aria-label={`${
                              isEn ? "Top up" : "Tambah alokasi"
                            } ${item.category?.name || ""}`}
                            title={isEn ? "Top up budget" : "Tambah alokasi anggaran"}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200/80 text-primary-600 transition-colors hover:bg-primary-50 dark:border-gray-800 dark:text-primary-400 dark:hover:bg-primary-950/50"
                          >
                            <ArrowUpCircle className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDialog("edit", item)}
                            aria-label={`${t("common.edit")} ${
                              item.category?.name || ""
                            }`}
                            title={t("common.edit")}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200/80 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setToDelete(item)}
                            aria-label={`${t("common.delete")} ${
                              item.category?.name || ""
                            }`}
                            title={t("common.delete")}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200/80 text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:border-gray-800 dark:hover:bg-rose-950/50"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4">
                        <ProgressBar
                          value={Math.min(pct, 100)}
                          max={100}
                          showPercentage={false}
                          color={statusMeta.bar}
                          size="md"
                          animated={false}
                        />
                      </div>

                      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span
                          className={`tabular-nums-finance font-medium ${
                            isOver
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-gray-600 dark:text-gray-300"
                          }`}
                        >
                          {isOver
                            ? `${isEn ? "Exceeded by" : "Melebihi batas"} ${money(
                                Math.abs(remaining)
                              )}`
                            : `${t("budget.remaining")}: ${money(remaining)}`}
                        </span>
                        <span className="tabular-nums-finance font-semibold text-gray-700 dark:text-gray-200">
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card padding={false}>
                <EmptyState
                  icon={Wallet}
                  title={
                    isEn
                      ? "No budgets for this period"
                      : "Belum ada anggaran untuk periode ini"
                  }
                  description={
                    categoriesAvailable.length > 0
                      ? isEn
                        ? "Set a monthly spending limit for your expense categories."
                        : "Tetapkan batas pengeluaran bulanan untuk kategori pengeluaran Anda."
                      : isEn
                      ? "Create an expense category first before adding a budget."
                      : "Buat kategori pengeluaran terlebih dahulu sebelum menambahkan anggaran."
                  }
                  actionText={
                    categoriesAvailable.length > 0
                      ? isEn
                        ? "Add budget"
                        : "Tambah anggaran"
                      : null
                  }
                  onAction={
                    categoriesAvailable.length > 0
                      ? () => openDialog("create")
                      : null
                  }
                />
              </Card>
            )}
          </div>
        )
      )}

      {/* Modal Tambah / Edit / Top-up Anggaran */}
      <Modal
        isOpen={Boolean(dialog)}
        onClose={closeDialog}
        title={modalTitle}
        size="sm"
        footer={
          <div className="flex justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={closeDialog}
              disabled={busy}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" form="budget-form" loading={busy}>
              {busy
                ? isEn
                  ? "Saving..."
                  : "Menyimpan..."
                : t("common.save")}
            </Button>
          </div>
        }
      >
        {dialog && (
          <form id="budget-form" onSubmit={submit} className="space-y-4" noValidate>
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            {dialog.mode === "create" && (
              <div>
                <label htmlFor="budget-category" className="label">
                  {t("transactions.category")}
                </label>
                <select
                  id="budget-category"
                  required
                  className="input-field"
                  value={form.categoryId}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, categoryId: e.target.value }))
                  }
                >
                  <option value="">{t("transactions.select_category")}</option>
                  {categoriesAvailable.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {dialog.mode === "topup" && (
              <>
                <div>
                  <label htmlFor="budget-topup-source" className="label">
                    {isEn ? "Source" : "Sumber dana"}
                  </label>
                  <select
                    id="budget-topup-source"
                    className="input-field"
                    value={form.source}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        source: e.target.value,
                        goalId: "",
                      }))
                    }
                  >
                    <option value="manual">
                      {isEn ? "Manual top-up" : "Tambah manual"}
                    </option>
                    <option value="savings">
                      {isEn ? "From savings goal" : "Dari target tabungan"}
                    </option>
                  </select>
                </div>

                {form.source === "savings" && (
                  <div>
                    <label htmlFor="budget-topup-goal" className="label">
                      {t("savings.title")}
                    </label>
                    <select
                      id="budget-topup-goal"
                      required
                      className="input-field"
                      value={form.goalId}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, goalId: e.target.value }))
                      }
                    >
                      <option value="">
                        {isEn ? "Select a savings goal" : "Pilih target tabungan"}
                      </option>
                      {savingsItems.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.title} ({money(g.currentAmount)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            <div>
              <label htmlFor="budget-amount" className="label">
                {dialog.mode === "topup"
                  ? isEn
                    ? "Top-up amount (IDR)"
                    : "Nominal tambahan (IDR)"
                  : `${t("common.amount")} (IDR)`}
              </label>
              <div className="relative">
                <span
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400"
                  aria-hidden="true"
                >
                  Rp
                </span>
                <input
                  id="budget-amount"
                  required
                  min="1"
                  step="1"
                  type="number"
                  inputMode="numeric"
                  className="input-field tabular-nums-finance pl-10 font-semibold"
                  value={
                    dialog.mode === "topup" ? form.amount : form.budgetAmount
                  }
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      [dialog.mode === "topup" ? "amount" : "budgetAmount"]:
                        e.target.value,
                    }))
                  }
                />
              </div>
              {currency !== "IDR" && activeAmountValue > 0 && (
                <p className="tabular-nums-finance mt-1 text-xs text-gray-500 dark:text-gray-400">
                  ≈ {money(activeAmountValue)}
                </p>
              )}
            </div>
          </form>
        )}
      </Modal>

      {/* Dialog Konfirmasi Hapus */}
      <ConfirmDialog
        isOpen={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={remove.isPending}
        title={isEn ? "Delete budget" : "Hapus anggaran"}
        message={
          isEn
            ? `Delete the budget for "${toDelete?.category?.name || ""}" in ${periodLabel}?`
            : `Hapus anggaran kategori "${toDelete?.category?.name || ""}" pada ${periodLabel}?`
        }
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
      />
    </div>
  );
}