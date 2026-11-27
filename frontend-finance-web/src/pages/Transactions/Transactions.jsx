import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Receipt,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  SlidersHorizontal,
} from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../../components/common/PageHeader";
import ErrorState from "../../components/common/ErrorState";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Pagination from "../../components/common/Pagination";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Badge from "../../components/ui/Badge";
import Table from "../../components/ui/Table";
import EmptyState from "../../components/ui/EmptyState";
import SkeletonLoader from "../../components/ui/SkeletonLoader";
import TransactionForm from "./TransactionForm";
import { useApp } from "../../context/AppContext";
import { useTranslation } from "../../hooks/useTranslation";
import { useDebounce } from "../../hooks/useDebounce";
import {
  useCategories,
  useTransactions,
  useTransaction,
  useDeleteTransaction,
} from "../../hooks/queries";
import { formatCurrencyWithRate } from "../../utils/formatters";
import { formatApiDate } from "../../lib/format";
import { apiMessage } from "../../lib/apiMessage";

const LIMIT = 10;
const SORTS = {
  date_desc: {
    sortBy: "transactionDate",
    sortOrder: "desc",
    key: "transactions.sort_date_desc",
  },
  date_asc: {
    sortBy: "transactionDate",
    sortOrder: "asc",
    key: "transactions.sort_date_asc",
  },
  amount_desc: {
    sortBy: "amount",
    sortOrder: "desc",
    key: "transactions.sort_amount_desc",
  },
  amount_asc: {
    sortBy: "amount",
    sortOrder: "asc",
    key: "transactions.sort_amount_asc",
  },
};
const EMPTY_FILTERS = {
  type: "",
  categoryId: "",
  search: "",
  dateFrom: "",
  dateTo: "",
  sort: "date_desc",
};

const Transactions = () => {
  const { t, language } = useTranslation();
  const { currency, exchangeRates } = useApp();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(null); // { transaction? }
  const [detail, setDetail] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const remove = useDeleteTransaction();

  const search = useDebounce(filters.search, 400);
  const rangeInvalid = Boolean(
    filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo
  );
  const sort = SORTS[filters.sort];

  const params = useMemo(
    () => ({
      page,
      limit: LIMIT,
      type: filters.type,
      categoryId: filters.categoryId,
      search: search.trim(),
      dateFrom: rangeInvalid ? "" : filters.dateFrom,
      dateTo: rangeInvalid ? "" : filters.dateTo,
      sortBy: sort.sortBy,
      sortOrder: sort.sortOrder,
    }),
    [
      page,
      filters.type,
      filters.categoryId,
      search,
      filters.dateFrom,
      filters.dateTo,
      rangeInvalid,
      sort,
    ]
  );

  const { data, isLoading, isError, error, refetch, isPlaceholderData } =
    useTransactions(params);
  const { data: categories = [] } = useCategories(filters.type || undefined);
  const detailQuery = useTransaction(detail?.id);

  useEffect(() => {
    if (detailQuery.data) setDetail(detailQuery.data);
  }, [detailQuery.data]);

  // Kembali ke halaman 1 saat filter berubah; mundur bila halaman terakhir kosong setelah hapus.
  useEffect(
    () => setPage(1),
    [
      filters.type,
      filters.categoryId,
      search,
      filters.dateFrom,
      filters.dateTo,
      filters.sort,
    ]
  );

  const totalPages = data?.meta?.totalPages ?? 1;
  useEffect(() => {
    if (page > totalPages && totalPages >= 1) setPage(totalPages);
  }, [page, totalPages]);

  const setFilter = (name, value) =>
    setFilters((f) => {
      const next = { ...f, [name]: value };
      if (name === "type") next.categoryId = ""; // kategori mengikuti tipe
      return next;
    });

  const activeFilterCount = Object.entries(filters).filter(
    ([k, v]) => k !== "sort" && v !== ""
  ).length;
  const hasFilters = activeFilterCount > 0;

  const items = data?.items ?? [];
  const meta = data?.meta;
  const money = (n) => formatCurrencyWithRate(n, currency, exchangeRates);

  const confirmDelete = async () => {
    try {
      await remove.mutateAsync(toDelete.id);
      toast.success(t("transactions.deleted"));
      setDetail(null);
    } catch (err) {
      toast.error(apiMessage(t, err));
    } finally {
      setToDelete(null);
    }
  };

  const columns = [
    {
      key: "transactionDate",
      label: t("transactions.date"),
      render: (v) => (
        <span className="tabular-nums-finance whitespace-nowrap text-gray-600 dark:text-gray-300">
          {formatApiDate(v, language)}
        </span>
      ),
    },
    {
      key: "description",
      label: t("transactions.description"),
      render: (v, row) => (
        <div className="min-w-0 max-w-xs">
          <p className="truncate font-medium text-gray-900 dark:text-gray-100">
            {v || <span className="font-normal text-gray-400">—</span>}
          </p>
        </div>
      ),
    },
    {
      key: "category",
      label: t("transactions.category"),
      render: (c) => (
        <span className="inline-flex items-center gap-2 rounded-lg bg-gray-100/80 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200">
          <span
            className="h-2 w-2 flex-shrink-0 rounded-full"
            style={{ backgroundColor: c?.color || "#9ca3af" }}
            aria-hidden="true"
          />
          <span className="truncate">{c?.name || "—"}</span>
        </span>
      ),
    },
    {
      key: "amount",
      label: t("transactions.amount"),
      align: "right",
      render: (v, row) => (
        <span
          className={`tabular-nums-finance whitespace-nowrap font-semibold ${
            row.type === "income"
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-rose-600 dark:text-rose-400"
          }`}
        >
          {row.type === "income" ? "+" : "−"} {money(v)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (_, row) => (
        <span className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
            onClick={() => setForm({ transaction: row })}
            aria-label={t("common.edit")}
            title={t("common.edit")}
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50"
            onClick={() => setToDelete(row)}
            aria-label={t("common.delete")}
            title={t("common.delete")}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("transactions.title")}
        subtitle={t("transactions.subtitle")}
        icon={Receipt}
        className="mb-0"
        actions={
          <>
            <Link to="/scan-receipt" className="btn btn-outline">
              <Receipt className="h-4 w-4" aria-hidden="true" />
              <span>{t("nav.scan_receipt")}</span>
            </Link>
            <Button icon={Plus} onClick={() => setForm({})}>
              {t("transactions.add")}
            </Button>
          </>
        }
      />

      {/* Filter & Pencarian Server-Side */}
      <Card className="space-y-3.5 p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12">
          {/* Pencarian */}
          <div className="relative sm:col-span-2 lg:col-span-5">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              type="text"
              className="input-field pl-10 pr-9"
              placeholder={t("transactions.search_placeholder")}
              maxLength={50}
              value={filters.search}
              onChange={(e) => setFilter("search", e.target.value)}
              aria-label={t("transactions.search")}
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => setFilter("search", "")}
                aria-label={t("transactions.clear_filters")}
                className="absolute right-2.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Filter Tipe */}
          <div className="lg:col-span-3">
            <select
              className="input-field"
              value={filters.type}
              onChange={(e) => setFilter("type", e.target.value)}
              aria-label={t("transactions.filter_type")}
            >
              <option value="">
                {t("transactions.filter_type")}: {t("common.all")}
              </option>
              <option value="income">{t("transactions.income")}</option>
              <option value="expense">{t("transactions.expense")}</option>
            </select>
          </div>

          {/* Filter Kategori */}
          <div className="lg:col-span-4">
            <select
              className="input-field"
              value={filters.categoryId}
              onChange={(e) => setFilter("categoryId", e.target.value)}
              aria-label={t("transactions.filter_category")}
            >
              <option value="">
                {t("transactions.filter_category")}: {t("common.all")}
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Baris Rentang Tanggal & Urutan */}
        <div className="grid gap-3 border-t border-gray-100 pt-3.5 dark:border-gray-800/80 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-3">
            <label
              htmlFor="tx-date-from"
              className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400"
            >
              {t("transactions.date_from")}
            </label>
            <input
              id="tx-date-from"
              type="date"
              className={`input-field input-field-sm tabular-nums-finance ${
                rangeInvalid ? "input-field-error" : ""
              }`}
              value={filters.dateFrom}
              onChange={(e) => setFilter("dateFrom", e.target.value)}
            />
          </div>

          <div className="lg:col-span-3">
            <label
              htmlFor="tx-date-to"
              className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400"
            >
              {t("transactions.date_to")}
            </label>
            <input
              id="tx-date-to"
              type="date"
              className={`input-field input-field-sm tabular-nums-finance ${
                rangeInvalid ? "input-field-error" : ""
              }`}
              value={filters.dateTo}
              onChange={(e) => setFilter("dateTo", e.target.value)}
            />
          </div>

          <div className="lg:col-span-3">
            <label
              htmlFor="tx-sort"
              className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400"
            >
              {t("transactions.sort_by")}
            </label>
            <select
              id="tx-sort"
              className="input-field input-field-sm"
              value={filters.sort}
              onChange={(e) => setFilter("sort", e.target.value)}
            >
              {Object.entries(SORTS).map(([k, s]) => (
                <option key={k} value={k}>
                  {t(s.key)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between gap-2 lg:col-span-3 lg:justify-end">
            {hasFilters ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                icon={X}
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="text-gray-600 dark:text-gray-300"
              >
                {t("transactions.clear_filters")} ({activeFilterCount})
              </Button>
            ) : (
              meta?.total !== undefined && (
                <span className="tabular-nums-finance inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>
                    {meta.total} {t("nav.transactions").toLowerCase()}
                  </span>
                </span>
              )
            )}
          </div>
        </div>

        {rangeInvalid && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>{t("transactions.range_invalid")}</span>
          </div>
        )}
      </Card>

      {/* Daftar Transaksi */}
      <Card padding={false}>
        {isLoading ? (
          <div className="p-5">
            <SkeletonLoader variant="table" />
          </div>
        ) : isError ? (
          <ErrorState
            message={apiMessage(t, error)}
            onRetry={refetch}
            retryText={t("common.retry")}
          />
        ) : items.length === 0 ? (
          hasFilters ? (
            <EmptyState
              title={t("transactions.no_results")}
              description=""
              actionText={t("transactions.clear_filters")}
              onAction={() => setFilters(EMPTY_FILTERS)}
            />
          ) : (
            <EmptyState
              title={t("transactions.empty")}
              description={t("dashboard.start_recording")}
              actionText={t("transactions.add_first")}
              onAction={() => setForm({})}
            />
          )
        ) : (
          <div
            className={`transition-opacity duration-200 ${
              isPlaceholderData ? "opacity-60" : ""
            }`}
          >
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table
                columns={columns}
                data={items}
                onRowClick={setDetail}
                emptyMessage={t("transactions.empty")}
                className="rounded-none border-0"
              />
            </div>

            {/* Mobile Card List */}
            <ul
              aria-label={t("transactions.title")}
              className="divide-y divide-gray-100 dark:divide-gray-800/80 md:hidden"
            >
              {items.map((row) => {
                const isIncome = row.type === "income";
                return (
                  <li key={row.id} className="p-4">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setDetail(row)}
                      onKeyDown={(e) => {
                        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault();
                          setDetail(row);
                        }
                      }}
                      className="flex items-start justify-between gap-3 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${
                            isIncome
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                              : "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
                          }`}
                          aria-hidden="true"
                        >
                          {isIncome ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                            {row.description || row.category?.name || "—"}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                            {row.category?.name && (
                              <span className="inline-flex items-center gap-1.5">
                                <span
                                  className="h-2 w-2 rounded-full"
                                  style={{ backgroundColor: row.category.color || "#9ca3af" }}
                                  aria-hidden="true"
                                />
                                <span>{row.category.name}</span>
                              </span>
                            )}
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums-finance">
                              {formatApiDate(row.transactionDate, language)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <p
                          className={`tabular-nums-finance whitespace-nowrap text-sm font-bold ${
                            isIncome
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {isIncome ? "+" : "−"} {money(row.amount)}
                        </p>
                        <div
                          className="flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200/80 text-gray-500 transition-colors hover:bg-gray-100 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800"
                            onClick={() => setForm({ transaction: row })}
                            aria-label={t("common.edit")}
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200/80 text-rose-500 transition-colors hover:bg-rose-50 dark:border-gray-800 dark:hover:bg-rose-950/50"
                            onClick={() => setToDelete(row)}
                            aria-label={t("common.delete")}
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {meta && items.length > 0 && (
          <div className="px-4 pb-4 sm:px-5">
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              limit={meta.limit}
              onPageChange={setPage}
              labels={{
                showing: t("transactions.showing"),
                pageOf: t("transactions.page_of"),
                prev: t("transactions.prev"),
                next: t("transactions.next"),
              }}
            />
          </div>
        )}
      </Card>

      {/* Form Tambah/Edit */}
      {form && (
        <TransactionForm
          transaction={form.transaction}
          onClose={() => setForm(null)}
        />
      )}

      {/* Modal Detail Transaksi */}
      <Modal
        isOpen={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={t("transactions.detail")}
        size="sm"
        footer={
          detail && (
            <div className="flex justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                icon={Pencil}
                onClick={() => {
                  setForm({ transaction: detail });
                  setDetail(null);
                }}
              >
                {t("common.edit")}
              </Button>
              <Button
                type="button"
                variant="danger"
                icon={Trash2}
                onClick={() => setToDelete(detail)}
              >
                {t("common.delete")}
              </Button>
            </div>
          )
        }
      >
        {detail && (
          <div className="space-y-4">
            <div className="rounded-xl bg-gray-50/90 p-4 text-center dark:bg-gray-800/50">
              <Badge variant={detail.type === "income" ? "success" : "danger"} dot>
                {t(`transactions.${detail.type}`)}
              </Badge>
              <p
                className={`tabular-nums-finance mt-2 text-2xl font-bold tracking-tight ${
                  detail.type === "income"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {detail.type === "income" ? "+" : "−"} {money(detail.amount)}
              </p>
            </div>

            <dl className="divide-y divide-gray-100 text-sm dark:divide-gray-800">
              <div className="flex items-center justify-between gap-3 py-2.5">
                <dt className="text-gray-500 dark:text-gray-400">
                  {t("transactions.category")}
                </dt>
                <dd className="inline-flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: detail.category?.color || "#9ca3af" }}
                    aria-hidden="true"
                  />
                  <span>{detail.category?.name || "—"}</span>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-2.5">
                <dt className="text-gray-500 dark:text-gray-400">
                  {t("transactions.date")}
                </dt>
                <dd className="tabular-nums-finance font-medium text-gray-900 dark:text-white">
                  {formatApiDate(detail.transactionDate, language)}
                </dd>
              </div>
              <div className="py-2.5">
                <dt className="mb-1 text-gray-500 dark:text-gray-400">
                  {t("transactions.description")}
                </dt>
                <dd className="leading-relaxed text-gray-800 dark:text-gray-100">
                  {detail.description || "—"}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </Modal>

      {/* Dialog Konfirmasi Hapus */}
      <ConfirmDialog
        isOpen={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={remove.isPending}
        title={t("transactions.delete")}
        message={t("transactions.confirm_delete")}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
      />
    </div>
  );
};

export default Transactions;