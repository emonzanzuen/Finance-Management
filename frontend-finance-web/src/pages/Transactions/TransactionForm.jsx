import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import { useApp } from "../../context/AppContext";
import { useTranslation } from "../../hooks/useTranslation";
import { useCategories, useCreateTransaction, useUpdateTransaction } from "../../hooks/queries";
import { transactionSchema } from "../../lib/schemas";
import { formatAmountInput, parseAmountInput, todayWIB } from "../../lib/rules";
import { formatApiDate } from "../../lib/format";
import { formatCurrency, formatCurrencyWithRate } from "../../utils/formatters";
import { fieldErrors } from "../../api/errors";
import { apiMessage } from "../../lib/apiMessage";

const inputCls =
  "w-full px-3 py-2.5 text-sm rounded-xl border bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500";
const FIELD_NAMES = ["type", "categoryId", "amount", "transactionDate", "description"];

const TransactionForm = ({ transaction, onClose }) => {
  const { t, language } = useTranslation();
  const { currency, exchangeRates } = useApp();
  const create = useCreateTransaction();
  const update = useUpdateTransaction();
  const [formError, setFormError] = useState("");
  const editing = Boolean(transaction);
  const busy = create.isPending || update.isPending;

  const {
    register, handleSubmit, setValue, watch, setError, formState: { errors },
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
  const { data: categories = [], isLoading: loadingCats } = useCategories(type);

  // Kategori harus bertipe sama; reset pilihan bila tidak lagi cocok.
  useEffect(() => {
    if (categoryId && categories.length && !categories.some((c) => c.id === categoryId)) {
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
      if (known.length) known.forEach(([k, msg]) => setError(k, { message: msg }));
      else setFormError(apiMessage(t, err));
    }
  };

  const label = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";
  const border = (n) => (errors[n] ? "border-red-400" : "border-gray-300 dark:border-gray-700");

  return (
    <Modal
      isOpen
      onClose={busy ? () => {} : onClose}
      title={editing ? t("transactions.edit") : t("transactions.add")}
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={busy}>{t("common.cancel")}</Button>
          <Button onClick={handleSubmit(onSubmit)} loading={busy}>{t("common.save")}</Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {formError && (
          <div role="alert" className="p-3 rounded-xl text-sm bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300">{formError}</div>
        )}

        <div>
          <span className={label}>{t("transactions.type")}</span>
          <div className="grid grid-cols-2 gap-2">
            {["income", "expense"].map((tp) => (
              <button
                key={tp}
                type="button"
                onClick={() => setValue("type", tp, { shouldValidate: true })}
                className={`py-2.5 rounded-xl text-sm font-medium border transition ${
                  type === tp
                    ? tp === "income"
                      ? "bg-green-50 border-green-500 text-green-700 dark:bg-green-950/40 dark:text-green-300"
                      : "bg-red-50 border-red-500 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                    : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300"
                }`}
              >
                {t(`transactions.${tp}`)}
              </button>
            ))}
          </div>
          {errors.type && <p className="text-xs text-red-500 mt-1">{errors.type.message}</p>}
        </div>

        <div>
          <label htmlFor="categoryId" className={label}>{t("transactions.category")}</label>
          <select id="categoryId" className={`${inputCls} ${border("categoryId")}`} disabled={loadingCats} {...register("categoryId")}>
            <option value="">{t("transactions.select_category")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.categoryId && <p className="text-xs text-red-500 mt-1">{errors.categoryId.message}</p>}
        </div>

        <div>
          <label htmlFor="amount" className={label}>{t("transactions.amount")} (IDR)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">Rp</span>
            <input
              id="amount"
              inputMode="numeric"
              autoComplete="off"
              className={`${inputCls} pl-10 ${border("amount")}`}
              {...register("amount")}
              value={amount}
              onChange={(e) => setValue("amount", formatAmountInput(e.target.value), { shouldValidate: Boolean(errors.amount) })}
            />
          </div>
          {currency !== "IDR" && numeric > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">≈ {formatCurrencyWithRate(numeric, currency, exchangeRates)}</p>
          )}
          {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
        </div>

        <div>
          <label htmlFor="transactionDate" className={label}>{t("transactions.date")}</label>
          <input id="transactionDate" type="date" max={todayWIB()} className={`${inputCls} ${border("transactionDate")}`} {...register("transactionDate")} />
          {errors.transactionDate && <p className="text-xs text-red-500 mt-1">{errors.transactionDate.message}</p>}
        </div>

        <div>
          <label htmlFor="description" className={label}>{t("transactions.description")} <span className="text-gray-400 font-normal">({t("transactions.optional")})</span></label>
          <textarea id="description" rows={2} maxLength={255} className={`${inputCls} ${border("description")}`} {...register("description")} />
          {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
        </div>

        {numeric > 0 && selectedCategory && (
          <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3">
            {t("transactions.summary")}: {t(`transactions.${type}`)} {formatCurrency(numeric, "IDR")} · {selectedCategory.name} · {formatApiDate(date, language)}
          </div>
        )}
      </form>
    </Modal>
  );
};

export default TransactionForm;
