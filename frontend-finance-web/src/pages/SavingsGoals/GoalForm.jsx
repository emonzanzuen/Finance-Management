import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../context/ThemeContext";
import { formatCurrency } from "../../utils/formatters";
import { X, Target, Calendar, DollarSign, Save } from "lucide-react";

const GoalForm = ({ isOpen, onClose, editingGoal = null }) => {
  const { addGoal, editGoal } = useApp();
  const { isDark } = useTheme();
  const [formData, setFormData] = useState({
    title: "",
    targetAmount: "",
    deadline: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingGoal) {
        setFormData({
          title: editingGoal.title,
          targetAmount: editingGoal.targetAmount.toString(),
          deadline: editingGoal.deadline || "",
        });
      } else {
        setFormData({
          title: "",
          targetAmount: "",
          deadline: "",
        });
      }
      setErrors({});
    }
  }, [isOpen, editingGoal]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Nama target harus diisi";
    if (!formData.targetAmount || Number(formData.targetAmount) <= 0)
      newErrors.targetAmount = "Target harus lebih dari 0";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    const data = {
      title: formData.title.trim(),
      targetAmount: Number(formData.targetAmount),
      deadline: formData.deadline || undefined,
    };

    setTimeout(() => {
      if (editingGoal) {
        editGoal(editingGoal.id, data);
      } else {
        addGoal(data);
      }
      setIsLoading(false);
      onClose();
    }, 500);
  };

  if (!isOpen) return null;

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
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: isDark ? "#1f2937" : "#ffffff",
          borderRadius: "1rem",
          maxWidth: "28rem",
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
        {/* Header */}
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
              <Target
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
                {editingGoal ? "Edit Target" : "Buat Target Tabungan"}
              </h3>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: isDark ? "#9ca3af" : "#6b7280",
                }}
              >
                {editingGoal ? "Perbarui target tabungan" : "Tentukan target tabungan baru"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
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

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: "1.5rem" }}>
          {/* Nama Target */}
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "500",
                color: isDark ? "#e5e7eb" : "#374151",
                marginBottom: "0.25rem",
              }}
            >
              Nama Target
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Contoh: Liburan ke Bali"
              style={{
                width: "100%",
                padding: "0.625rem 1rem",
                border: errors.title
                  ? "1px solid #ef4444"
                  : isDark
                  ? "1px solid #4b5563"
                  : "1px solid #d1d5db",
                borderRadius: "0.75rem",
                fontSize: "0.875rem",
                outline: "none",
                backgroundColor: isDark ? "#374151" : "#ffffff",
                color: isDark ? "#f9fafb" : "#111827",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6366f1")}
              onBlur={(e) => {
                if (!errors.title)
                  e.currentTarget.style.borderColor = isDark ? "#4b5563" : "#d1d5db";
              }}
            />
            {errors.title && (
              <p style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "0.25rem" }}>
                {errors.title}
              </p>
            )}
          </div>

          {/* Target Jumlah */}
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.875rem",
                fontWeight: "500",
                color: isDark ? "#e5e7eb" : "#374151",
                marginBottom: "0.25rem",
              }}
            >
              <DollarSign style={{ width: "1rem", height: "1rem" }} />
              Target Jumlah
            </label>
            <input
              type="number"
              name="targetAmount"
              value={formData.targetAmount}
              onChange={handleChange}
              placeholder="Masukkan target jumlah"
              min="0"
              step="1000"
              style={{
                width: "100%",
                padding: "0.625rem 1rem",
                border: errors.targetAmount
                  ? "1px solid #ef4444"
                  : isDark
                  ? "1px solid #4b5563"
                  : "1px solid #d1d5db",
                borderRadius: "0.75rem",
                fontSize: "0.875rem",
                outline: "none",
                backgroundColor: isDark ? "#374151" : "#ffffff",
                color: isDark ? "#f9fafb" : "#111827",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6366f1")}
              onBlur={(e) => {
                if (!errors.targetAmount)
                  e.currentTarget.style.borderColor = isDark ? "#4b5563" : "#d1d5db";
              }}
            />
            {errors.targetAmount && (
              <p style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "0.25rem" }}>
                {errors.targetAmount}
              </p>
            )}
          </div>

          {/* Deadline (Opsional) */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.875rem",
                fontWeight: "500",
                color: isDark ? "#e5e7eb" : "#374151",
                marginBottom: "0.25rem",
              }}
            >
              <Calendar style={{ width: "1rem", height: "1rem" }} />
              Deadline <span style={{ color: "#9ca3af", fontWeight: "400" }}>(Opsional)</span>
            </label>
            <input
              type="date"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
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
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6366f1")}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = isDark ? "#4b5563" : "#d1d5db";
              }}
            />
          </div>

          {/* Preview */}
          {formData.title && formData.targetAmount && (
            <div
              style={{
                padding: "1rem",
                backgroundColor: isDark ? "#374151" : "#f9fafb",
                borderRadius: "0.75rem",
                border: isDark ? "1px solid #4b5563" : "1px solid #e5e7eb",
                marginBottom: "1.25rem",
              }}
            >
              <p
                style={{
                  fontSize: "0.75rem",
                  color: isDark ? "#9ca3af" : "#6b7280",
                  fontWeight: "500",
                  marginBottom: "0.25rem",
                }}
              >
                Preview
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: isDark ? "#f9fafb" : "#111827",
                    }}
                  >
                    {formData.title}
                  </p>
                  {formData.deadline && (
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: isDark ? "#9ca3af" : "#6b7280",
                      }}
                    >
                      Deadline:{" "}
                      {new Date(formData.deadline).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>
                <p
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: "700",
                    color: isDark ? "#f9fafb" : "#111827",
                  }}
                >
                  {formatCurrency(Number(formData.targetAmount) || 0)}
                </p>
              </div>
            </div>
          )}

          {/* Buttons */}
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
              onClick={onClose}
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
                  {editingGoal ? "Menyimpan..." : "Membuat..."}
                </>
              ) : (
                <>
                  <Save style={{ width: "1rem", height: "1rem" }} />
                  {editingGoal ? "Simpan Target" : "Buat Target"}
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

export default GoalForm;