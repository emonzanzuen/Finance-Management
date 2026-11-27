import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Pencil,
  Trash2,
  Tags,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Check,
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
import { useTranslation } from "../../hooks/useTranslation";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "../../hooks/queries";
import { categorySchema } from "../../lib/schemas";
import { COLOR_PRESETS } from "../../lib/rules";
import { fieldErrors } from "../../api/errors";
import { apiMessage } from "../../lib/apiMessage";

const CategoryForm = ({ category, defaultType, onClose }) => {
  const { t } = useTranslation();
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const [formError, setFormError] = useState("");
  const editing = Boolean(category);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? "",
      type: category?.type ?? defaultType ?? "expense",
      color: category?.color ?? COLOR_PRESETS[0],
    },
  });

  const name = watch("name");
  const type = watch("type");
  const color = watch("color");
  const busy = create.isPending || update.isPending;

  const onSubmit = async (v) => {
    setFormError("");
    try {
      if (editing) {
        // Kirim hanya field yang berubah agar aturan tipe terkunci tidak terpicu tanpa perlu.
        const body = {};
        if (v.name.trim() !== category.name) body.name = v.name.trim();
        if (v.type !== category.type) body.type = v.type;
        if (v.color.toLowerCase() !== category.color.toLowerCase()) body.color = v.color;
        if (Object.keys(body).length) {
          await update.mutateAsync({ id: category.id, body });
        }
        toast.success(t("categories.updated"));
      } else {
        await create.mutateAsync({
          name: v.name.trim(),
          type: v.type,
          color: v.color,
        });
        toast.success(t("categories.created"));
      }
      onClose();
    } catch (err) {
      if (err.code === "CATEGORY_DUPLICATE") {
        setError("name", { message: apiMessage(t, err) });
      } else if (err.code === "CATEGORY_TYPE_LOCKED") {
        setError("type", { message: apiMessage(t, err) });
      } else {
        const fe = fieldErrors(err);
        const known = Object.entries(fe).filter(([k]) =>
          ["name", "type", "color"].includes(k)
        );
        if (known.length) {
          known.forEach(([k, msg]) => setError(k, { message: msg }));
        } else {
          setFormError(apiMessage(t, err));
        }
      }
    }
  };

  const safeColor = /^#[0-9a-fA-F]{6}$/.test(color) ? color : COLOR_PRESETS[0];

  return (
    <Modal
      isOpen
      onClose={busy ? () => {} : onClose}
      title={editing ? t("categories.edit") : t("categories.add")}
      size="md"
      footer={
        <div className="flex justify-end gap-2.5">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="category-form" loading={busy}>
            {t("common.save")}
          </Button>
        </div>
      }
    >
      <form
        id="category-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
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

        {/* Pratinjau Kategori */}
        <div className="flex items-center justify-between rounded-xl border border-gray-200/80 bg-gray-50/90 px-3.5 py-2.5 dark:border-gray-800 dark:bg-gray-800/50">
          <span className="inline-flex min-w-0 items-center gap-2.5">
            <span
              className="h-3.5 w-3.5 flex-shrink-0 rounded-full ring-2 ring-white dark:ring-gray-900"
              style={{ backgroundColor: safeColor }}
              aria-hidden="true"
            />
            <span className="truncate text-sm font-medium text-gray-900 dark:text-white">
              {name?.trim() || t("categories.name")}
            </span>
          </span>
          <Badge variant={type === "income" ? "success" : "danger"} size="sm">
            {t(`transactions.${type}`)}
          </Badge>
        </div>

        {/* Nama Kategori */}
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label htmlFor="cat-name" className="label mb-0">
              {t("categories.name")}
            </label>
            <span className="tabular-nums-finance text-[11px] text-gray-400">
              {(name || "").length}/50
            </span>
          </div>
          <input
            id="cat-name"
            maxLength={50}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "cat-name-error" : undefined}
            className={`input-field ${errors.name ? "input-field-error" : ""}`}
            {...register("name")}
          />
          {errors.name && (
            <p id="cat-name-error" className="mt-1.5 text-xs font-medium text-danger">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Tipe Kategori */}
        <div>
          <span className="label">{t("categories.type")}</span>
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
                    <TrendingUp className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <TrendingDown className="h-4 w-4" aria-hidden="true" />
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

        {/* Warna Kategori */}
        <div>
          <span className="label">{t("categories.color")}</span>
          <div className="flex flex-wrap items-center gap-2.5">
            {COLOR_PRESETS.map((c) => {
              const selected = color?.toLowerCase() === c.toLowerCase();
              return (
                <button
                  key={c}
                  type="button"
                  aria-label={c}
                  aria-pressed={selected}
                  onClick={() => setValue("color", c, { shouldValidate: true })}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full border-2 transition-transform ${
                    selected
                      ? "scale-110 border-gray-900 shadow-sm dark:border-white"
                      : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {selected && (
                    <Check className="h-4 w-4 text-white drop-shadow-sm" aria-hidden="true" />
                  )}
                </button>
              );
            })}
            <input
              type="color"
              value={safeColor}
              onChange={(e) => setValue("color", e.target.value, { shouldValidate: true })}
              className="h-8 w-8 cursor-pointer rounded-full border border-gray-300 bg-transparent p-0.5 dark:border-gray-700"
              aria-label={t("categories.pick_color")}
              title={t("categories.pick_color")}
            />
          </div>
          {errors.color && (
            <p className="mt-1.5 text-xs font-medium text-danger">
              {errors.color.message}
            </p>
          )}
        </div>
      </form>
    </Modal>
  );
};

const CategoryColumn = ({ type, items, onAdd, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const isIncome = type === "income";

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-gray-100 pb-3.5 dark:border-gray-800/80">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${
              isIncome
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                : "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
            }`}
            aria-hidden="true"
          >
            {isIncome ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="section-title truncate">
              {isIncome
                ? t("categories.income_categories")
                : t("categories.expense_categories")}
            </h3>
            <Badge
              variant={isIncome ? "success" : "danger"}
              size="sm"
              className="tabular-nums-finance"
            >
              {items.length}
            </Badge>
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          icon={Plus}
          onClick={() => onAdd(type)}
        >
          {t("common.add")}
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
          {isIncome ? t("categories.no_income") : t("categories.no_expense")}
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800/80">
          {items.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-800/40"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="h-3.5 w-3.5 flex-shrink-0 rounded-full ring-2 ring-gray-100 dark:ring-gray-800"
                  style={{ backgroundColor: c.color }}
                  aria-hidden="true"
                />
                <span className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                  {c.name}
                </span>
              </div>
              <div className="flex flex-shrink-0 items-center gap-1">
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                  onClick={() => onEdit(c)}
                  aria-label={`${t("common.edit")} ${c.name}`}
                  title={t("common.edit")}
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50"
                  onClick={() => onDelete(c)}
                  aria-label={`${t("common.delete")} ${c.name}`}
                  title={t("common.delete")}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

const Categories = () => {
  const { t } = useTranslation();
  const { data, isLoading, isError, error, refetch } = useCategories();
  const remove = useDeleteCategory();
  const [form, setForm] = useState(null); // { category?, defaultType? }
  const [toDelete, setToDelete] = useState(null);

  const items = data ?? [];
  const income = items.filter((c) => c.type === "income");
  const expense = items.filter((c) => c.type === "expense");

  const confirmDelete = async () => {
    try {
      await remove.mutateAsync(toDelete.id);
      toast.success(t("categories.deleted"));
    } catch (err) {
      if (err.code === "CATEGORY_IN_USE") {
        toast.error(
          t("categories.in_use_message", {
            tx: err.details?.transactionCount ?? 0,
            budget: err.details?.budgetCount ?? 0,
          })
        );
      } else {
        toast.error(apiMessage(t, err));
      }
    } finally {
      setToDelete(null);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("categories.title")}
        subtitle={t("categories.subtitle")}
        icon={Tags}
        className="mb-0"
        actions={
          <Button icon={Plus} onClick={() => setForm({})}>
            {t("categories.add")}
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-5 md:grid-cols-2">
          <SkeletonLoader variant="table" />
          <SkeletonLoader variant="table" />
        </div>
      ) : isError ? (
        <Card padding={false}>
          <ErrorState
            message={apiMessage(t, error)}
            onRetry={refetch}
            retryText={t("common.retry")}
          />
        </Card>
      ) : items.length === 0 ? (
        <Card padding={false}>
          <EmptyState
            icon={Tags}
            title={t("categories.no_income")}
            description={t("categories.subtitle")}
            actionText={t("categories.add")}
            onAction={() => setForm({})}
          />
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          <CategoryColumn
            type="income"
            items={income}
            onAdd={(tp) => setForm({ defaultType: tp })}
            onEdit={(c) => setForm({ category: c })}
            onDelete={setToDelete}
          />
          <CategoryColumn
            type="expense"
            items={expense}
            onAdd={(tp) => setForm({ defaultType: tp })}
            onEdit={(c) => setForm({ category: c })}
            onDelete={setToDelete}
          />
        </div>
      )}

      {form && (
        <CategoryForm
          category={form.category}
          defaultType={form.defaultType}
          onClose={() => setForm(null)}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={remove.isPending}
        title={t("categories.delete")}
        message={t("categories.confirm_delete")}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
      />
    </div>
  );
};

export default Categories;