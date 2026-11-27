import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Tags } from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../../components/common/PageHeader";
import ErrorState from "../../components/common/ErrorState";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import EmptyState from "../../components/ui/EmptyState";
import SkeletonLoader from "../../components/ui/SkeletonLoader";
import { useTranslation } from "../../hooks/useTranslation";
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "../../hooks/queries";
import { categorySchema } from "../../lib/schemas";
import { COLOR_PRESETS } from "../../lib/rules";
import { fieldErrors } from "../../api/errors";
import { apiMessage } from "../../lib/apiMessage";

const inputCls =
  "w-full px-3 py-2.5 text-sm rounded-xl border bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500";

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
        if (Object.keys(body).length) await update.mutateAsync({ id: category.id, body });
        toast.success(t("categories.updated"));
      } else {
        await create.mutateAsync({ name: v.name.trim(), type: v.type, color: v.color });
        toast.success(t("categories.created"));
      }
      onClose();
    } catch (err) {
      if (err.code === "CATEGORY_DUPLICATE") setError("name", { message: apiMessage(t, err) });
      else if (err.code === "CATEGORY_TYPE_LOCKED") setError("type", { message: apiMessage(t, err) });
      else {
        const fe = fieldErrors(err);
        const known = Object.entries(fe).filter(([k]) => ["name", "type", "color"].includes(k));
        if (known.length) known.forEach(([k, msg]) => setError(k, { message: msg }));
        else setFormError(apiMessage(t, err));
      }
    }
  };

  return (
    <Modal
      isOpen
      onClose={busy ? () => {} : onClose}
      title={editing ? t("categories.edit") : t("categories.add")}
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={busy}>{t("common.cancel")}</Button>
          <Button onClick={handleSubmit(onSubmit)} loading={busy}>{t("common.save")}</Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {formError && (
          <div role="alert" className="p-3 rounded-xl text-sm bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300">{formError}</div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("categories.name")}</label>
          <input className={`${inputCls} ${errors.name ? "border-red-400" : "border-gray-300 dark:border-gray-700"}`} maxLength={50} {...register("name")} />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("categories.type")}</span>
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
          <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("categories.color")}</span>
          <div className="flex flex-wrap items-center gap-2">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={c}
                onClick={() => setValue("color", c, { shouldValidate: true })}
                className={`w-8 h-8 rounded-full border-2 transition ${color?.toLowerCase() === c ? "border-gray-900 dark:border-white scale-110" : "border-transparent"}`}
                style={{ backgroundColor: c }}
              />
            ))}
            <input
              type="color"
              value={/^#[0-9a-fA-F]{6}$/.test(color) ? color : COLOR_PRESETS[0]}
              onChange={(e) => setValue("color", e.target.value, { shouldValidate: true })}
              className="w-8 h-8 rounded-full cursor-pointer border border-gray-300 dark:border-gray-700 bg-transparent"
              aria-label={t("categories.pick_color")}
            />
          </div>
          {errors.color && <p className="text-xs text-red-500 mt-1">{errors.color.message}</p>}
        </div>
      </form>
    </Modal>
  );
};

const CategoryColumn = ({ type, items, onAdd, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const income = type === "income";
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-semibold ${income ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
          {income ? t("categories.income_categories") : t("categories.expense_categories")}
          <span className="ml-2 text-sm font-normal text-gray-400">({items.length})</span>
        </h3>
        <Button size="sm" variant="outline" icon={Plus} onClick={() => onAdd(type)}>{t("common.add")}</Button>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">{income ? t("categories.no_income") : t("categories.no_expense")}</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {items.map((c) => (
            <li key={c.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                <span className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{c.name}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => onEdit(c)} aria-label={t("common.edit")}>
                  <Pencil className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40" onClick={() => onDelete(c)} aria-label={t("common.delete")}>
                  <Trash2 className="w-4 h-4" />
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
        toast.error(t("categories.in_use_message", { tx: err.details?.transactionCount ?? 0, budget: err.details?.budgetCount ?? 0 }));
      } else {
        toast.error(apiMessage(t, err));
      }
    } finally {
      setToDelete(null);
    }
  };

  return (
    <div>
      <PageHeader
        title={t("categories.title")}
        subtitle={t("categories.subtitle")}
        icon={Tags}
        actions={<Button icon={Plus} onClick={() => setForm({})}>{t("categories.add")}</Button>}
      />

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-6"><SkeletonLoader variant="table" /><SkeletonLoader variant="table" /></div>
      ) : isError ? (
        <ErrorState message={apiMessage(t, error)} onRetry={refetch} retryText={t("common.retry")} />
      ) : items.length === 0 ? (
        <EmptyState title={t("categories.no_income")} actionText={t("categories.add")} onAction={() => setForm({})} />
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <CategoryColumn type="income" items={income} onAdd={(tp) => setForm({ defaultType: tp })} onEdit={(c) => setForm({ category: c })} onDelete={setToDelete} />
          <CategoryColumn type="expense" items={expense} onAdd={(tp) => setForm({ defaultType: tp })} onEdit={(c) => setForm({ category: c })} onDelete={setToDelete} />
        </div>
      )}

      {form && <CategoryForm category={form.category} defaultType={form.defaultType} onClose={() => setForm(null)} />}
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
