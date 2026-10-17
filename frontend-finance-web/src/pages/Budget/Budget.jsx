import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../../context/AppContext";
import { formatCurrency } from "../../utils/formatters";
import BudgetForm from "./BudgetForm";
import { Edit, AlertCircle, TrendingUp, TrendingDown, Wallet, Percent } from "lucide-react";
import { gsap } from "gsap";

const Budget = () => {
  const { budget, updateBudget, transactions } = useApp();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const summaryRef = useRef(null);
  const progressRef = useRef(null);
  const categoriesRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const month = budget.month,
      year = budget.year;
    const updated = budget.categories.map((cat) => {
      const spent = transactions
        .filter(
          (t) =>
            t.type === "expense" &&
            t.category === cat.category &&
            new Date(t.date).getMonth() === month &&
            new Date(t.date).getFullYear() === year
        )
        .reduce((sum, t) => sum + t.amount, 0);
      return { ...cat, spentAmount: spent };
    });
    if (JSON.stringify(updated) !== JSON.stringify(budget.categories)) {
      updateBudget({ ...budget, categories: updated });
    }
  }, [transactions, budget, updateBudget]);

  // Animasi saat mount - dengan pengecekan aman
  useEffect(() => {
    // Tandai siap setelah render pertama
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    // Beri waktu untuk DOM merender
    const timer = setTimeout(() => {
      try {
        // Animasi summary cards
        if (summaryRef.current) {
          gsap.from(summaryRef.current, {
            opacity: 0,
            y: 20,
            duration: 0.5,
            stagger: 0.1,
            ease: "power2.out",
          });
        }

        // Animasi progress
        if (progressRef.current) {
          gsap.from(progressRef.current, {
            opacity: 0,
            y: 20,
            duration: 0.6,
            ease: "power2.out",
            delay: 0.3,
          });
        }

        // Animasi categories
        if (categoriesRef.current) {
          gsap.from(categoriesRef.current, {
            opacity: 0,
            y: 20,
            duration: 0.6,
            ease: "power2.out",
            delay: 0.5,
          });
        }
      } catch (error) {
        console.warn("GSAP animation error:", error);
        // Animasi gagal, tapi konten tetap muncul
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [isReady]);

  const totalBudget = budget.categories.reduce((s, c) => s + c.budgetAmount, 0);
  const totalSpent = budget.categories.reduce((s, c) => s + c.spentAmount, 0);
  const remaining = totalBudget - totalSpent;
  const progress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Kategori dengan pengeluaran tertinggi
  const topCategory = budget.categories.reduce(
    (max, cat) => (cat.spentAmount > max.spentAmount ? cat : max),
    budget.categories[0] || { category: "", spentAmount: 0 }
  );

  return (
    <div className="space-y-6">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Budget Bulanan
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            {new Date(budget.year, budget.month).toLocaleDateString("id-ID", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <button onClick={() => setIsFormOpen(true)} className="btn btn-primary">
          <Edit className="w-4 h-4" /> Edit Budget
        </button>
      </div>

      {/* ===== SUMMARY CARDS ===== */}
      <div ref={summaryRef} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            title: "Total Budget",
            value: totalBudget,
            icon: Wallet,
            color: "text-indigo-600 dark:text-indigo-400",
            bg: "bg-indigo-50 dark:bg-indigo-950/40",
          },
          {
            title: "Total Pengeluaran",
            value: totalSpent,
            icon: TrendingDown,
            color: "text-rose-600 dark:text-rose-400",
            bg: "bg-rose-50 dark:bg-rose-950/40",
          },
          {
            title: "Sisa Budget",
            value: remaining,
            icon: TrendingUp,
            color: remaining >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
            bg: remaining >= 0 ? "bg-emerald-50 dark:bg-emerald-950/40" : "bg-rose-50 dark:bg-rose-950/40",
          },
        ].map((item, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/70 dark:border-gray-800/70 p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {item.title}
                </p>
                <p className={`text-xl lg:text-2xl font-bold mt-1 ${item.color}`}>
                  {formatCurrency(item.value)}
                </p>
              </div>
              <div className={`${item.bg} p-3 rounded-xl`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ===== PROGRESS ===== */}
      <div ref={progressRef} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/70 dark:border-gray-800/70 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Penggunaan Budget
          </span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {progress.toFixed(1)}%
          </span>
        </div>
        <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              progress > 90 ? "bg-rose-500" : progress > 70 ? "bg-amber-500" : "bg-emerald-500"
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
        {progress > 90 && (
          <div className="flex items-center gap-2 mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/50">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm text-amber-700 dark:text-amber-300">
              Budget hampir habis! Perhatikan pengeluaran Anda.
            </span>
          </div>
        )}
        {topCategory && topCategory.spentAmount > 0 && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Kategori dengan pengeluaran tertinggi:
              <span className="font-semibold text-gray-900 dark:text-white ml-1">
                {topCategory.category}
              </span>
              <span className="ml-2 text-gray-600 dark:text-gray-300">
                {formatCurrency(topCategory.spentAmount)}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* ===== CATEGORIES BREAKDOWN ===== */}
      <div ref={categoriesRef} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/70 dark:border-gray-800/70 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Rincian per Kategori
          </h3>
          <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
            {budget.categories.length} kategori
          </span>
        </div>
        <div className="space-y-4">
          {budget.categories.map((cat, i) => {
            const prog = cat.budgetAmount > 0 ? (cat.spentAmount / cat.budgetAmount) * 100 : 0;
            const isOver = cat.spentAmount > cat.budgetAmount;
            const isNearLimit = prog > 80 && prog <= 100;
            const statusColor = isOver
              ? "text-rose-600 dark:text-rose-400"
              : isNearLimit
              ? "text-amber-600 dark:text-amber-400"
              : "text-emerald-600 dark:text-emerald-400";
            const barColor = isOver
              ? "bg-rose-500"
              : isNearLimit
              ? "bg-amber-500"
              : "bg-indigo-500";

            return (
              <div key={i} className="group">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {cat.category}
                    </span>
                    {isOver && (
                      <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
                        ⚠️ Over
                      </span>
                    )}
                    {isNearLimit && !isOver && (
                      <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                        ⚠️ Hampir habis
                      </span>
                    )}
                  </div>
                  <span className="text-gray-500 dark:text-gray-400">
                    {formatCurrency(cat.spentAmount)} / {formatCurrency(cat.budgetAmount)}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${Math.min(prog, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">
                  <span>{formatCurrency(cat.spentAmount)} terpakai</span>
                  <span>{prog.toFixed(0)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== MODAL ===== */}
      <BudgetForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </div>
  );
};

export default Budget;