import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../../context/AppContext";
import { formatCurrency } from "../../utils/formatters";
import GoalForm from "./GoalForm";
import { Plus, Target, Trophy, Edit, Trash2, TrendingUp } from "lucide-react";
import { gsap } from "gsap";

const SavingsGoals = () => {
  const { goals, deleteGoal, updateGoalProgress } = useApp();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [deposit, setDeposit] = useState({});
  const [isLoading, setIsLoading] = useState({});
  const cardsRef = useRef([]);

  // ===== ANIMASI GSAP =====
  useEffect(() => {
    // Tunggu hingga DOM benar-benar siap
    const timer = setTimeout(() => {
      try {
        const cards = cardsRef.current.filter((el) => el !== null);
        if (cards.length > 0) {
          // Reset opacity dan transform terlebih dahulu
          gsap.set(cards, { opacity: 0, y: 30 });
          gsap.to(cards, {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.08,
            ease: "power2.out",
            clearProps: "opacity", // Hapus inline style setelah selesai
          });
        }
      } catch (error) {
        console.warn("GSAP animation error:", error);
        // Fallback: tampilkan semua card tanpa animasi
        const cards = cardsRef.current.filter((el) => el !== null);
        cards.forEach((el) => {
          if (el) el.style.opacity = 1;
          if (el) el.style.transform = "translateY(0)";
        });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [goals.length]); // Jalankan ulang saat jumlah goals berubah

  // ===== HANDLER FUNCTIONS =====
  const handleEdit = (g) => {
    setEditingGoal(g);
    setIsFormOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus target ini?")) {
      deleteGoal(id);
    }
  };

  const handleAdd = () => {
    setEditingGoal(null);
    setIsFormOpen(true);
  };

  const handleClose = () => {
    setIsFormOpen(false);
    setEditingGoal(null);
  };

  const handleDeposit = (id) => {
    const amount = Number(deposit[id] || 0);
    if (amount <= 0) {
      alert("Masukkan jumlah yang valid!");
      return;
    }
    setIsLoading((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      updateGoalProgress(id, amount);
      setDeposit((prev) => ({ ...prev, [id]: "" }));
      setIsLoading((prev) => ({ ...prev, [id]: false }));
    }, 300);
  };

  // ===== DATA =====
  const totalSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  const totalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  // ===== RENDER =====
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Target Tabungan
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            {goals.length} target · Total terkumpul {formatCurrency(totalSaved)}
          </p>
        </div>
        <button onClick={handleAdd} className="btn btn-primary">
          <Plus className="w-4 h-4" /> Tambah Target
        </button>
      </div>

      {/* OVERALL PROGRESS */}
      {goals.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/70 dark:border-gray-800/70 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Total Progress Seluruh Target
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {overallProgress.toFixed(0)}%
            </span>
          </div>
          <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
              style={{ width: `${Math.min(overallProgress, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-400">
            <span>0%</span>
            <span>{formatCurrency(totalSaved)} terkumpul</span>
            <span>100%</span>
          </div>
        </div>
      )}

      {/* GOALS GRID */}
      {goals.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/70 dark:border-gray-800/70 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-400 text-sm">Belum ada target tabungan</p>
          <p className="text-gray-400 text-xs mt-0.5">Mulai buat target pertama Anda!</p>
          <button onClick={handleAdd} className="btn btn-primary mt-4">
            <Plus className="w-4 h-4" /> Buat Target Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map((goal, index) => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100;
            const completed = progress >= 100;
            const isNearLimit = progress >= 80 && progress < 100;

            return (
              <div
                key={goal.id}
                ref={(el) => (cardsRef.current[index] = el)}
                className="goal-card bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/70 dark:border-gray-800/70 p-5 shadow-sm hover:shadow-md transition-all duration-200"
                style={{ opacity: 1, transform: "translateY(0)" }} // fallback
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2.5 rounded-xl flex-shrink-0 ${
                        completed
                          ? "bg-emerald-50 dark:bg-emerald-950/40"
                          : isNearLimit
                          ? "bg-amber-50 dark:bg-amber-950/40"
                          : "bg-indigo-50 dark:bg-indigo-950/40"
                      }`}
                    >
                      {completed ? (
                        <Trophy className="w-5 h-5 text-emerald-500" />
                      ) : isNearLimit ? (
                        <Target className="w-5 h-5 text-amber-500" />
                      ) : (
                        <Target className="w-5 h-5 text-indigo-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                        {goal.title}
                      </h4>
                      {goal.deadline && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Target: {new Date(goal.deadline).toLocaleDateString("id-ID")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-0.5 flex-shrink-0 ml-2">
                    <button
                      onClick={() => handleEdit(goal)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      {formatCurrency(goal.currentAmount)}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      dari {formatCurrency(goal.targetAmount)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        completed
                          ? "bg-emerald-500"
                          : isNearLimit
                          ? "bg-amber-500"
                          : "bg-indigo-500"
                      }`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm mt-1.5">
                    <span
                      className={`font-medium ${
                        completed
                          ? "text-emerald-500"
                          : isNearLimit
                          ? "text-amber-500"
                          : "text-indigo-500"
                      }`}
                    >
                      {progress.toFixed(0)}%
                    </span>
                    {completed && <span className="badge badge-success">Selesai! 🎉</span>}
                    {isNearLimit && !completed && (
                      <span className="badge badge-warning">Hampir selesai!</span>
                    )}
                  </div>
                </div>

                {!completed && (
                  <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <input
                      type="number"
                      value={deposit[goal.id] || ""}
                      onChange={(e) =>
                        setDeposit((prev) => ({ ...prev, [goal.id]: e.target.value }))
                      }
                      placeholder="Tambahkan..."
                      className="flex-1 input-field py-1.5 text-sm"
                      min="0"
                      step="1000"
                      disabled={isLoading[goal.id]}
                    />
                    <button
                      onClick={() => handleDeposit(goal.id)}
                      className="btn btn-primary btn-sm"
                      disabled={isLoading[goal.id]}
                    >
                      {isLoading[goal.id] ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        "Tambah"
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL */}
      <GoalForm
        isOpen={isFormOpen}
        onClose={handleClose}
        editingGoal={editingGoal}
      />
    </div>
  );
};

export default SavingsGoals;