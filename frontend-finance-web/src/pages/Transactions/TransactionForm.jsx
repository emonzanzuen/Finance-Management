import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowDownRight, ArrowUpRight } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import { useApp } from "../../context/AppContext";
import { useTranslation } from "../../hooks/useTranslation";
import {
  useCategories,
  useCreateTransaction,
  useUpdateTransaction,
} from "../../hooks/queries";
import { transactionSchema } from "../../lib/schemas";
import { formatAmountInput, parseAmountInput, todayWIB } from "../../lib/rules";
import { formatApiDate } from "../../lib/format";
import { formatCurrency, formatCurrencyWithRate } from "../../utils/formatters";
import { fieldErrors } from "../../api/errors";
import { apiMessage } from "../../lib/apiMessage";

const FIELD_NAMES = [
  "type",
  "categoryId",
  "amount",
  "transactionDate",
  "description",
];

const TransactionForm = ({ transaction, onClose }) => {
  const { t, language } = useTranslation();
  const { currency, exchangeRates } = useApp();
  const create = useCreateTransaction();
  const update = useUpdateTransaction();
  const [formError, setFormError] = useState("");
  const editing = Boolean(transaction);
  const busy = create.isPending || update.isPending;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: transaction?.type ?? "expense",
      categoryId: transaction?.category?.id ?? "",
      amount: transaction ? formatAmountInput(transaction.amount) : "",
      transactionDate: transaction?.transactionDate ?? todayWIB(),
      description: transaction?.description ?? "",
    },
  });

  const type = watch("type");
  const categoryId = watch("categoryId");
  const amount = watch("amount");
  const date = watch("transactionDate");
  const description = watch("description") ?? "";
  const { data: categories = [], isLoading: loadingCats } = useCategories(type);

  // Kategori harus bertipe sama; reset pilihan bila tidak lagi cocok.
  useEffect(() => {
    if (
      categoryId &&
      categories.length &&
      !categories.some((c) => c.id === categoryId)
    ) {
      setValue("categoryId", "");
    }
  }, [type, categories]); // eslint-disable-line react-hooks/exhaustive-deps

  const numeric = parseAmountInput(amount);
  const selectedCategory = categories.find((c) => c.id === categoryId);

  const onSubmit = async (v) => {
    setFormError("");
    const desc = (v.description ?? "").trim();
    const body = {
      type: v.type,
      categoryId: v.categoryId,
      amount: parseAmountInput(v.amount),
      transactionDate: v.transactionDate,
    };

    try {
      if (editing) {
        if (desc !== (transaction.description ?? "")) body.description = desc;
        await update.mutateAsync({ id: transaction.id, body });
        toast.success(t("transactions.updated"));
      } else {
        if (desc) body.description = desc;
        await create.mutateAsync(body);
        toast.success(t("transactions.created"));
      }
      onClose();
    } catch (err) {
      const fe = fieldErrors(err);
      const known = Object.entries(fe).filter(([k]) => FIELD_NAMES.includes(k));
      if (known.length) {
        known.forEach(([k, msg]) => setError(k, { message: msg }));
      } else {
        setFormError(apiMessage(t, err));
      }
    }
  };

  return (
    <Modal
      isOpen
      onClose={busy ? () => {} : onClose}
      title={editing ? t("transactions.edit") : t("transactions.add")}
      size="md"
      footer={
        <div className="flex justify-end gap-2.5">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="transaction-form" loading={busy}>
            {t("common.save")}
          </Button>
        </div>
      }
    >
      <form
        id="transaction-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        {formError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>{formError}</span>
          </div>
        )}

        {/* Tipe Transaksi */}
        <div>
          <span className="label">{t("transactions.type")}</span>
          <div className="grid grid-cols-2 gap-2.5">
            {["income", "expense"].map((tp) => {
              const active = type === tp;
              const isIncome = tp === "income";
              return (
                <button
                  key={tp}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setValue("type", tp, { shouldValidate: true })}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-all ${
                    active
                      ? isIncome
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "border-rose-500 bg-rose-50 text-rose-700 shadow-sm dark:bg-rose-950/40 dark:text-rose-300"
                      : "border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800/60"
                  }`}
                >
                  {isIncome ? (
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span>{t(`transactions.${tp}`)}</span>
                </button>
              );
            })}
          </div>
          {errors.type && (
            <p className="mt-1.5 text-xs font-medium text-danger">
              {errors.type.message}
            </p>
          )}
        </div>

        {/* Kategori */}
        <div>
          <label htmlFor="tx-categoryId" className="label">
            {t("transactions.category")}
          </label>
          <select
            id="tx-categoryId"
            aria-invalid={Boolean(errors.categoryId)}
            aria-describedby={errors.categoryId ? "tx-category-error" : undefined}
            className={`input-field ${errors.categoryId ? "input-field-error" : ""}`}
            disabled={loadingCats}
            {...register("categoryId")}
          >
            <option value="">
              {loadingCats ? t("common.loading") : t("transactions.select_category")}
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p id="tx-category-error" className="mt-1.5 text-xs font-medium text-danger">
              {errors.categoryId.message}
            </p>
          )}
        </div>

        {/* Nominal & Tanggal */}
        <div className="form-row">
          <div>
            <label htmlFor="tx-amount" className="label">
              {t("transactions.amount")} (IDR)
            </label>
            <div className="relative">
              <span
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400"
                aria-hidden="true"
              >
                Rp
              </span>
              <input
                id="tx-amount"
                inputMode="numeric"
                autoComplete="off"
                placeholder="0"
                aria-invalid={Boolean(errors.amount)}
                aria-describedby={errors.amount ? "tx-amount-error" : undefined}
                className={`input-field tabular-nums-finance pl-10 font-semibold ${
                  errors.amount ? "input-field-error" : ""
                }`}
                {...register("amount")}
                value={amount}
                onChange={(e) =>
                  setValue("amount", formatAmountInput(e.target.value), {
                    shouldValidate: Boolean(errors.amount),
                  })
                }
              />
            </div>
            {currency !== "IDR" && numeric > 0 && (
              <p className="tabular-nums-finance mt-1 text-xs text-gray-500 dark:text-gray-400">
                ≈ {formatCurrencyWithRate(numeric, currency, exchangeRates)}
              </p>
            )}
            {errors.amount && (
              <p id="tx-amount-error" className="mt-1.5 text-xs font-medium text-danger">
                {errors.amount.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="tx-date" className="label">
              {t("transactions.date")}
            </label>
            <input
              id="tx-date"
              type="date"
              max={todayWIB()}
              aria-invalid={Boolean(errors.transactionDate)}
              aria-describedby={errors.transactionDate ? "tx-date-error" : undefined}
              className={`input-field tabular-nums-finance ${
                errors.transactionDate ? "input-field-error" : ""
              }`}
              {...register("transactionDate")}
            />
            {errors.transactionDate && (
              <p id="tx-date-error" className="mt-1.5 text-xs font-medium text-danger">
                {errors.transactionDate.message}
              </p>
            )}
          </div>
        </div>

        {/* Deskripsi */}
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label htmlFor="tx-description" className="label mb-0">
              {t("transactions.description")}{" "}
              <span className="font-normal text-gray-400">
                ({t("transactions.optional")})
              </span>
            </label>
            <span className="tabular-nums-finance text-[11px] text-gray-400">
              {description.length}/255
            </span>
          </div>
          <textarea
            id="tx-description"
            rows={2}
            maxLength={255}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={errors.description ? "tx-desc-error" : undefined}
            className={`input-field min-h-[76px] resize-y ${
              errors.description ? "input-field-error" : ""
            }`}
            {...register("description")}
          />
          {errors.description && (
            <p id="tx-desc-error" className="mt-1.5 text-xs font-medium text-danger">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Ringkasan Singkat */}
        {numeric > 0 && selectedCategory && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200/80 bg-gray-50/90 px-3.5 py-2.5 text-xs text-gray-600 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-300">
            <span className="inline-flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: selectedCategory.color }}
                aria-hidden="true"
              />
              <span className="font-medium text-gray-800 dark:text-gray-100">
                {selectedCategory.name}
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums-finance">
                {formatApiDate(date, language)}
              </span>
            </span>
            <span
              className={`tabular-nums-finance font-semibold ${
                type === "income"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {type === "income" ? "+" : "−"} {formatCurrency(numeric, "IDR")}
            </span>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default TransactionForm;