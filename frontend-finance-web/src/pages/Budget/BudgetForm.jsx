import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../context/ThemeContext";
import { X, Edit, Wallet, DollarSign, Tag, Save } from "lucide-react";
import toast from "react-hot-toast";
import { formatCurrency } from "../../utils/formatters";

const BudgetForm = ({ isOpen, onClose }) => {
  const { budget, updateBudget, categories } = useApp();
  const { isDark } = useTheme();
  const [formData, setFormData] = useState({
    month: budget.month,
    year: budget.year,
    categories: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        month: budget.month,
        year: budget.year,
        categories: budget.categories.map((cat) => ({ ...cat })),
      });
      setErrors({});
    }
  }, [isOpen, budget]);

  const handleBudgetChange = (index, value) => {
    const newCategories = [...formData.categories];
    newCategories[index].budgetAmount = Number(value) || 0;
    setFormData((prev) => ({ ...prev, categories: newCategories }));
    if (errors[`cat-${index}`]) {
      setErrors((prev) => ({ ...prev, [`cat-${index}`]: "" }));
    }
  };

  const handleMonthChange = (e) => {
    setFormData((prev) => ({ ...prev, month: Number(e.target.value) }));
  };

  const handleYearChange = (e) => {
    setFormData((prev) => ({ ...prev, year: Number(e.target.value) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    let hasError = false;

    formData.categories.forEach((cat, index) => {
      if (cat.budgetAmount < 0 || isNaN(cat.budgetAmount)) {
        newErrors[`cat-${index}`] = "Jumlah tidak valid";
        hasError = true;
      }
    });

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    const data = {
      month: Number(formData.month),
      year: Number(formData.year),
      categories: formData.categories,
    };

    setTimeout(() => {
      updateBudget(data);
      setIsLoading(false);
      onClose();
    }, 500);
  };

  const closeModal = () => {
    if (!isLoading) onClose();
  };

  if (!isOpen) return null;

  const totalBudget = formData.categories.reduce((sum, cat) => sum + cat.budgetAmount, 0);
  const months = Array.from({ length: 12 }, (_, i) => i);
  const years = [2023, 2024, 2025, 2026];

  const modalContent = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
        padding: "1rem",
        animation: "fadeIn 0.2s ease-out",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
      onClick={closeModal}
    >
      <div
        style={{
          backgroundColor: isDark ? "#1f2937" : "#ffffff",
          borderRadius: "1rem",
          maxWidth: "32rem",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: isDark
            ? "0 25px 50px -12px rgba(0,0,0,0.5)"
            : "0 25px 50px -12px rgba(0,0,0,0.25)",
          border: isDark ? "1px solid #374151" : "1px solid #e5e7eb",
          animation: "scaleIn 0.25s ease-out",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
        className="scrollbar-hide"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===== HEADER ===== */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: isDark ? "1px solid #374151" : "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            backgroundColor: isDark ? "#1f2937" : "#ffffff",
            borderTopLeftRadius: "1rem",
            borderTopRightRadius: "1rem",
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                padding: "0.5rem",
                borderRadius: "0.75rem",
                backgroundColor: isDark ? "#374151" : "#eef2ff",
              }}
            >
              <Edit
                style={{
                  width: "1.25rem",
                  height: "1.25rem",
                  color: isDark ? "#818cf8" : "#4f46e5",
                }}
              />
            </div>
            <div>
              <h3
                style={{
                  fontSize: "1.125rem",
                  fontWeight: "600",
                  color: isDark ? "#f9fafb" : "#111827",
                }}
              >
                Edit Budget
              </h3>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: isDark ? "#9ca3af" : "#6b7280",
                }}
              >
                Atur alokasi budget per kategori
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            style={{
              padding: "0.5rem",
              borderRadius: "0.5rem",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: isDark ? "#9ca3af" : "#6b7280",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = isDark ? "#374151" : "#f3f4f6")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <X style={{ width: "1.25rem", height: "1.25rem" }} />
          </button>
        </div>

        {/* ===== FORM ===== */}
        <form onSubmit={handleSubmit} style={{ padding: "1.5rem" }}>
          {/* Month & Year */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
              marginBottom: "1.25rem",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: isDark ? "#e5e7eb" : "#374151",
                  marginBottom: "0.25rem",
                }}
              >
                Bulan
              </label>
              <select
                value={formData.month}
                onChange={handleMonthChange}
                style={{
                  width: "100%",
                  padding: "0.625rem 1rem",
                  border: isDark ? "1px solid #4b5563" : "1px solid #d1d5db",
                  borderRadius: "0.75rem",
                  fontSize: "0.875rem",
                  outline: "none",
                  backgroundColor: isDark ? "#374151" : "#ffffff",
                  color: isDark ? "#f9fafb" : "#111827",
                }}
              >
                {months.map((m) => (
                  <option key={m} value={m}>
                    {new Date(2024, m, 1).toLocaleDateString("id-ID", {
                      month: "long",
                    })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: isDark ? "#e5e7eb" : "#374151",
                  marginBottom: "0.25rem",
                }}
              >
                Tahun
              </label>
              <select
                value={formData.year}
                onChange={handleYearChange}
                style={{
                  width: "100%",
                  padding: "0.625rem 1rem",
                  border: isDark ? "1px solid #4b5563" : "1px solid #d1d5db",
                  borderRadius: "0.75rem",
                  fontSize: "0.875rem",
                  outline: "none",
                  backgroundColor: isDark ? "#374151" : "#ffffff",
                  color: isDark ? "#f9fafb" : "#111827",
                }}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Budget per Category */}
          <div style={{ marginBottom: "1.25rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.75rem",
              }}
            >
              <label
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: isDark ? "#e5e7eb" : "#374151",
                }}
              >
                Alokasi Budget per Kategori
              </label>
              <span
                style={{
                  fontSize: "0.75rem",
                  color: isDark ? "#9ca3af" : "#6b7280",
                }}
              >
                Total: {formatCurrency(totalBudget)}
              </span>
            </div>
            <div
              style={{
                maxHeight: "280px",
                overflowY: "auto",
                paddingRight: "0.25rem",
              }}
              className="scrollbar-hide"
            >
              {formData.categories.map((cat, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    marginBottom: "0.5rem",
                    padding: "0.5rem 0.75rem",
                    backgroundColor: isDark ? "#374151" : "#f9fafb",
                    borderRadius: "0.75rem",
                    border: isDark ? "1px solid #4b5563" : "1px solid #e5e7eb",
                  }}
                >
                  <Tag
                    style={{
                      width: "1rem",
                      height: "1rem",
                      color: isDark ? "#9ca3af" : "#6b7280",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      flex: 1,
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: isDark ? "#f9fafb" : "#111827",
                    }}
                  >
                    {cat.category}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <DollarSign
                      style={{
                        width: "1rem",
                        height: "1rem",
                        color: isDark ? "#9ca3af" : "#6b7280",
                      }}
                    />
                    <input
                      type="number"
                      value={cat.budgetAmount || ""}
                      onChange={(e) => handleBudgetChange(index, e.target.value)}
                      style={{
                        width: "100px",
                        padding: "0.375rem 0.5rem",
                        border: errors[`cat-${index}`]
                          ? "1px solid #ef4444"
                          : isDark
                          ? "1px solid #4b5563"
                          : "1px solid #d1d5db",
                        borderRadius: "0.5rem",
                        fontSize: "0.875rem",
                        outline: "none",
                        backgroundColor: isDark ? "#1f2937" : "#ffffff",
                        color: isDark ? "#f9fafb" : "#111827",
                        textAlign: "right",
                      }}
                      min="0"
                      step="1000"
                      placeholder="0"
                    />
                  </div>
                  {errors[`cat-${index}`] && (
                    <span
                      style={{
                        fontSize: "0.7rem",
                        color: "#ef4444",
                        flexShrink: 0,
                      }}
                    >
                      {errors[`cat-${index}`]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Preview Total */}
          <div
            style={{
              padding: "1rem",
              backgroundColor: isDark ? "#374151" : "#f9fafb",
              borderRadius: "0.75rem",
              border: isDark ? "1px solid #4b5563" : "1px solid #e5e7eb",
              marginBottom: "1.25rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "0.875rem",
                  color: isDark ? "#9ca3af" : "#6b7280",
                }}
              >
                Total Budget Bulanan
              </span>
              <span
                style={{
                  fontSize: "1.125rem",
                  fontWeight: "700",
                  color: isDark ? "#f9fafb" : "#111827",
                }}
              >
                {formatCurrency(totalBudget)}
              </span>
            </div>
          </div>

          {/* ===== BUTTONS ===== */}
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              paddingTop: "0.5rem",
              borderTop: isDark ? "1px solid #374151" : "1px solid #e5e7eb",
            }}
          >
            <button
              type="button"
              onClick={closeModal}
              style={{
                flex: 1,
                padding: "0.625rem",
                borderRadius: "0.75rem",
                backgroundColor: isDark ? "#4b5563" : "#e5e7eb",
                border: "none",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: "500",
                color: isDark ? "#f9fafb" : "#1f2937",
              }}
              disabled={isLoading}
            >
              Batal
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: "0.625rem",
                borderRadius: "0.75rem",
                backgroundColor: "#4f46e5",
                color: "white",
                border: "none",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span
                    style={{
                      display: "inline-block",
                      width: "1rem",
                      height: "1rem",
                      border: "2px solid white",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save style={{ width: "1rem", height: "1rem" }} />
                  Simpan Budget
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default BudgetForm;