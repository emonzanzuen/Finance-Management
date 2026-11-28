import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  FileSpreadsheet,
  FileText,
  PieChart as PieChartIcon,
  Receipt,
  Scale,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import PageHeader from "../../components/common/PageHeader";
import ErrorState from "../../components/common/ErrorState";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Table from "../../components/ui/Table";
import EmptyState from "../../components/ui/EmptyState";
import SkeletonLoader from "../../components/ui/SkeletonLoader";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../context/ThemeContext";
import {
  useMonthlyReport,
  useTransactions,
  useYearlyTrend,
} from "../../hooks/queries";
import { reportService } from "../../api/services/reports.js";
import { transactionService } from "../../api/services/transactions.js";
import { useTranslation } from "../../hooks/useTranslation";
import { apiMessage } from "../../lib/apiMessage";
import { formatApiDate } from "../../lib/format";
import { formatCurrencyWithRate } from "../../utils/formatters";
import { generateMonthlyReportPdf } from "../../utils/pdfReportGenerator";

const CHART_FALLBACK_COLORS = [
  "#4f46e5",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
];

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const ChartTooltip = ({ active, payload, label, formatMoney }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-200 bg-white/95 px-3.5 py-2.5 text-xs shadow-lg backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/95">
      {label && (
        <p className="mb-1.5 font-semibold text-gray-900 dark:text-white">
          {label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry, idx) => (
          <div
            key={`${entry.name}-${idx}`}
            className="flex items-center justify-between gap-4"
          >
            <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
              <span
                className="h-2 w-2 flex-shrink-0 rounded-full"
                style={{
                  backgroundColor:
                    entry.color || entry.payload?.color || entry.payload?.fill,
                }}
                aria-hidden="true"
              />
              <span>{entry.name}</span>
            </span>
            <span className="tabular-nums-finance font-semibold text-gray-900 dark:text-white">
              {formatMoney(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Reports() {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const isEn = language === "en";
  const locale = isEn ? "en-US" : "id-ID";
  const { isDark } = useTheme();
  const { currency, exchangeRates, convertCurrency } = useApp();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [exportingFormat, setExportingFormat] = useState(null); // "pdf" | "xlsx" | null
  const [exportError, setExportError] = useState("");

  const monthly = useMonthlyReport(month, year);
  const trend = useYearlyTrend(year);

  const params = useMemo(() => {
    const mm = String(month).padStart(2, "0");
    const lastDay = String(new Date(year, month, 0).getDate()).padStart(2, "0");
    return {
      page: 1,
      limit: 100,
      dateFrom: `${year}-${mm}-01`,
      dateTo: `${year}-${mm}-${lastDay}`,
      sortBy: "transactionDate",
      sortOrder: "asc",
    };
  }, [month, year]);

  const transactions = useTransactions(params);

  const money = (v) =>
    formatCurrencyWithRate(Number(v || 0), currency, exchangeRates);

  const monthLabel = (m, style = "short") =>
    new Date(year, m - 1, 1).toLocaleDateString(locale, { month: style });

  const formatCompactAxis = (val) => {
    const converted = convertCurrency(val, currency);
    return new Intl.NumberFormat(locale, {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(converted);
  };

  const exportFile = async (format) => {
    setExportError("");
    setExportingFormat(format);
    try {
      const periodStamp = `${year}-${String(month).padStart(2, "0")}`;

      if (format === "pdf") {
        // Ambil ringkasan bulanan & seluruh halaman transaksi dari backend
        const reportData =
          monthly.data ?? (await reportService.monthly(month, year));

        let allTx = transactions.data?.items ?? [];
        const totalPages = transactions.data?.meta?.totalPages ?? 1;

        if (!transactions.data) {
          const firstPage = await transactionService.list(params);
          allTx = firstPage.items ?? [];
          const pages = firstPage.meta?.totalPages ?? 1;
          for (let p = 2; p <= pages; p += 1) {
            const nextPage = await transactionService.list({ ...params, page: p });
            allTx = allTx.concat(nextPage.items ?? []);
          }
        } else if (totalPages > 1) {
          allTx = [...allTx];
          for (let p = 2; p <= totalPages; p += 1) {
            const nextPage = await transactionService.list({ ...params, page: p });
            allTx = allTx.concat(nextPage.items ?? []);
          }
        }

        const pdfBlob = generateMonthlyReportPdf({
          month,
          year,
          monthlyReport: reportData,
          transactions: allTx,
          userName: user?.name || "User",
          language,
        });
        downloadBlob(pdfBlob, `FinManage_Laporan_${periodStamp}.pdf`);
        toast.success(
          isEn
            ? "Report (PDF) downloaded."
            : "Laporan (PDF) berhasil diunduh."
        );
        return;
      }

      const res = await reportService.export({ month, year, format });
      const fallback = `FinManage_Laporan_${periodStamp}.xlsx`;
      const disposition = res.headers?.["content-disposition"] || "";
      const matched = disposition.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i)?.[1];
      const filename = matched
        ? decodeURIComponent(matched.replace(/"/g, ""))
        : fallback;
      downloadBlob(res.data, filename);
      toast.success(
        isEn
          ? "Report (XLSX) downloaded."
          : "Laporan (XLSX) berhasil diunduh."
      );
    } catch (err) {
      const message =
        apiMessage(t, err) ||
        (isEn
          ? "Failed to download the report. Please try again."
          : "Gagal mengunduh laporan. Silakan coba lagi.");
      setExportError(message);
      toast.error(message);
    } finally {
      setExportingFormat(null);
    }
  };

  const pieData = (monthly.data?.expenseByCategory ?? []).map((x, idx) => ({
    id: x.categoryId || `${x.name}-${idx}`,
    name: x.name,
    value: Number(x.amount || 0),
    percentage: Number(x.percentage || 0),
    color: x.color || CHART_FALLBACK_COLORS[idx % CHART_FALLBACK_COLORS.length],
  }));

  const incomeBarData = (monthly.data?.incomeByCategory ?? []).map((x, idx) => ({
    id: x.categoryId || `${x.name}-${idx}`,
    name: x.name,
    amount: Number(x.amount || 0),
    fill: x.color || "#10b981",
  }));

  const trendData = (trend.data?.months ?? []).map((x) => ({
    ...x,
    label: monthLabel(x.month, "short"),
  }));

  const txItems = transactions.data?.items ?? [];
  const difference = Number(monthly.data?.difference ?? 0);
  const axisTickColor = isDark ? "#9ca3af" : "#6b7280";
  const gridStrokeColor = isDark ? "#1f2937" : "#e5e7eb";
  const isExporting = Boolean(exportingFormat);

  const summaryCards = [
    {
      label: t("reports.income"),
      value: monthly.data?.income,
      icon: TrendingUp,
      iconBg:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400",
      valueClass: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: t("reports.expense"),
      value: monthly.data?.expense,
      icon: TrendingDown,
      iconBg: "bg-rose-50 text-rose-600 dark:bg-rose-950/70 dark:text-rose-400",
      valueClass: "text-rose-600 dark:text-rose-400",
    },
    {
      label: t("reports.difference"),
      value: monthly.data?.difference,
      icon: Scale,
      iconBg:
        "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400",
      valueClass:
        difference < 0
          ? "text-rose-600 dark:text-rose-400"
          : "text-indigo-600 dark:text-indigo-400",
    },
  ];

  const txColumns = [
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
      key: "description",
      label: t("transactions.description"),
      render: (v) => (
        <span className="text-gray-800 dark:text-gray-100">
          {v || <span className="text-gray-400">—</span>}
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
  ];

  return (
    <div className="space-y-5">
      {/* Header & Kontrol Periode + Ekspor */}
      <PageHeader
        title={t("reports.title")}
        subtitle={
          isEn
            ? `Monthly financial summary for ${monthLabel(month, "long")} ${year}`
            : `Ringkasan keuangan periode ${monthLabel(month, "long")} ${year}`
        }
        icon={BarChart3}
        className="mb-0"
        actions={
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <select
              aria-label={t("reports.month")}
              className="input-field w-auto min-w-[132px] pr-8"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {monthLabel(i + 1, "long")}
                </option>
              ))}
            </select>

            <select
              aria-label={t("reports.year")}
              className="input-field tabular-nums-finance w-auto min-w-[96px] pr-8"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {[year - 2, year - 1, year, year + 1].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <Button
              type="button"
              variant="outline"
              icon={FileText}
              loading={exportingFormat === "pdf"}
              disabled={isExporting}
              onClick={() => exportFile("pdf")}
            >
              {exportingFormat === "pdf"
                ? isEn
                  ? "Exporting..."
                  : "Mengunduh..."
                : `${isEn ? "Export" : "Unduh"} ${t("reports.export_pdf")}`}
            </Button>

            <Button
              type="button"
              variant="primary"
              icon={FileSpreadsheet}
              loading={exportingFormat === "xlsx"}
              disabled={isExporting}
              onClick={() => exportFile("xlsx")}
            >
              {exportingFormat === "xlsx"
                ? isEn
                  ? "Exporting..."
                  : "Mengunduh..."
                : `${isEn ? "Export" : "Unduh"} ${t("reports.export_excel")}`}
            </Button>
          </div>
        }
      />

      {/* Info & Error Ekspor */}
      {exportError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span>{exportError}</span>
        </div>
      )}

      {currency !== "IDR" && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {isEn
            ? "Note: Exported PDF and Excel files always use Indonesian Rupiah (IDR)."
            : "Catatan: Berkas laporan PDF dan Excel yang diunduh selalu menggunakan nominal Rupiah (IDR)."}
        </p>
      )}

      {/* Error Laporan Bulanan */}
      {monthly.isError && (
        <Card padding={false}>
          <ErrorState
            message={
              apiMessage(t, monthly.error) ||
              (isEn ? "Failed to load monthly report." : "Gagal memuat laporan bulanan.")
            }
            onRetry={() => monthly.refetch()}
            retryText={t("common.retry")}
          />
        </Card>
      )}

      {/* Ringkasan & Grafik Bulanan */}
      {monthly.isLoading ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonLoader key={i} variant="card" />
            ))}
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            <SkeletonLoader variant="chart" />
            <SkeletonLoader variant="chart" />
          </div>
        </div>
      ) : (
        !monthly.isError && (
          <div
            className={`space-y-5 transition-opacity duration-200 ${
              monthly.isFetching ? "opacity-75" : ""
            }`}
          >
            {/* 3 Kartu Ringkasan */}
            <section
              aria-label={t("reports.title")}
              className="grid gap-4 sm:grid-cols-3"
            >
              {summaryCards.map(({ label, value, icon: Icon, iconBg, valueClass }) => (
                <Card key={label} hover className="p-4 sm:p-5">
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
                    title={money(value)}
                  >
                    {money(value)}
                  </p>
                </Card>
              ))}
            </section>

            {/* Grafik Pengeluaran & Pemasukan per Kategori */}
            <div className="grid gap-5 xl:grid-cols-2">
              {/* Pengeluaran per Kategori */}
              <Card className="p-5">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div>
                    <h3 className="section-title">
                      {t("reports.expense_by_category")}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {monthLabel(month, "long")} {year}
                    </p>
                  </div>
                  {pieData.length > 0 && (
                    <span className="tabular-nums-finance rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      {pieData.length} {t("dashboard.categories")}
                    </span>
                  )}
                </div>

                {pieData.length > 0 ? (
                  <div className="grid items-center gap-4 sm:grid-cols-12">
                    <div
                      className="h-56 w-full sm:col-span-5"
                      role="img"
                      aria-label={t("reports.expense_by_category")}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={48}
                            outerRadius={78}
                            paddingAngle={pieData.length > 1 ? 2 : 0}
                            stroke="none"
                          >
                            {pieData.map((x) => (
                              <Cell key={x.id} fill={x.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<ChartTooltip formatMoney={money} />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <ul className="max-h-56 space-y-2 overflow-y-auto pr-1 sm:col-span-7">
                      {pieData.map((entry) => (
                        <li
                          key={entry.id}
                          className="flex items-center justify-between gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span
                              className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                              style={{ backgroundColor: entry.color }}
                              aria-hidden="true"
                            />
                            <span
                              className="truncate text-sm font-medium text-gray-800 dark:text-gray-200"
                              title={entry.name}
                            >
                              {entry.name}
                            </span>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className="tabular-nums-finance text-sm font-semibold leading-tight text-gray-900 dark:text-white">
                              {money(entry.value)}
                            </p>
                            <p className="tabular-nums-finance mt-0.5 text-[11px] font-medium leading-tight text-gray-500 dark:text-gray-400">
                              {entry.percentage.toFixed(1)}%
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <EmptyState
                    icon={PieChartIcon}
                    title={
                      isEn
                        ? "No expense categories"
                        : "Belum ada pengeluaran per kategori"
                    }
                    description={
                      isEn
                        ? "No expenses recorded for the selected month."
                        : "Tidak ada pengeluaran yang tercatat pada bulan terpilih."
                    }
                    className="py-10"
                  />
                )}
              </Card>

              {/* Pemasukan per Kategori */}
              <Card className="p-5">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div>
                    <h3 className="section-title">
                      {t("reports.income_by_category")}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {monthLabel(month, "long")} {year}
                    </p>
                  </div>
                  {incomeBarData.length > 0 && (
                    <span className="tabular-nums-finance rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      {incomeBarData.length} {t("dashboard.categories")}
                    </span>
                  )}
                </div>

                {incomeBarData.length > 0 ? (
                  <div
                    className="h-64 w-full"
                    role="img"
                    aria-label={t("reports.income_by_category")}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={incomeBarData}
                        margin={{ top: 8, right: 12, left: 0, bottom: 4 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke={gridStrokeColor}
                        />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: axisTickColor, fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                          dy={6}
                        />
                        <YAxis
                          tick={{ fill: axisTickColor, fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                          width={54}
                          tickFormatter={formatCompactAxis}
                        />
                        <Tooltip content={<ChartTooltip formatMoney={money} />} />
                        <Bar
                          dataKey="amount"
                          name={t("reports.income")}
                          radius={[6, 6, 0, 0]}
                          maxBarSize={44}
                        >
                          {incomeBarData.map((x) => (
                            <Cell key={x.id} fill={x.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState
                    icon={BarChart3}
                    title={
                      isEn
                        ? "No income categories"
                        : "Belum ada pemasukan per kategori"
                    }
                    description={
                      isEn
                        ? "No income recorded for the selected month."
                        : "Tidak ada pemasukan yang tercatat pada bulan terpilih."
                    }
                    className="py-10"
                  />
                )}
              </Card>
            </div>
          </div>
        )
      )}

      {/* Tren Tahunan 12 Bulan */}
      <Card className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="section-title">
              {t("reports.monthly_trend").replace("{year}", String(year))}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("dashboard.income_vs_expense")}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-medium text-gray-600 dark:text-gray-300">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full bg-emerald-500"
                aria-hidden="true"
              />
              {t("reports.income")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full bg-rose-500"
                aria-hidden="true"
              />
              {t("reports.expense")}
            </span>
          </div>
        </div>

        {trend.isLoading ? (
          <SkeletonLoader variant="chart" />
        ) : trend.isError ? (
          <ErrorState
            message={
              apiMessage(t, trend.error) ||
              (isEn ? "Failed to load yearly trend." : "Gagal memuat tren tahunan.")
            }
            onRetry={() => trend.refetch()}
            retryText={t("common.retry")}
          />
        ) : trendData.length > 0 ? (
          <div
            className="h-64 w-full sm:h-72"
            role="img"
            aria-label={t("reports.monthly_trend").replace("{year}", String(year))}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={trendData}
                margin={{ top: 8, right: 12, left: 0, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={gridStrokeColor}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: axisTickColor, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  dy={6}
                />
                <YAxis
                  tick={{ fill: axisTickColor, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={54}
                  tickFormatter={formatCompactAxis}
                />
                <Tooltip content={<ChartTooltip formatMoney={money} />} />
                <Bar
                  dataKey="income"
                  name={t("reports.income")}
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="expense"
                  name={t("reports.expense")}
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState
            icon={BarChart3}
            title={isEn ? "No trend data" : "Belum ada data tren"}
            description={
              isEn
                ? `No financial records available for ${year}.`
                : `Belum ada catatan keuangan untuk tahun ${year}.`
            }
            className="py-10"
          />
        )}
      </Card>

      {/* Daftar Transaksi Bulan Terpilih */}
      <Card padding={false}>
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800/80">
          <div>
            <h3 className="section-title">{t("reports.transaction_details")}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {monthLabel(month, "long")} {year}
            </p>
          </div>
          {!transactions.isLoading && !transactions.isError && txItems.length > 0 && (
            <span className="tabular-nums-finance rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              {txItems.length} {t("nav.transactions").toLowerCase()}
            </span>
          )}
        </div>

        {transactions.isLoading ? (
          <div className="p-5">
            <SkeletonLoader variant="table" />
          </div>
        ) : transactions.isError ? (
          <ErrorState
            message={
              apiMessage(t, transactions.error) ||
              (isEn ? "Failed to load transactions." : "Gagal memuat transaksi.")
            }
            onRetry={() => transactions.refetch()}
            retryText={t("common.retry")}
          />
        ) : txItems.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={t("reports.no_data")}
            description={
              isEn
                ? `No transactions recorded in ${monthLabel(month, "long")} ${year}.`
                : `Tidak ada transaksi yang tercatat pada ${monthLabel(month, "long")} ${year}.`
            }
            className="py-10"
          />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table
                columns={txColumns}
                data={txItems}
                emptyMessage={t("reports.no_data")}
                className="rounded-none border-0"
              />
            </div>

            {/* Mobile List */}
            <ul
              aria-label={t("reports.transaction_details")}
              className="divide-y divide-gray-100 dark:divide-gray-800/80 md:hidden"
            >
              {txItems.map((tx) => {
                const isIncome = tx.type === "income";
                return (
                  <li
                    key={tx.id}
                    className="flex items-start justify-between gap-3 p-4"
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
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                          {tx.description || tx.category?.name || "—"}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                          {tx.category?.name && (
                            <span className="inline-flex items-center gap-1.5">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{
                                  backgroundColor: tx.category.color || "#9ca3af",
                                }}
                                aria-hidden="true"
                              />
                              <span>{tx.category.name}</span>
                            </span>
                          )}
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums-finance">
                            {formatApiDate(tx.transactionDate, language)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p
                      className={`tabular-nums-finance flex-shrink-0 whitespace-nowrap text-sm font-semibold ${
                        isIncome
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {isIncome ? "+" : "−"} {money(tx.amount)}
                    </p>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Card>
    </div>
  );
}