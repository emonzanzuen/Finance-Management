import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Search, X, Receipt } from "lucide-react";
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
import { useCategories, useTransactions, useTransaction, useDeleteTransaction } from "../../hooks/queries";
import { formatCurrencyWithRate } from "../../utils/formatters";
import { formatApiDate } from "../../lib/format";
import { apiMessage } from "../../lib/apiMessage";

const LIMIT = 10;
const SORTS = {
  date_desc: { sortBy: "transactionDate", sortOrder: "desc", key: "transactions.sort_date_desc" },
  date_asc: { sortBy: "transactionDate", sortOrder: "asc", key: "transactions.sort_date_asc" },
  amount_desc: { sortBy: "amount", sortOrder: "desc", key: "transactions.sort_amount_desc" },
  amount_asc: { sortBy: "amount", sortOrder: "asc", key: "transactions.sort_amount_asc" },
};
const EMPTY_FILTERS = { type: "", categoryId: "", search: "", dateFrom: "", dateTo: "", sort: "date_desc" };

const field =
  "w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500";

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
  const rangeInvalid = filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo;
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
    [page, filters.type, filters.categoryId, search, filters.dateFrom, filters.dateTo, rangeInvalid, sort],
  );

  const { data, isLoading, isError, error, refetch, isPlaceholderData } = useTransactions(params);
  const { data: categories = [] } = useCategories(filters.type || undefined);
  const detailQuery = useTransaction(detail?.id);
  useEffect(() => { if (detailQuery.data) setDetail(detailQuery.data); }, [detailQuery.data]);

  // Kembali ke halaman 1 saat filter berubah; mundur bila halaman terakhir kosong setelah hapus.
  useEffect(() => setPage(1), [filters.type, filters.categoryId, search, filters.dateFrom, filters.dateTo, filters.sort]);
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
  const hasFilters = Object.entries(filters).some(([k, v]) => k !== "sort" && v !== "");

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
    { key: "transactionDate", label: t("transactions.date"), render: (v) => <span className="whitespace-nowrap">{formatApiDate(v, language)}</span> },
    {
      key: "description",
      label: t("transactions.description"),
      render: (v) => <span className="text-gray-800 dark:text-gray-100">{v || <span className="text-gray-400">—</span>}</span>,
    },
    {
      key: "category",
      label: t("transactions.category"),
      render: (c) => (
        <span className="inline-flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c?.color }} />
          {c?.name}
        </span>
      ),
    },
    {
      key: "amount",
      label: t("transactions.amount"),
      align: "right",
      render: (v, row) => (
        <span className={`font-semibold whitespace-nowrap ${row.type === "income" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
          {row.type === "income" ? "+" : "−"} {money(v)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (_, row) => (
        <span className="inline-flex gap-1" onClick={(e) => e.stopPropagation()}>
          <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setForm({ transaction: row })} aria-label={t("common.edit")}>
            <Pencil className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40" onClick={() => setToDelete(row)} aria-label={t("common.delete")}>
            <Trash2 className="w-4 h-4" />
          </button>
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t("transactions.title")}
        subtitle={t("transactions.subtitle")}
        icon={Receipt}
        actions={<><Link to="/scan-receipt" className="btn btn-outline"><Receipt className="w-4 h-4" />Scan nota</Link><Button icon={Plus} onClick={() => setForm({})}>{t("transactions.add")}</Button></>}
      />

      <Card className="mb-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className={`${field} pl-9`}
              placeholder={t("transactions.search_placeholder")}
              maxLength={50}
              value={filters.search}
              onChange={(e) => setFilter("search", e.target.value)}
              aria-label={t("transactions.search")}
            />
          </div>
          <select className={field} value={filters.type} onChange={(e) => setFilter("type", e.target.value)} aria-label={t("transactions.filter_type")}>
            <option value="">{t("transactions.filter_type")}: {t("common.all")}</option>
            <option value="income">{t("transactions.income")}</option>
            <option value="expense">{t("transactions.expense")}</option>
          </select>
          <select className={field} value={filters.categoryId} onChange={(e) => setFilter("categoryId", e.target.value)} aria-label={t("transactions.filter_category")}>
            <option value="">{t("transactions.filter_category")}: {t("common.all")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input type="date" className={field} value={filters.dateFrom} onChange={(e) => setFilter("dateFrom", e.target.value)} aria-label={t("transactions.date_from")} />
          <input type="date" className={field} value={filters.dateTo} onChange={(e) => setFilter("dateTo", e.target.value)} aria-label={t("transactions.date_to")} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-sm text-gray-500 dark:text-gray-400">{t("transactions.sort_by")}</label>
            <select id="sort" className={`${field} w-auto`} value={filters.sort} onChange={(e) => setFilter("sort", e.target.value)}>
              {Object.entries(SORTS).map(([k, s]) => (
                <option key={k} value={k}>{t(s.key)}</option>
              ))}
            </select>
          </div>
          {rangeInvalid && <span className="text-xs text-red-500">{t("transactions.range_invalid")}</span>}
          {hasFilters && (
            <Button size="sm" variant="ghost" icon={X} onClick={() => setFilters(EMPTY_FILTERS)}>{t("transactions.clear_filters")}</Button>
          )}
        </div>
      </Card>

      <Card padding={false}>
        {isLoading ? (
          <div className="p-5"><SkeletonLoader variant="table" /></div>
        ) : isError ? (
          <ErrorState message={apiMessage(t, error)} onRetry={refetch} retryText={t("common.retry")} />
        ) : items.length === 0 ? (
          hasFilters ? (
            <EmptyState title={t("transactions.no_results")} description="" actionText={t("transactions.clear_filters")} onAction={() => setFilters(EMPTY_FILTERS)} />
          ) : (
            <EmptyState title={t("transactions.empty")} description="" actionText={t("transactions.add_first")} onAction={() => setForm({})} />
          )
        ) : (
          <div className={`transition-opacity ${isPlaceholderData ? "opacity-60" : ""}`}>
            <Table columns={columns} data={items} onRowClick={setDetail} emptyMessage={t("transactions.empty")} />
          </div>
        )}
        {meta && items.length > 0 && (
          <div className="px-5 pb-4">
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

      {form && <TransactionForm transaction={form.transaction} onClose={() => setForm(null)} />}

      <Modal
        isOpen={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={t("transactions.detail")}
        size="sm"
        footer={
          detail && (
            <div className="flex justify-end gap-3">
              <Button variant="outline" icon={Pencil} onClick={() => { setForm({ transaction: detail }); setDetail(null); }}>{t("common.edit")}</Button>
              <Button variant="danger" icon={Trash2} onClick={() => setToDelete(detail)}>{t("common.delete")}</Button>
            </div>
          )
        }
      >
        {detail && (
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">{t("transactions.type")}</dt><dd><Badge variant={detail.type === "income" ? "success" : "danger"}>{t(`transactions.${detail.type}`)}</Badge></dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">{t("transactions.amount")}</dt><dd className="font-semibold text-gray-900 dark:text-white">{money(detail.amount)}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">{t("transactions.category")}</dt><dd className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: detail.category?.color }} />{detail.category?.name}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">{t("transactions.date")}</dt><dd>{formatApiDate(detail.transactionDate, language)}</dd></div>
            <div><dt className="text-gray-500 mb-1">{t("transactions.description")}</dt><dd className="text-gray-800 dark:text-gray-100">{detail.description || "—"}</dd></div>
          </dl>
        )}
      </Modal>

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
