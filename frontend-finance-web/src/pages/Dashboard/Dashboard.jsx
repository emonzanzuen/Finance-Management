import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  PieChart as PieChartIcon,
  RefreshCw,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import SkeletonLoader from "../../components/ui/SkeletonLoader";
import PageHeader from "../../components/common/PageHeader";
import ErrorState from "../../components/common/ErrorState";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../context/ThemeContext";
import { useDashboard } from "../../hooks/queries";
import { useTranslation } from "../../hooks/useTranslation";
import { apiMessage } from "../../lib/apiMessage";
import { formatApiDate } from "../../lib/format";
import { formatCurrencyWithRate } from "../../utils/formatters";

const PIE_FALLBACK_COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const ChartTooltip = ({ active, payload, label, formatMoney }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-200 bg-white/95 px-3.5 py-2.5 text-xs shadow-lg backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/95">
      {label && (
        <p className="mb-1.5 font-semibold text-gray-900 dark:text-white">{label}</p>
      )}
      <div className="space-y-1">
        {payload.map((entry, idx) => (
          <div key={`${entry.name}-${idx}`} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
              <span
                className="h-2 w-2 flex-shrink-0 rounded-full"
                style={{ backgroundColor: entry.color || entry.payload?.color }}
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

export default function Dashboard() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const isEn = language === "en";
  const locale = isEn ? "en-US" : "id-ID";
  const { isDark } = useTheme();
  const { currency, exchangeRates, convertCurrency } = useApp();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data, isLoading, isError, error, refetch, isFetching } = useDashboard(month, year);

  const money = (value) => formatCurrencyWithRate(Number(value || 0), currency, exchangeRates);

  const monthLabel = (m, style = "short") =>
    new Date(year, m - 1, 1).toLocaleDateString(locale, { month: style });

  const formatCompactAxis = (val) => {
    const converted = convertCurrency(val, currency);
    return new Intl.NumberFormat(locale, {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(converted);
  };

  const stats = [
    {
      label: t("dashboard.balance"),
      amount: data?.balance,
      icon: Wallet,
      iconBg: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400",
      valueClass: "text-gray-900 dark:text-white",
    },
    {
      label: t("dashboard.income"),
      amount: data?.income,
      icon: TrendingUp,
      iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400",
      valueClass: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: t("dashboard.expense"),
      amount: data?.expense,
      icon: TrendingDown,
      iconBg: "bg-rose-50 text-rose-600 dark:bg-rose-950/70 dark:text-rose-400",
      valueClass: "text-rose-600 dark:text-rose-400",
    },
    {
      label: t("dashboard.savings"),
      amount: data?.totalSavings,
      icon: Target,
      iconBg: "bg-amber-50 text-amber-600 dark:bg-amber-950/70 dark:text-amber-400",
      valueClass: "text-gray-900 dark:text-white",
    },
  ];

  const trend = (data?.trend ?? []).map((item) => ({
    ...item,
    label: monthLabel(item.month, "short"),
  }));

  const pieData = (data?.expenseByCategory ?? []).map((item, idx) => ({
    id: item.categoryId || `${item.name}-${idx}`,
    name: item.name,
    value: Number(item.amount || 0),
    percentage: Number(item.percentage || 0),
    color: item.color || PIE_FALLBACK_COLORS[idx % PIE_FALLBACK_COLORS.length],
  }));

  const recentTransactions = data?.recentTransactions ?? [];
  const insights = data?.insights ?? [];

  const getInsightMeta = (item) => {
    if (item.type === "expense_change") {
      const pct = Number(item.percent || 0).toFixed(1);
      const isUp = item.direction === "up";
      const isDown = item.direction === "down";
      return {
        icon: isUp ? TrendingUp : TrendingDown,
        tone: isUp
          ? "border-amber-200/90 bg-amber-50/80 text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/25 dark:text-amber-100"
          : "border-emerald-200/90 bg-emerald-50/80 text-emerald-900 dark:border-emerald-900/70 dark:bg-emerald-950/25 dark:text-emerald-100",
        iconTone: isUp
          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
        text: isEn
          ? `Expenses ${isUp ? "increased" : isDown ? "decreased" : "stayed flat"} by ${pct}% compared to the previous month.`
          : `Pengeluaran ${isUp ? "naik" : isDown ? "turun" : "tetap"} ${pct}% dibanding bulan sebelumnya.`,
      };
    }

    if (item.type === "top_category") {
      const catName = item.name || item.categoryName || "—";
      return {
        icon: PieChartIcon,
        tone: "border-indigo-200/90 bg-indigo-50/70 text-indigo-950 dark:border-indigo-900/70 dark:bg-indigo-950/25 dark:text-indigo-100",
        iconTone: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
        text: isEn
          ? `Top spending category: ${catName}.`
          : `Kategori pengeluaran terbesar: ${catName}.`,
      };
    }

    if (item.type === "budgets_near_limit") {
      const count = item.count ?? (isEn ? "several" : "beberapa");
      return {
        icon: AlertTriangle,
        tone: "border-rose-200/90 bg-rose-50/80 text-rose-900 dark:border-rose-900/70 dark:bg-rose-950/25 dark:text-rose-100",
        iconTone: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300",
        text: isEn
          ? `${count} budget(s) are approaching their limit.`
          : `Ada ${count} anggaran yang mendekati batas.`,
      };
    }

    return {
      icon: Sparkles,
      tone: "border-gray-200/90 bg-gray-50 text-gray-800 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200",
      iconTone: "bg-gray-200/80 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
      text: isEn
        ? "There is a new insight in your financial records."
        : "Ada insight baru pada catatan keuangan Anda.",
    };
  };

  const axisTickColor = isDark ? "#9ca3af" : "#6b7280";
  const gridStrokeColor = isDark ? "#1f2937" : "#e5e7eb";

  return (
    <div className="space-y-5">
      {/* Header & Filter Periode */}
      <PageHeader
        title={t("nav.dashboard")}
        subtitle={
          isEn
            ? `Financial summary for ${monthLabel(month, "long")} ${year}`
            : `Ringkasan keuangan periode ${monthLabel(month, "long")} ${year}`
        }
        className="mb-0"
        actions={
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <select
              aria-label={t("reports.month")}
              className="input-field w-auto min-w-[128px] pr-8"
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
              {[year - 1, year, year + 1].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <Button
              type="button"
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
              aria-label={isEn ? "Refresh dashboard" : "Muat ulang dashboard"}
              aria-busy={isFetching}
              className="px-3"
            >
              <RefreshCw
                className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
            </Button>
          </div>
        }
      />

      {/* State Error */}
      {isError && (
        <Card padding={false}>
          <ErrorState
            message={apiMessage(t, error) || (isEn ? "Failed to load dashboard." : "Gagal memuat dashboard.")}
            onRetry={() => refetch()}
            retryText={t("common.retry")}
          />
        </Card>
      )}

      {/* State Loading Awal */}
      {isLoading ? (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonLoader key={i} variant="card" />
            ))}
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            <SkeletonLoader variant="chart" />
            <SkeletonLoader variant="chart" />
          </div>
          <SkeletonLoader variant="table" />
        </div>
      ) : (
        !isError && (
          <div className={`space-y-5 transition-opacity duration-200 ${isFetching ? "opacity-75" : ""}`}>
            {/* Kartu Ringkasan Utama: label & ikon di atas, nominal full-width agar tidak terpotong di zoom 100% */}
            <section
              aria-label={isEn ? "Financial summary cards" : "Kartu ringkasan keuangan"}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
              {stats.map(({ label, amount, icon: Icon, iconBg, valueClass }) => (
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
                    title={money(amount)}
                  >
                    {money(amount)}
                  </p>
                </Card>
              ))}
            </section>

            {/* Insights dari Backend */}
            {insights.length > 0 && (
              <section
                aria-label={isEn ? "Financial insights" : "Insight keuangan"}
                className="grid gap-3 md:grid-cols-2"
              >
                {insights.map((item, i) => {
                  const meta = getInsightMeta(item);
                  const InsightIcon = meta.icon;
                  return (
                    <div
                      key={`${item.type}-${i}`}
                      className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-sm ${meta.tone}`}
                    >
                      <div
                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${meta.iconTone}`}
                        aria-hidden="true"
                      >
                        <InsightIcon className="h-4 w-4" />
                      </div>
                      <p className="font-medium leading-snug">{meta.text}</p>
                    </div>
                  );
                })}
              </section>
            )}

            {/* Grafik Tren & Kategori */}
            <div className="grid gap-5 xl:grid-cols-2">
              {/* Tren 6 Bulan */}
              <Card className="p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="section-title">{t("dashboard.trend_last_6_months")}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t("dashboard.income_vs_expense")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-medium text-gray-600 dark:text-gray-300">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden="true" />
                      {t("dashboard.income")}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-500" aria-hidden="true" />
                      {t("dashboard.expense")}
                    </span>
                  </div>
                </div>

                {trend.length > 0 ? (
                  <div
                    className="h-64 w-full sm:h-72"
                    role="img"
                    aria-label={t("dashboard.trend_last_6_months")}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={trend}
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
                        <Line
                          type="monotone"
                          dataKey="income"
                          name={t("dashboard.income")}
                          stroke="#10b981"
                          strokeWidth={2.5}
                          dot={{ r: 3.5, strokeWidth: 2 }}
                          activeDot={{ r: 5 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="expense"
                          name={t("dashboard.expense")}
                          stroke="#ef4444"
                          strokeWidth={2.5}
                          dot={{ r: 3.5, strokeWidth: 2 }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState
                    icon={BarChart3}
                    title={isEn ? "No trend data yet" : "Belum ada data tren"}
                    description={
                      isEn
                        ? "Add transactions to see your 6-month income and expense trend."
                        : "Catat transaksi untuk melihat tren pemasukan dan pengeluaran 6 bulan."
                    }
                    className="py-10"
                  />
                )}
              </Card>

              {/* Pengeluaran per Kategori */}
              <Card className="p-5">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div>
                    <h3 className="section-title">{t("dashboard.expense_by_category")}</h3>
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
                      className="h-52 w-full sm:col-span-5"
                      role="img"
                      aria-label={t("dashboard.expense_by_category")}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={48}
                            outerRadius={76}
                            paddingAngle={pieData.length > 1 ? 2 : 0}
                            stroke="none"
                          >
                            {pieData.map((entry) => (
                              <Cell key={entry.id} fill={entry.color} />
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
                      isEn ? "No expenses this month" : "Belum ada pengeluaran bulan ini"
                    }
                    description={
                      isEn
                        ? "Expense categories will appear once you record an expense."
                        : "Rincian kategori akan muncul setelah Anda mencatat pengeluaran."
                    }
                    className="py-10"
                  />
                )}
              </Card>
            </div>

            {/* Transaksi Terbaru */}
            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="section-title">{t("dashboard.recent_transactions")}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {isEn
                      ? "Latest recorded activity from your account"
                      : "Aktivitas terbaru yang tercatat pada akun Anda"}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  icon={ArrowRight}
                  iconPosition="right"
                  onClick={() => navigate("/transactions")}
                  className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  {t("dashboard.view_all")}
                </Button>
              </div>

              {recentTransactions.length > 0 ? (
                <ul className="divide-y divide-gray-100 dark:divide-gray-800/80">
                  {recentTransactions.map((tx) => {
                    const isIncome = tx.type === "income";
                    return (
                      <li
                        key={tx.id}
                        className="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-1"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${
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
                              {tx.description || tx.category?.name || t("nav.transactions")}
                            </p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                              {tx.category?.name && (
                                <span className="inline-flex items-center gap-1.5">
                                  {tx.category?.color && (
                                    <span
                                      className="h-2 w-2 rounded-full"
                                      style={{ backgroundColor: tx.category.color }}
                                      aria-hidden="true"
                                    />
                                  )}
                                  <span>{tx.category.name}</span>
                                </span>
                              )}
                              {tx.category?.name && <span aria-hidden="true">·</span>}
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
              ) : (
                <EmptyState
                  title={t("dashboard.no_transactions")}
                  description={t("dashboard.start_recording")}
                  actionText={t("transactions.add")}
                  onAction={() => navigate("/transactions")}
                  className="py-10"
                />
              )}
            </Card>
          </div>
        )
      )}
    </div>
  );
}