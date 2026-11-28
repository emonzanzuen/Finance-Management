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
  ArrowUpDown,
  Calendar,
  RotateCcw,
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
import { todayWIB } from "../../lib/rules";
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

function getDateRangePreset(preset) {
  const today = todayWIB();
  const [y, m, d] = today.split("-").map(Number);

  if (preset === "today") {
    return { dateFrom: today, dateTo: today };
  }
  if (preset === "7d") {
    const start = new Date(Date.UTC(y, m - 1, d - 6));
    const dateFrom = `${start.getUTCFullYear()}-${String(
      start.getUTCMonth() + 1
    ).padStart(2, "0")}-${String(start.getUTCDate()).padStart(2, "0")}`;
    return { dateFrom, dateTo: today };
  }
  if (preset === "month") {
    const dateFrom = `${y}-${String(m).padStart(2, "0")}-01`;
    return { dateFrom, dateTo: today };
  }
  return { dateFrom: "", dateTo: "" };
}

const Transactions = () => {
  const { t, language } = useTranslation();
  const isEn = language === "en";
  const { currency, exchangeRates } = useApp();

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [datePanelOpen, setDatePanelOpen] = useState(false);
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

  const applyDatePreset = (preset) => {
    const { dateFrom, dateTo } = getDateRangePreset(preset);
    setFilters((f) => ({ ...f, dateFrom, dateTo }));
  };

  const clearDates = () => {
    setFilters((f) => ({ ...f, dateFrom: "", dateTo: "" }));
  };

  const hasDateFilter = Boolean(filters.dateFrom || filters.dateTo);
  const activeFilterCount =
    (filters.search.trim() ? 1 : 0) +
    (filters.type ? 1 : 0) +
    (filters.categoryId ? 1 : 0) +
    (hasDateFilter ? 1 : 0);
  const hasFilters = activeFilterCount > 0;

  const items = data?.items ?? [];
  const meta = data?.meta;
  const money = (n) => formatCurrencyWithRate(n, currency, exchangeRates);
  const selectedCategoryObj = categories.find((c) => c.id === filters.categoryId);

  const dateButtonLabel = useMemo(() => {
    if (filters.dateFrom && filters.dateTo) {
      return `${formatApiDate(filters.dateFrom, language)} – ${formatApiDate(
        filters.dateTo,
        language
      )}`;
    }
    if (filters.dateFrom) {
      return `${isEn ? "From" : "Dari"} ${formatApiDate(
        filters.dateFrom,
        language
      )}`;
    }
    if (filters.dateTo) {
      return `${isEn ? "Until" : "Sampai"} ${formatApiDate(
        filters.dateTo,
        language
      )}`;
    }
    return isEn ? "Date range" : "Periode";
  }, [filters.dateFrom, filters.dateTo, language, isEn]);

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
      render: (v) => (
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
        <span
          className="inline-flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
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

      {/* ===== FILTER COMMAND DOCK (Server-Side) ===== */}
      <Card padding={false} className="overflow-hidden">
        {/* Baris 1: Pencarian Terintegrasi + Segmented Type + Periode + Urutkan */}
        <div className="flex flex-col gap-3 p-3.5 sm:p-4 lg:flex-row lg:items-center">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              type="text"
              className="w-full min-h-[40px] rounded-xl border border-gray-200/90 bg-gray-50/80 pl-10 pr-9 text-sm text-gray-900 placeholder:text-gray-400 transition-colors hover:border-gray-300 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-800 dark:bg-gray-950/60 dark:text-gray-100 dark:placeholder:text-gray-500 dark:hover:border-gray-700 dark:focus:border-primary-400 dark:focus:bg-gray-900"
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
                className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-200/70 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Segmented Type Switcher */}
            <div
              role="group"
              aria-label={t("transactions.type")}
              className="inline-flex rounded-xl border border-gray-200/90 bg-gray-100/80 p-1 dark:border-gray-800 dark:bg-gray-950/70"
            >
              {[
                { value: "", label: t("common.all"), icon: null, tone: "all" },
                {
                  value: "income",
                  label: t("transactions.income"),
                  icon: ArrowUpRight,
                  tone: "income",
                },
                {
                  value: "expense",
                  label: t("transactions.expense"),
                  icon: ArrowDownRight,
                  tone: "expense",
                },
              ].map((opt) => {
                const active = filters.type === opt.value;
                const Icon = opt.icon;
                const activeCls =
                  opt.tone === "income"
                    ? "bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-300"
                    : opt.tone === "expense"
                    ? "bg-rose-500/15 text-rose-700 ring-1 ring-rose-500/30 dark:bg-rose-500/20 dark:text-rose-300"
                    : "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white";

                return (
                  <button
                    key={opt.value || "all"}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setFilter("type", opt.value)}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                      active
                        ? activeCls
                        : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                    }`}
                  >
                    {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tombol Toggle Rentang Tanggal */}
            <button
              type="button"
              aria-expanded={datePanelOpen}
              aria-controls="tx-date-panel"
              onClick={() => setDatePanelOpen((o) => !o)}
              className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition-colors ${
                hasDateFilter || datePanelOpen
                  ? "border-primary-500/50 bg-primary-50/80 text-primary-700 dark:border-primary-500/40 dark:bg-primary-950/60 dark:text-primary-300"
                  : "border-gray-200/90 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              <Calendar className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
              <span className="tabular-nums-finance max-w-[170px] truncate">
                {dateButtonLabel}
              </span>
            </button>

            {/* Sort Compact Pill */}
            <div className="relative inline-flex items-center">
              <ArrowUpDown
                className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-gray-400"
                aria-hidden="true"
              />
              <select
                id="tx-sort"
                aria-label={t("transactions.sort_by")}
                className="min-h-[38px] cursor-pointer rounded-xl border border-gray-200/90 bg-white pl-8 pr-7 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
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
          </div>
        </div>

        {/* Panel Rentang Tanggal (Expandable + Quick Presets) */}
        {(datePanelOpen || rangeInvalid) && (
          <div
            id="tx-date-panel"
            className="border-t border-gray-100 bg-gray-50/70 px-3.5 py-3 dark:border-gray-800/80 dark:bg-gray-950/40 sm:px-4"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="tx-date-from"
                    className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
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

                <div>
                  <label
                    htmlFor="tx-date-to"
                    className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
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
              </div>

              {/* Preset Cepat (mengisi dateFrom/dateTo ke server) */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: "today", label: isEn ? "Today" : "Hari ini" },
                  { id: "7d", label: isEn ? "Last 7 days" : "7 hari" },
                  { id: "month", label: isEn ? "This month" : "Bulan ini" },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyDatePreset(preset.id)}
                    className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-primary-300 hover:text-primary-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-primary-700 dark:hover:text-primary-400"
                  >
                    {preset.label}
                  </button>
                ))}
                {hasDateFilter && (
                  <button
                    type="button"
                    onClick={clearDates}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                  >
                    {isEn ? "Clear" : "Hapus"}
                  </button>
                )}
              </div>
            </div>

            {rangeInvalid && (
              <div
                role="alert"
                className="mt-2.5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <span>{t("transactions.range_invalid")}</span>
              </div>
            )}
          </div>
        )}

        {/* Baris 2: Interactive Category Chips Strip */}
        <div className="border-t border-gray-100 px-3.5 py-2.5 dark:border-gray-800/80 sm:px-4">
          <div className="flex items-center justify-between gap-3">
            <div
              role="group"
              aria-label={t("transactions.category")}
              className="scrollbar-hide flex flex-1 items-center gap-1.5 overflow-x-auto py-0.5 sm:flex-wrap"
            >
              <button
                type="button"
                aria-pressed={!filters.categoryId}
                onClick={() => setFilter("categoryId", "")}
                className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                  !filters.categoryId
                    ? "border-primary-500 bg-primary-600 text-white shadow-sm dark:border-primary-400 dark:bg-primary-500"
                    : "border-gray-200/90 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-gray-700"
                }`}
              >
                {t("transactions.filter_category")}
              </button>

              {categories.map((c) => {
                const active = filters.categoryId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      setFilter("categoryId", active ? "" : c.id)
                    }
                    className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                      active
                        ? "border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-500/30 dark:border-primary-400 dark:bg-primary-950/70 dark:text-primary-200"
                        : "border-gray-200/90 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-gray-700 dark:hover:bg-gray-800"
                    }`}
                  >
                    <span
                      className="h-2 w-2 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: c.color || "#6366f1" }}
                      aria-hidden="true"
                    />
                    <span className="max-w-[140px] truncate">{c.name}</span>
                  </button>
                );
              })}
            </div>

            {hasFilters ? (
              <button
                type="button"
                onClick={() => {
                  setFilters(EMPTY_FILTERS);
                  setDatePanelOpen(false);
                }}
                className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  {isEn ? "Reset" : "Reset"} ({activeFilterCount})
                </span>
              </button>
            ) : (
              meta?.total !== undefined && (
                <span className="tabular-nums-finance hidden flex-shrink-0 text-xs font-medium text-gray-400 sm:inline">
                  {meta.total} {t("nav.transactions").toLowerCase()}
                </span>
              )
            )}
          </div>

          {/* Active Filter Pills (hanya muncul bila ada filter teks/kategori/tanggal) */}
          {(filters.search.trim() || selectedCategoryObj || hasDateFilter) && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-gray-100 pt-2.5 dark:border-gray-800/80">
              {filters.search.trim() && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                  <span>“{filters.search.trim()}”</span>
                  <button
                    type="button"
                    onClick={() => setFilter("search", "")}
                    aria-label={isEn ? "Remove search filter" : "Hapus filter pencarian"}
                    className="rounded hover:text-gray-950 dark:hover:text-white"
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </span>
              )}
              {selectedCategoryObj && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: selectedCategoryObj.color }}
                    aria-hidden="true"
                  />
                  <span>{selectedCategoryObj.name}</span>
                  <button
                    type="button"
                    onClick={() => setFilter("categoryId", "")}
                    aria-label={isEn ? "Remove category filter" : "Hapus filter kategori"}
                    className="rounded hover:text-gray-950 dark:hover:text-white"
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </span>
              )}
              {hasDateFilter && (
                <span className="tabular-nums-finance inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                  <Calendar className="h-3 w-3 text-gray-400" aria-hidden="true" />
                  <span>{dateButtonLabel}</span>
                  <button
                    type="button"
                    onClick={clearDates}
                    aria-label={isEn ? "Remove date filter" : "Hapus filter tanggal"}
                    className="rounded hover:text-gray-950 dark:hover:text-white"
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
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
              onAction={() => {
                setFilters(EMPTY_FILTERS);
                setDatePanelOpen(false);
              }}
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
                        if (
                          e.target === e.currentTarget &&
                          (e.key === "Enter" || e.key === " ")
                        ) {
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
                                  style={{
                                    backgroundColor: row.category.color || "#9ca3af",
                                  }}
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

                      <div className="flex flex-shrink-0 flex-col items-end gap-2">
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