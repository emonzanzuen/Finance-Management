import React, { useState, useRef } from "react";
import { useApp } from "../../context/AppContext";
import { formatCurrency, getMonthName } from "../../utils/formatters";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  FileText,
  Download,
  X,
} from "lucide-react";
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
import toast from "react-hot-toast";

const Reports = () => {
  const { transactions } = useApp();
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedPopup, setSelectedPopup] = useState(null);
  const printRef = useRef(null);

  // ===== FILTER DATA =====
  const filtered = transactions.filter(
    (t) => new Date(t.date).getMonth() === month && new Date(t.date).getFullYear() === year
  );

  const totalIncome = filtered.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const expenseByCat = filtered
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => {
      const existing = acc.find((item) => item.name === t.category);
      if (existing) existing.value += t.amount;
      else acc.push({ name: t.category, value: t.amount });
      return acc;
    }, [])
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const totalExpenseAmount = expenseByCat.reduce((sum, item) => sum + item.value, 0);

  const incomeByCat = filtered
    .filter((t) => t.type === "income")
    .reduce((acc, t) => {
      const existing = acc.find((item) => item.name === t.category);
      if (existing) existing.value += t.amount;
      else acc.push({ name: t.category, value: t.amount });
      return acc;
    }, []);

  const totalIncomeAmount = incomeByCat.reduce((sum, item) => sum + item.value, 0);

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const t = transactions.filter(
      (tx) => new Date(tx.date).getMonth() === i && new Date(tx.date).getFullYear() === year
    );
    return {
      month: getMonthName(i).slice(0, 3),
      fullMonth: getMonthName(i),
      income: t.filter((tx) => tx.type === "income").reduce((s, tx) => s + tx.amount, 0),
      expense: t.filter((tx) => tx.type === "expense").reduce((s, tx) => s + tx.amount, 0),
    };
  });

  // ===== CHART COLORS =====
  const CHART_COLORS = [
    "#818cf8", "#34d399", "#fb923c", "#f472b6", "#60a5fa", "#a78bfa", "#f87171", "#fbbf24"
  ];

  // ===== CUSTOM TOOLTIP UNTUK PIE CHART =====
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
              <span className="text-gray-500 dark:text-gray-400">Nilai</span>
              <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(data.value)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Persentase</span>
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

  // ===== CUSTOM TOOLTIP UNTUK BAR CHART =====
  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = totalIncomeAmount > 0 ? ((data.value / totalIncomeAmount) * 100).toFixed(1) : 0;
      return (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-4 min-w-[200px]">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{label}</p>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Nilai</span>
              <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(data.value)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Persentase</span>
              <span className="font-medium text-gray-900 dark:text-white">{percentage}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // ===== CUSTOM TOOLTIP UNTUK LINE CHART =====
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
                {entry.name === "income" ? "Pemasukan" : "Pengeluaran"}
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(entry.value)}</span>
            </div>
          ))}
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Selisih</span>
              <span className={`font-medium ${payload[0].value - payload[1].value >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(payload[0].value - payload[1].value)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // ===== EXPORT FUNCTIONS =====
  const exportPDF = () => {
    toast.success("Mempersiapkan PDF...");
    // Simulasi export PDF dengan print
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const exportExcel = () => {
    toast.success("Mempersiapkan Excel...");
    // Simulasi export Excel dengan CSV
    const headers = "Tanggal,Kategori,Deskripsi,Tipe,Jumlah\n";
    const rows = filtered.map(t => 
      `${new Date(t.date).toLocaleDateString("id-ID")},${t.category},${t.description},${t.type === "income" ? "Pemasukan" : "Pengeluaran"},${t.amount}`
    ).join("\n");
    const csv = headers + rows;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `laporan_keuangan_${getMonthName(month)}_${year}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success("Excel berhasil diunduh!");
  };

  // ===== HANDLER UNTUK POPUP CHART =====
  const handleChartClick = (data, type) => {
    setSelectedPopup({ data, type });
  };

  const closePopup = () => {
    setSelectedPopup(null);
  };

  return (
    <div className="space-y-6">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Laporan Keuangan
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Analisis keuangan per bulan
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportPDF} className="btn btn-secondary btn-sm">
            <FileText className="w-4 h-4" /> PDF
          </button>
          <button onClick={exportExcel} className="btn btn-secondary btn-sm">
            <Download className="w-4 h-4" /> Excel
          </button>
        </div>
      </div>

      {/* ===== FILTERS ===== */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/70 dark:border-gray-800/70 p-5 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Bulan
          </label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="input-field mt-1"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>
                {getMonthName(i)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Tahun
          </label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="input-field mt-1"
          >
            {[2023, 2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ===== SUMMARY ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { title: "Pemasukan", value: totalIncome, icon: TrendingUp, color: "text-emerald-600 dark:text-emerald-400" },
          { title: "Pengeluaran", value: totalExpense, icon: TrendingDown, color: "text-rose-600 dark:text-rose-400" },
          { title: "Selisih", value: balance, icon: Wallet, color: balance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400" },
        ].map((item, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/70 dark:border-gray-800/70 p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {item.title}
            </p>
            <p className={`text-xl lg:text-2xl font-bold mt-1 ${item.color}`}>
              {formatCurrency(item.value)}
            </p>
          </div>
        ))}
      </div>

      {/* ===== CHARTS ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Pengeluaran per Kategori */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/70 dark:border-gray-800/70 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Pengeluaran per Kategori
            </h3>
            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
              {expenseByCat.length} kategori
            </span>
          </div>
          {expenseByCat.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={expenseByCat}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  onClick={(data) => handleChartClick(data, "expense")}
                >
                  {expenseByCat.map((entry, idx) => (
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
                  formatter={(value) => (
                    <span className="text-gray-600 dark:text-gray-400">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">
              Belum ada data pengeluaran
            </div>
          )}
        </div>

        {/* Bar Chart - Pemasukan per Kategori */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/70 dark:border-gray-800/70 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Pemasukan per Kategori
            </h3>
            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
              {incomeByCat.length} kategori
            </span>
          </div>
          {incomeByCat.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={incomeByCat}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.4} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(v) => {
                    if (v >= 1000000) return `Rp${(v / 1000000).toFixed(1)}J`;
                    if (v >= 1000) return `Rp${(v / 1000).toFixed(0)}K`;
                    return `Rp${v}`;
                  }}
                  tick={{ fontSize: 10, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  width={55}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="value" fill="#34d399" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">
              Belum ada data pemasukan
            </div>
          )}
        </div>
      </div>

      {/* ===== MONTHLY TREND ===== */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/70 dark:border-gray-800/70 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Tren Bulanan {year}
          </h3>
          <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
            12 bulan
          </span>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.4} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={(v) => {
                if (v >= 1000000) return `Rp${(v / 1000000).toFixed(1)}J`;
                if (v >= 1000) return `Rp${(v / 1000).toFixed(0)}K`;
                return `Rp${v}`;
              }}
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
            <span className="text-xs text-gray-500 dark:text-gray-400">Pemasukan</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Pengeluaran</span>
          </div>
        </div>
      </div>

      {/* ===== TRANSACTION DETAILS ===== */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/70 dark:border-gray-800/70 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
          Detail Transaksi
        </h3>
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">Tidak ada transaksi bulan ini</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left font-medium text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider py-2.5 px-3">
                    Tanggal
                  </th>
                  <th className="text-left font-medium text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider py-2.5 px-3">
                    Kategori
                  </th>
                  <th className="text-left font-medium text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider py-2.5 px-3">
                    Deskripsi
                  </th>
                  <th className="text-right font-medium text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider py-2.5 px-3">
                    Jumlah
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400 text-xs">
                      {new Date(t.date).toLocaleDateString("id-ID")}
                    </td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400 text-xs">{t.category}</td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400 text-xs">{t.description}</td>
                    <td
                      className={`py-2.5 px-3 text-right text-xs font-medium ${
                        t.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {t.type === "income" ? "+" : "-"} {formatCurrency(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== POPUP DETAIL CHART ===== */}
      {selectedPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={closePopup}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedPopup.type === "expense" ? "Pengeluaran" : "Pemasukan"} - {selectedPopup.data.name}
              </h3>
              <button onClick={closePopup} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="py-3 text-center">
              <p className="text-4xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(selectedPopup.data.value)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {selectedPopup.type === "expense" ? "Kategori Pengeluaran" : "Kategori Pemasukan"}
              </p>
            </div>
            <div className="border-t border-gray-100 dark:border-gray-800 my-3" />
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex justify-between">
                <span>Kategori</span>
                <span className="font-medium">{selectedPopup.data.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Total {selectedPopup.type === "expense" ? "Pengeluaran" : "Pemasukan"}</span>
                <span className="font-medium">{formatCurrency(selectedPopup.data.value)}</span>
              </div>
              <div className="flex justify-between">
                <span>Persentase</span>
                <span className="font-medium">
                  {selectedPopup.type === "expense"
                    ? ((selectedPopup.data.value / totalExpenseAmount) * 100).toFixed(1)
                    : ((selectedPopup.data.value / totalIncomeAmount) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-4">
              <p className="text-xs text-gray-400 text-center">Klik di luar untuk menutup</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;