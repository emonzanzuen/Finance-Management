import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDownRight, ArrowUpRight, RefreshCw, Target, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useApp } from "../../context/AppContext";
import { useDashboard } from "../../hooks/queries";
import { useTranslation } from "../../hooks/useTranslation";
import { formatApiDate } from "../../lib/format";
import { formatCurrencyWithRate } from "../../utils/formatters";

export default function Dashboard() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { currency, exchangeRates } = useApp();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const { data, isLoading, isError, error, refetch, isFetching } = useDashboard(month, year);
  const money = (value) => formatCurrencyWithRate(Number(value || 0), currency, exchangeRates);
  const monthLabel = (m) => new Date(year, m - 1, 1).toLocaleDateString(language === "id" ? "id-ID" : "en-US", { month: "short" });
  const toneClass = { indigo: "text-indigo-500", emerald: "text-emerald-500", rose: "text-rose-500", amber: "text-amber-500" };
  const stats = [
    [t("dashboard.balance"), data?.balance, Wallet, "indigo"],
    [t("dashboard.income"), data?.income, TrendingUp, "emerald"],
    [t("dashboard.expense"), data?.expense, TrendingDown, "rose"],
    [t("dashboard.savings"), data?.totalSavings, Target, "amber"],
  ];
  const trend = (data?.trend ?? []).map((item) => ({ ...item, label: monthLabel(item.month) }));
  const pieData = (data?.expenseByCategory ?? []).map((item) => ({ name: item.name, value: Number(item.amount), color: item.color }));
  const insights = data?.insights ?? [];

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t("nav.dashboard")}</h2><p className="text-sm text-gray-500">Ringkasan keuangan dari akun Anda</p></div>
      <div className="flex items-center gap-2">
        <select className="input" value={month} onChange={(e) => setMonth(Number(e.target.value))}>{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{monthLabel(i + 1)}</option>)}</select>
        <select className="input" value={year} onChange={(e) => setYear(Number(e.target.value))}>{[year - 1, year, year + 1].map((y) => <option key={y}>{y}</option>)}</select>
        <button className="btn btn-outline" onClick={() => refetch()} disabled={isFetching} aria-label="Muat ulang"><RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} /></button>
      </div>
    </div>
    {isError && <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error?.message || "Gagal memuat dashboard."}<button className="ml-3 underline" onClick={() => refetch()}>Coba lagi</button></div>}
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([label, amount, Icon, color]) => <div key={label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"><div className="flex items-center justify-between"><span className="text-sm text-gray-500">{label}</span><Icon className={`h-5 w-5 ${toneClass[color]}`} /></div><p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{isLoading ? "…" : money(amount)}</p></div>)}</div>
    {insights.length > 0 && <section className="grid gap-3 sm:grid-cols-2">{insights.map((item, i) => <div key={`${item.type}-${i}`} className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100">{item.type === "expense_change" ? `Pengeluaran ${item.direction === "up" ? "naik" : item.direction === "down" ? "turun" : "tetap"} ${Number(item.percent || 0).toFixed(1)}% dibanding bulan sebelumnya.` : item.type === "top_category" ? `Kategori pengeluaran terbesar: ${item.name || item.categoryName || "—"}.` : item.type === "budgets_near_limit" ? `Ada ${item.count ?? "beberapa"} anggaran yang mendekati batas.` : "Ada insight baru pada catatan keuangan Anda."}</div>)}</section>}
    <div className="grid gap-5 xl:grid-cols-2">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"><h3 className="mb-4 font-semibold">Pemasukan dan pengeluaran 6 bulan</h3>{trend.length ? <div className="h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={trend}><XAxis dataKey="label" /><YAxis tickFormatter={(v) => new Intl.NumberFormat("id-ID", { notation: "compact" }).format(v)} /><Tooltip formatter={(v) => money(v)} /><Line type="monotone" dataKey="income" name={t("dashboard.income")} stroke="#10b981" strokeWidth={3} /><Line type="monotone" dataKey="expense" name={t("dashboard.expense")} stroke="#ef4444" strokeWidth={3} /></LineChart></ResponsiveContainer></div> : <p className="py-16 text-center text-sm text-gray-500">Belum ada data tren.</p>}</section>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"><h3 className="mb-4 font-semibold">Pengeluaran per kategori</h3>{pieData.length ? <div className="h-72"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} dataKey="value" nameKey="name" outerRadius={95} label>{pieData.map((entry, i) => <Cell key={i} fill={entry.color || ["#4f46e5", "#10b981", "#f59e0b", "#ef4444"][i % 4]} />)}</Pie><Tooltip formatter={(v) => money(v)} /></PieChart></ResponsiveContainer></div> : <p className="py-16 text-center text-sm text-gray-500">Belum ada pengeluaran pada bulan ini.</p>}</section>
    </div>
    <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"><div className="mb-4 flex items-center justify-between"><h3 className="font-semibold">Transaksi terbaru</h3><button className="text-sm text-primary-600" onClick={() => navigate("/transactions")}>Lihat semua</button></div>{(data?.recentTransactions ?? []).length ? <div className="divide-y divide-gray-100 dark:divide-gray-800">{data.recentTransactions.map((tx) => <div key={tx.id} className="flex items-center justify-between gap-4 py-3"><div className="min-w-0"><p className="truncate font-medium">{tx.description || tx.category?.name || "Transaksi"}</p><p className="text-xs text-gray-500">{tx.category?.name} · {formatApiDate(tx.transactionDate, language)}</p></div><p className={`whitespace-nowrap font-semibold ${tx.type === "income" ? "text-emerald-600" : "text-rose-600"}`}>{tx.type === "income" ? <ArrowUpRight className="mr-1 inline h-4 w-4" /> : <ArrowDownRight className="mr-1 inline h-4 w-4" />}{money(tx.amount)}</p></div>)}</div> : <p className="py-10 text-center text-sm text-gray-500">Belum ada transaksi.</p>}</section>
  </div>;
}
