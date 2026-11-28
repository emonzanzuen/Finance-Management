import React, { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  History,
  ArrowDownToLine,
  ArrowUpFromLine,
  Target,
  PiggyBank,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
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
  useSavingsGoal,
  useSavingsGoals,
  useSavingsMutation,
} from "../../hooks/queries";
import { savingsService } from "../../api/services/savings.js";
import { formatCurrencyWithRate } from "../../utils/formatters";
import { formatApiDate } from "../../lib/format";
import { todayWIB } from "../../lib/rules";
import { apiMessage } from "../../lib/apiMessage";
import { useTranslation } from "../../hooks/useTranslation";

const createCleanForm = () => ({
  title: "",
  targetAmount: "",
  deadline: "",
  amount: "",
  depositDate: todayWIB(),
  note: "",
});

const getGoalStatusMeta = (status, isEn) => {
  switch (status) {
    case "completed":
      return {
        label: isEn ? "Completed" : "Tercapai",
        badge: "success",
        bar: "success",
        icon: CheckCircle2,
      };
    case "almost_done":
      return {
        label: isEn ? "Almost done" : "Hampir tercapai",
        badge: "warning",
        bar: "warning",
        icon: Sparkles,
      };
    default:
      return {
        label: isEn ? "In progress" : "Berjalan",
        badge: "primary",
        bar: "primary",
        icon: Clock,
      };
  }
};

export default function SavingsGoals() {
  const { t, language } = useTranslation();
  const isEn = language === "en";
  const { currency, exchangeRates } = useApp();

  const [dialog, setDialog] = useState(null); // { mode: "create"|"edit"|"deposit"|"withdraw"|"history", id?, goal? }
  const [confirmState, setConfirmState] = useState(null); // { type: "goal"|"entry", item }
  const [form, setForm] = useState(createCleanForm);
  const [error, setError] = useState("");

  const goalsQuery = useSavingsGoals();
  const detailQuery = useSavingsGoal(
    dialog?.mode === "history" ? dialog.id : null
  );

  const create = useSavingsMutation(savingsService.create);
  const update = useSavingsMutation(savingsService.update);
  const remove = useSavingsMutation(savingsService.remove);
  const deposit = useSavingsMutation(savingsService.deposit);
  const withdraw = useSavingsMutation(savingsService.withdraw);
  const deleteDeposit = useSavingsMutation(savingsService.deleteDeposit);

  const busy = [create, update, remove, deposit, withdraw, deleteDeposit].some(
    (m) => m.isPending
  );

  const money = (v) =>
    formatCurrencyWithRate(Number(v || 0), currency, exchangeRates);

  const goals = goalsQuery.data?.items ?? [];
  const summary = goalsQuery.data?.summary;

  const openDialog = (mode, goal = null) => {
    setError("");
    setDialog({ mode, id: goal?.id, goal });
    setForm(
      goal
        ? {
            ...createCleanForm(),
            title: goal.title,
            targetAmount: String(goal.targetAmount),
            deadline: goal.deadline || "",
          }
        : createCleanForm()
    );
  };

  const closeDialog = () => {
    if (!busy) setDialog(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const mode = dialog.mode;

    if (["create", "edit"].includes(mode)) {
      if (!form.title.trim()) {
        setError(isEn ? "Goal title is required." : "Nama target wajib diisi.");
        return;
      }
      if (!Number.isFinite(Number(form.targetAmount)) || Number(form.targetAmount) < 1) {
        setError(
          isEn ? "Target amount must be greater than 0." : "Nominal target harus lebih dari 0."
        );
        return;
      }
    } else if (["deposit", "withdraw"].includes(mode)) {
      if (!Number.isFinite(Number(form.amount)) || Number(form.amount) < 1) {
        setError(
          isEn ? "Amount must be greater than 0." : "Nominal harus lebih dari 0."
        );
        return;
      }
      if (!form.depositDate) {
        setError(isEn ? "Date is required." : "Tanggal wajib diisi.");
        return;
      }
    }

    try {
      if (mode === "create") {
        await create.mutateAsync({
          title: form.title.trim(),
          targetAmount: Math.round(Number(form.targetAmount)),
          ...(form.deadline ? { deadline: form.deadline } : {}),
        });
      } else if (mode === "edit") {
        await update.mutateAsync({
          id: dialog.id,
          body: {
            title: form.title.trim(),
            targetAmount: Math.round(Number(form.targetAmount)),
            deadline: form.deadline || null,
          },
        });
      } else if (mode === "deposit" || mode === "withdraw") {
        await (mode === "deposit" ? deposit : withdraw).mutateAsync({
          id: dialog.id,
          body: {
            amount: Math.round(Number(form.amount)),
            depositDate: form.depositDate,
            ...(form.note.trim() ? { note: form.note.trim() } : {}),
          },
        });
      }

      toast.success(
        mode === "deposit"
          ? isEn
            ? "Deposit saved."
            : "Setoran tersimpan."
          : mode === "withdraw"
          ? isEn
            ? "Withdrawal saved."
            : "Penarikan tersimpan."
          : isEn
          ? "Savings goal saved."
          : "Target tabungan tersimpan."
      );
      setDialog(null);
    } catch (err) {
      setError(apiMessage(t, err));
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmState) return;
    try {
      if (confirmState.type === "goal") {
        await remove.mutateAsync(confirmState.item.id);
        toast.success(isEn ? "Goal deleted." : "Target dihapus.");
      } else if (confirmState.type === "entry" && dialog?.id) {
        await deleteDeposit.mutateAsync({
          id: dialog.id,
          entryId: confirmState.item.id,
        });
        await detailQuery.refetch();
        toast.success(isEn ? "Deposit entry deleted." : "Setoran dihapus.");
      }
    } catch (err) {
      toast.error(apiMessage(t, err));
    } finally {
      setConfirmState(null);
    }
  };

  const totalPct = Number(summary?.percentage || 0);

  const summaryCards = [
    {
      label: isEn ? "Total target" : "Total target",
      value: money(summary?.totalTarget),
      icon: Target,
      iconBg:
        "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400",
    },
    {
      label: isEn ? "Total saved" : "Total terkumpul",
      value: money(summary?.totalSaved),
      icon: PiggyBank,
      iconBg:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400",
    },
    {
      label: t("savings.progress"),
      value: `${totalPct.toFixed(0)}%`,
      icon: TrendingUp,
      iconBg:
        "bg-amber-50 text-amber-600 dark:bg-amber-950/70 dark:text-amber-400",
      isProgress: true,
    },
  ];

  const modalTitle =
    dialog?.mode === "history"
      ? `${isEn ? "History" : "Riwayat"} · ${dialog?.goal?.title || ""}`
      : dialog?.mode === "create"
      ? t("savings.add")
      : dialog?.mode === "edit"
      ? t("savings.edit")
      : dialog?.mode === "deposit"
      ? `${isEn ? "Deposit" : "Setor"} · ${dialog?.goal?.title || ""}`
      : `${isEn ? "Withdraw" : "Tarik"} · ${dialog?.goal?.title || ""}`;

  const activeAmountPreview = ["create", "edit"].includes(dialog?.mode)
    ? Number(form.targetAmount)
    : Number(form.amount);

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("savings.title")}
        subtitle={t("savings.subtitle")}
        icon={Target}
        className="mb-0"
        actions={
          <Button icon={Plus} onClick={() => openDialog("create")}>
            {t("savings.add")}
          </Button>
        }
      />

      {/* Error State */}
      {goalsQuery.isError && (
        <Card padding={false}>
          <ErrorState
            message={
              apiMessage(t, goalsQuery.error) ||
              (isEn ? "Failed to load savings goals." : "Gagal memuat target tabungan.")
            }
            onRetry={() => goalsQuery.refetch()}
            retryText={t("common.retry")}
          />
        </Card>
      )}

      {/* Loading State */}
      {goalsQuery.isLoading ? (
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
        !goalsQuery.isError && (
          <div className="space-y-5">
            {/* Ringkasan Tabungan */}
            <section
              aria-label={t("savings.title")}
              className="grid gap-4 sm:grid-cols-3"
            >
              {summaryCards.map(({ label, value, icon: Icon, iconBg, isProgress }) => (
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
                    className="tabular-nums-finance mt-2.5 text-lg font-bold leading-snug tracking-tight text-gray-900 dark:text-white sm:text-xl 2xl:text-2xl"
                    title={value}
                  >
                    {value}
                  </p>
                  {isProgress && (
                    <div className="mt-2.5">
                      <ProgressBar
                        value={Math.min(totalPct, 100)}
                        max={100}
                        showPercentage={false}
                        color="primary"
                        size="sm"
                        animated={false}
                      />
                    </div>
                  )}
                </Card>
              ))}
            </section>

            {/* Daftar Tujuan Tabungan */}
            {goals.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {goals.map((goal) => {
                  const pct = Number(goal.percentage || 0);
                  const statusMeta = getGoalStatusMeta(goal.status, isEn);
                  const StatusIcon = statusMeta.icon;
                  const isCompleted = goal.status === "completed";
                  const canWithdraw = Number(goal.currentAmount || 0) > 0;

                  return (
                    <Card key={goal.id} hover className="flex flex-col p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-base font-semibold text-gray-900 dark:text-white">
                              {goal.title}
                            </h3>
                            <Badge variant={statusMeta.badge} size="sm">
                              <StatusIcon className="h-3 w-3" aria-hidden="true" />
                              <span>{statusMeta.label}</span>
                            </Badge>
                          </div>

                          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                            <span className="tabular-nums-finance">
                              <strong className="font-semibold text-gray-800 dark:text-gray-100">
                                {money(goal.currentAmount)}
                              </strong>{" "}
                              / {money(goal.targetAmount)}
                            </span>
                            {goal.deadline && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="tabular-nums-finance inline-flex items-center gap-1">
                                  <Calendar className="h-3 w-3" aria-hidden="true" />
                                  {formatApiDate(goal.deadline, language)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openDialog("history", goal)}
                            aria-label={`${isEn ? "History" : "Riwayat"} ${goal.title}`}
                            title={isEn ? "History" : "Riwayat"}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200/80 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                          >
                            <History className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDialog("edit", goal)}
                            aria-label={`${t("common.edit")} ${goal.title}`}
                            title={t("common.edit")}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200/80 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmState({ type: "goal", item: goal })
                            }
                            aria-label={`${t("common.delete")} ${goal.title}`}
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

                      <div className="mt-2.5 flex items-center justify-between gap-2 text-xs">
                        <span className="tabular-nums-finance text-gray-600 dark:text-gray-300">
                          {isCompleted
                            ? isEn
                              ? "Target reached"
                              : "Target terpenuhi"
                            : `${isEn ? "Remaining" : "Sisa"}: ${money(
                                goal.remaining
                              )}`}
                        </span>
                        <span className="tabular-nums-finance font-semibold text-gray-700 dark:text-gray-200">
                          {pct.toFixed(0)}%
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2.5 border-t border-gray-100 pt-4 dark:border-gray-800/80">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          icon={ArrowDownToLine}
                          disabled={isCompleted}
                          onClick={() => openDialog("deposit", goal)}
                        >
                          {isEn ? "Deposit" : "Setor"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          icon={ArrowUpFromLine}
                          disabled={!canWithdraw}
                          onClick={() => openDialog("withdraw", goal)}
                        >
                          {isEn ? "Withdraw" : "Tarik"}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card padding={false}>
                <EmptyState
                  icon={Target}
                  title={t("savings.no_goals")}
                  description={t("savings.subtitle")}
                  actionText={t("savings.add_first")}
                  onAction={() => openDialog("create")}
                />
              </Card>
            )}
          </div>
        )
      )}

      {/* Modal Form & Riwayat */}
      <Modal
        isOpen={Boolean(dialog)}
        onClose={closeDialog}
        title={modalTitle}
        size="md"
        footer={
          dialog?.mode === "history" ? (
            <div className="flex justify-end">
              <Button type="button" variant="outline" onClick={closeDialog}>
                {t("common.close")}
              </Button>
            </div>
          ) : (
            <div className="flex justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                disabled={busy}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" form="savings-form" loading={busy}>
                {busy
                  ? isEn
                    ? "Saving..."
                    : "Menyimpan..."
                  : t("common.save")}
              </Button>
            </div>
          )
        }
      >
        {dialog?.mode === "history" ? (
          detailQuery.isLoading ? (
            <SkeletonLoader variant="table" />
          ) : detailQuery.isError ? (
            <ErrorState
              message={
                apiMessage(t, detailQuery.error) ||
                (isEn ? "Failed to load history." : "Gagal memuat riwayat.")
              }
              onRetry={() => detailQuery.refetch()}
              retryText={t("common.retry")}
            />
          ) : (detailQuery.data?.entries ?? []).length > 0 ? (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {detailQuery.data.entries.map((entry) => {
                const isDeposit = entry.entryType === "deposit";
                return (
                  <li
                    key={entry.id}
                    className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                          isDeposit
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                            : "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
                        }`}
                        aria-hidden="true"
                      >
                        {isDeposit ? (
                          <ArrowDownToLine className="h-4 w-4" />
                        ) : (
                          <ArrowUpFromLine className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {isDeposit
                              ? isEn
                                ? "Deposit"
                                : "Setoran"
                              : isEn
                              ? "Withdrawal"
                              : "Penarikan"}
                          </span>
                          <span
                            className={`tabular-nums-finance text-sm font-semibold ${
                              isDeposit
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {isDeposit ? "+" : "−"} {money(entry.amount)}
                          </span>
                        </div>
                        <p className="tabular-nums-finance mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          {formatApiDate(entry.depositDate, language)}
                          {entry.note ? ` · ${entry.note}` : ""}
                        </p>
                      </div>
                    </div>

                    {isDeposit && (
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmState({ type: "entry", item: entry })
                        }
                        aria-label={isEn ? "Delete deposit" : "Hapus setoran"}
                        title={isEn ? "Delete deposit" : "Hapus setoran"}
                        className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-rose-500 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/50"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              icon={History}
              title={isEn ? "No history yet" : "Belum ada riwayat"}
              description={
                isEn
                  ? "Deposits and withdrawals for this goal will appear here."
                  : "Riwayat setoran dan penarikan untuk target ini akan tampil di sini."
              }
              className="py-8"
            />
          )
        ) : (
          dialog && (
            <form
              id="savings-form"
              onSubmit={submit}
              className="space-y-4"
              noValidate
            >
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300"
                >
                  <AlertCircle
                    className="mt-0.5 h-4 w-4 flex-shrink-0"
                    aria-hidden="true"
                  />
                  <span>{error}</span>
                </div>
              )}

              {["create", "edit"].includes(dialog.mode) ? (
                <>
                  <div>
                    <label htmlFor="goal-title" className="label">
                      {isEn ? "Goal title" : "Nama target"}
                    </label>
                    <input
                      id="goal-title"
                      className="input-field"
                      required
                      maxLength={100}
                      value={form.title}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, title: e.target.value }))
                      }
                    />
                  </div>

                  <div>
                    <label htmlFor="goal-target" className="label">
                      {isEn ? "Target amount (IDR)" : "Nominal target (IDR)"}
                    </label>
                    <div className="relative">
                      <span
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400"
                        aria-hidden="true"
                      >
                        Rp
                      </span>
                      <input
                        id="goal-target"
                        className="input-field tabular-nums-finance pl-10 font-semibold"
                        required
                        type="number"
                        inputMode="numeric"
                        min="1"
                        step="1"
                        value={form.targetAmount}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            targetAmount: e.target.value,
                          }))
                        }
                      />
                    </div>
                    {currency !== "IDR" && activeAmountPreview > 0 && (
                      <p className="tabular-nums-finance mt-1 text-xs text-gray-500 dark:text-gray-400">
                        ≈ {money(activeAmountPreview)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="goal-deadline" className="label">
                      {t("savings.deadline")}{" "}
                      <span className="font-normal text-gray-400">
                        ({t("transactions.optional")})
                      </span>
                    </label>
                    <input
                      id="goal-deadline"
                      className="input-field tabular-nums-finance"
                      type="date"
                      value={form.deadline}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, deadline: e.target.value }))
                      }
                    />
                  </div>
                </>
              ) : (
                <>
                  {dialog.goal && (
                    <div className="flex items-center justify-between rounded-xl bg-gray-50/90 px-3.5 py-2.5 text-xs text-gray-600 dark:bg-gray-800/50 dark:text-gray-300">
                      <span>
                        {dialog.mode === "deposit"
                          ? isEn
                            ? "Remaining target"
                            : "Sisa target"
                          : isEn
                          ? "Available saved"
                          : "Saldo terkumpul"}
                      </span>
                      <strong className="tabular-nums-finance font-semibold text-gray-900 dark:text-white">
                        {dialog.mode === "deposit"
                          ? money(dialog.goal.remaining)
                          : money(dialog.goal.currentAmount)}
                      </strong>
                    </div>
                  )}

                  <div>
                    <label htmlFor="goal-entry-amount" className="label">
                      {t("common.amount")} (IDR)
                    </label>
                    <div className="relative">
                      <span
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400"
                        aria-hidden="true"
                      >
                        Rp
                      </span>
                      <input
                        id="goal-entry-amount"
                        className="input-field tabular-nums-finance pl-10 font-semibold"
                        required
                        type="number"
                        inputMode="numeric"
                        min="1"
                        step="1"
                        value={form.amount}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, amount: e.target.value }))
                        }
                      />
                    </div>
                    {currency !== "IDR" && activeAmountPreview > 0 && (
                      <p className="tabular-nums-finance mt-1 text-xs text-gray-500 dark:text-gray-400">
                        ≈ {money(activeAmountPreview)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="goal-entry-date" className="label">
                      {t("common.date")}
                    </label>
                    <input
                      id="goal-entry-date"
                      className="input-field tabular-nums-finance"
                      required
                      type="date"
                      value={form.depositDate}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          depositDate: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <label htmlFor="goal-entry-note" className="label">
                      {isEn ? "Note" : "Catatan"}{" "}
                      <span className="font-normal text-gray-400">
                        ({t("transactions.optional")})
                      </span>
                    </label>
                    <input
                      id="goal-entry-note"
                      className="input-field"
                      maxLength={255}
                      value={form.note}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, note: e.target.value }))
                      }
                    />
                  </div>
                </>
              )}
            </form>
          )
        )}
      </Modal>

      {/* Dialog Konfirmasi Hapus Target / Setoran */}
      <ConfirmDialog
        isOpen={Boolean(confirmState)}
        onClose={() => setConfirmState(null)}
        onConfirm={handleConfirmDelete}
        loading={remove.isPending || deleteDeposit.isPending}
        title={
          confirmState?.type === "goal"
            ? isEn
              ? "Delete savings goal"
              : "Hapus target tabungan"
            : isEn
            ? "Delete deposit entry"
            : "Hapus setoran"
        }
        message={
          confirmState?.type === "goal"
            ? isEn
              ? `Delete "${confirmState.item.title}" along with its entire history?`
              : `Hapus target "${confirmState.item.title}" beserta seluruh riwayatnya?`
            : isEn
            ? "Delete this deposit entry? This action cannot be undone."
            : "Hapus setoran ini? Tindakan ini tidak dapat dibatalkan."
        }
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
      />
    </div>
  );
}