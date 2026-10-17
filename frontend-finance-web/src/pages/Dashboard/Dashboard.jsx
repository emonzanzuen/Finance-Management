import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { useTranslation } from "../../hooks/useTranslation";
import { formatCurrency } from "../../utils/formatters";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  X,
} from "lucide-react";
import { gsap } from "gsap";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    getTotalIncome,
    getTotalExpense,
    getBalance,
    getRecentTransactions,
    transactions,
    goals,
    currency,
    exchangeRates,
  } = useApp();

  const cardsRef = useRef([]);
  const [isReady, setIsReady] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // ===== DATA =====
  const totalIncome = getTotalIncome();
  const totalExpense = getTotalExpense();
  const balance = getBalance();
  const recentTransactions = getRecentTransactions(5);

  // ===== DEBUG =====
  useEffect(() => {
    console.log('🔍 Dashboard Debug:');
    console.log('  balance:', balance);
    console.log('  totalIncome:', totalIncome);
    console.log('  totalExpense:', totalExpense);
    console.log('  currency:', currency);
    console.log('  exchangeRates:', exchangeRates);
  }, [balance, totalIncome, totalExpense, currency, exchangeRates]);

  // ===== ANIMASI =====
  useEffect(() => {
    setIsReady(false);
    cardsRef.current = [];

    const timer = setTimeout(() => {
      setIsReady(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const cards = cardsRef.current.filter((el) => el !== null && el !== undefined);
    if (cards.length === 0) return;

    gsap.set(cards, { opacity: 0, y: 30 });
    gsap.to(cards, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      stagger: 0.08,
      ease: "power2.out",
      clearProps: "opacity",
    });

    return () => {
      gsap.killTweensOf(cards);
    };
  }, [isReady]);

  // ===== EXPENSE DATA =====
  const expenseData = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, curr) => {
      const existing = acc.find((item) => item.name === curr.category);
      if (existing) existing.value += curr.amount;
      else acc.push({ name: curr.category, value: curr.amount });
      return acc;
    }, [])
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const totalExpenseAmount = expenseData.reduce((sum, item) => sum + item.value, 0);

  const CHART_COLORS = [
    "#818cf8", "#34d399", "#fb923c", "#f472b6", "#60a5fa", "#a78bfa"
  ];

  // ===== MONTHLY TREND (dengan bulan dari JSON) =====
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const monthIndex = (currentMonth - i + 12) % 12;
    const year = monthIndex > currentMonth ? currentYear - 1 : currentYear;
    // ✅ Rename variabel agar tidak shadow fungsi t()
    const monthTxs = transactions.filter((tx) => {
      const date = new Date(tx.date);
      return date.getMonth() === monthIndex && date.getFullYear() === year;
    });
    return {
      // ✅ Gunakan t() dengan path `common.months` dan `common.months_full`
      month: t(`common.months.${monthIndex}`),
      fullMonth: t(`common.months_full.${monthIndex}`),
      income: monthTxs.filter((tx) => tx.type === "income").reduce((s, tx) => s + tx.amount, 0),
      expense: monthTxs.filter((tx) => tx.type === "expense").reduce((s, tx) => s + tx.amount, 0),
    };
  }).reverse();

  const getStatusColor = (type) =>
    type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400";

  // ===== SUMMARY ITEMS =====
  const summaryItems = [
    {
      title: t('dashboard.balance'),
      value: balance,
      icon: Wallet,
      bg: "bg-indigo-50 dark:bg-indigo-950/40",
      text: "text-indigo-600 dark:text-indigo-400",
      detail: t('dashboard.current_balance'),
    },
    {
      title: t('dashboard.income'),
      value: totalIncome,
      icon: TrendingUp,
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      text: "text-emerald-600 dark:text-emerald-400",
      detail: t('dashboard.income'),
    },
    {
      title: t('dashboard.expense'),
      value: totalExpense,
      icon: TrendingDown,
      bg: "bg-rose-50 dark:bg-rose-950/40",
      text: "text-rose-600 dark:text-rose-400",
      detail: t('dashboard.expense'),
    },
    {
      title: t('dashboard.savings'),
      value: goals.reduce((acc, g) => acc + g.currentAmount, 0),
      icon: Target,
      bg: "bg-amber-50 dark:bg-amber-950/40",
      text: "text-amber-600 dark:text-amber-400",
      detail: t('dashboard.savings'),
    },
  ];

  // ===== HANDLER =====
  const handleCardClick = (item, index) => {
    setSelectedCard({
      ...item,
      index,
    });
  };

  const closePopup = () => {
    setSelectedCard(null);
  };

  // ===== FORMAT CURRENCY DENGAN KURS =====
  const formatCurrencyWithRate = (amount, currencyCode, rates) => {
    if (!amount || isNaN(amount)) return formatCurrency(0, currencyCode);
    const safeRates = rates || { IDR: 1, USD: 16500, EUR: 20600 };
    const rate = safeRates[currencyCode] || 1;
    const converted = currencyCode === 'IDR' ? amount : amount / rate;
    return formatCurrency(converted, currencyCode);
  };

  // ===== CUSTOM TOOLTIP PIE =====
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = totalExpenseAmount > 0 ? ((data.value / totalExpenseAmount) * 100).toFixed(1) : 0;
      return (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-4 min-w-[200px]">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].color }} />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{data.name}</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">{t('common.amount')}</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatCurrencyWithRate(data.value, currency, exchangeRates)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">{t('common.percentage')}</span>
              <span className="font-medium text-gray-900 dark:text-white">{percentage}%</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: payload[0].color }} />
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // ===== CUSTOM TOOLTIP LINE =====
  const CustomLineTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const fullMonth = payload[0]?.payload?.fullMonth || label;
      return (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-4 min-w-[200px]">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{fullMonth}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4 py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
              <span className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name === "income" ? t('dashboard.income') : t('dashboard.expense')}
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatCurrencyWithRate(entry.value, currency, exchangeRates)}
              </span>
            </div>
          ))}
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{t('common.difference')}</span>
              <span className={`font-medium ${payload[0].value - payload[1].value >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrencyWithRate(payload[0].value - payload[1].value, currency, exchangeRates)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // ===== FORMAT Y-AXIS =====
  const currencySymbols = {
    IDR: "Rp",
    USD: "$",
    EUR: "€",
  };
  const symbol = currencySymbols[currency] || "Rp";

  const formatYAxisTick = (v) => {
    if (v >= 1000000) return `${symbol}${(v / 1000000).toFixed(1)}J`;
    if (v >= 1000) return `${symbol}${(v / 1000).toFixed(0)}K`;
    return `${symbol}${v}`;
  };

  // ===== LOADING =====
  if (!transactions || !goals || !isReady) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ===== GREETING ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {t('dashboard.greeting')}, 👋
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {t(`common.months_full.${currentMonth}`)} {currentYear} — {t('dashboard.subtitle')}
          </p>
        </div>
        <div className="text-right bg-indigo-50 dark:bg-indigo-950/30 px-5 py-2 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('dashboard.current_balance')}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrencyWithRate(balance, currency, exchangeRates)}
          </p>
        </div>
      </div>

      {/* ===== SUMMARY CARDS ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryItems.map((item, idx) => (
          <div
            key={idx}
            ref={(el) => (cardsRef.current[idx] = el)}
            onClick={() => handleCardClick(item, idx)}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/70 dark:border-gray-800/70 p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {item.title}
                </p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mt-1 tracking-tight truncate">
                  {formatCurrencyWithRate(item.value, currency, exchangeRates)}
                </p>
              </div>
              <div className={`${item.bg} p-3 rounded-xl flex-shrink-0 ml-3 group-hover:scale-105 transition-transform`}>
                <item.icon className={`w-5 h-5 ${item.text}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ===== POPUP ===== */}
      {selectedCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={closePopup}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`${selectedCard.bg} p-2.5 rounded-xl`}>
                  <selectedCard.icon className={`w-5 h-5 ${selectedCard.text}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedCard.title}
                </h3>
              </div>
              <button onClick={closePopup} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="py-4">
              <p className="text-3xl font-bold text-gray-900 dark:text-white text-center">
                {formatCurrencyWithRate(selectedCard.value, currency, exchangeRates)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
                {selectedCard.detail}
              </p>
            </div>
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-2">
              <p className="text-xs text-gray-400 text-center">{t('dashboard.click_outside_to_close')}</p>
            </div>
          </div>
        </div>
      )}

      {/* ===== CHARTS ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Pengeluaran per Kategori */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/70 dark:border-gray-800/70 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t('dashboard.expense_by_category')}
            </h3>
            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
              {expenseData.length} {t('dashboard.categories')}
            </span>
          </div>
          {expenseData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {expenseData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
                  formatter={(value) => <span className="text-gray-600 dark:text-gray-400">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">
              {t('dashboard.no_transactions')}
            </div>
          )}
        </div>

        {/* Line Chart - Monthly Trend */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/70 dark:border-gray-800/70 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t('dashboard.trend_last_6_months')}
            </h3>
            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
              {monthlyData[0]?.fullMonth} – {monthlyData[monthlyData.length-1]?.fullMonth}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.4} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={formatYAxisTick}
                tick={{ fontSize: 10, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
                width={55}
              />
              <Tooltip content={<CustomLineTooltip />} />
              <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2.5} dot={{ fill: "#22c55e", strokeWidth: 0, r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2.5} dot={{ fill: "#ef4444", strokeWidth: 0, r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">{t('dashboard.income')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">{t('dashboard.expense')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== RECENT TRANSACTIONS ===== */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/70 dark:border-gray-800/70 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t('dashboard.recent_transactions')}
          </h3>
          <button
            onClick={() => navigate("/transactions")}
            className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors"
          >
            {t('dashboard.view_all')} →
          </button>
        </div>

        {recentTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left font-medium text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider py-2.5 px-3">
                    {t('transactions.date')}
                  </th>
                  <th className="text-left font-medium text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider py-2.5 px-3">
                    {t('transactions.category')}
                  </th>
                  <th className="text-left font-medium text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider py-2.5 px-3">
                    {t('transactions.description')}
                  </th>
                  <th className="text-right font-medium text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider py-2.5 px-3">
                    {t('transactions.amount')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx, idx) => (
                  <tr
                    key={tx.id}
                    className={`border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${
                      idx === recentTransactions.length - 1 ? "border-b-0" : ""
                    }`}
                  >
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400 text-xs whitespace-nowrap">
                      {new Date(tx.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium">
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400 text-xs truncate max-w-[120px]">
                      {tx.description}
                    </td>
                    <td className={`py-2.5 px-3 text-right text-xs font-medium whitespace-nowrap ${getStatusColor(tx.type)}`}>
                      <span className="flex items-center justify-end gap-1">
                        {tx.type === "income" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {formatCurrencyWithRate(tx.amount, currency, exchangeRates)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
              <Wallet className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-400 text-sm">{t('dashboard.no_transactions')}</p>
            <p className="text-gray-400 text-xs mt-0.5">{t('dashboard.start_recording')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;