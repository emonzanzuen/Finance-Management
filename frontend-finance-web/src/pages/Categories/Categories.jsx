import React, { useState } from "react";
import ReactDOM from "react-dom";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../context/ThemeContext";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Tag,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

const Categories = () => {
  // ✅ Gunakan fungsi dari context (dengan toast)
  const { categories, addCategory, editCategory, deleteCategory } = useApp();
  const { isDark } = useTheme();

  // ===== STATE =====
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "expense",
    color: "#6366f1",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // ===== PREDEFINED COLORS =====
  const colorOptions = [
    "#6366f1", "#22c55e", "#ef4444", "#f59e0b",
    "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6",
    "#f97316", "#06b6d4", "#84cc16", "#a855f7",
  ];

  // ===== MODAL HANDLERS =====
  const openModal = (category = null) => {
    if (category) {
      setEditingId(category.id);
      setFormData({
        name: category.name,
        type: category.type,
        color: category.color || "#6366f1",
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        type: "expense",
        color: "#6366f1",
      });
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // ===== SUBMIT =====
  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Nama kategori harus diisi";
    if (!formData.type) newErrors.type = "Tipe harus dipilih";
    if (!formData.color) newErrors.color = "Warna harus dipilih";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    const data = {
      name: formData.name.trim(),
      type: formData.type,
      color: formData.color,
    };

    setTimeout(() => {
      if (editingId) {
        // ✅ Pakai editCategory dari context (ada toast)
        editCategory(editingId, data);
      } else {
        // ✅ Pakai addCategory dari context (ada toast)
        addCategory(data);
      }
      setIsLoading(false);
      closeModal();
    }, 500);
  };

  // ===== DELETE =====
  const handleDelete = (id, name) => {
    if (window.confirm(`Hapus kategori "${name}"?`)) {
      // ✅ Pakai deleteCategory dari context (ada toast)
      deleteCategory(id);
    }
  };

  // ===== MODAL =====
  const modal = isModalOpen && ReactDOM.createPortal(
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
              {editingId ? (
                <Edit style={{ width: "1.25rem", height: "1.25rem", color: isDark ? "#818cf8" : "#4f46e5" }} />
              ) : (
                <Tag style={{ width: "1.25rem", height: "1.25rem", color: isDark ? "#818cf8" : "#4f46e5" }} />
              )}
            </div>
            <div>
              <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: isDark ? "#f9fafb" : "#111827" }}>
                {editingId ? "Edit Kategori" : "Tambah Kategori"}
              </h3>
              <p style={{ fontSize: "0.75rem", color: isDark ? "#9ca3af" : "#6b7280" }}>
                {editingId ? "Perbarui data kategori" : "Tambahkan kategori baru"}
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
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isDark ? "#374151" : "#f3f4f6")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <X style={{ width: "1.25rem", height: "1.25rem" }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", fontWeight: "500", color: isDark ? "#e5e7eb" : "#374151", marginBottom: "0.25rem" }}>
              <Tag style={{ width: "1rem", height: "1rem", color: isDark ? "#9ca3af" : "#6b7280" }} />
              Nama Kategori
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Contoh: Makanan, Transportasi, dll"
              style={{
                width: "100%",
                padding: "0.625rem 1rem",
                border: errors.name ? "1px solid #ef4444" : isDark ? "1px solid #4b5563" : "1px solid #d1d5db",
                borderRadius: "0.75rem",
                fontSize: "0.875rem",
                outline: "none",
                backgroundColor: isDark ? "#374151" : "#ffffff",
                color: isDark ? "#f9fafb" : "#111827",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6366f1")}
              onBlur={(e) => {
                if (!errors.name) e.currentTarget.style.borderColor = isDark ? "#4b5563" : "#d1d5db";
              }}
            />
            {errors.name && <p style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "0.25rem" }}>{errors.name}</p>}
          </div>

          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", fontWeight: "500", color: isDark ? "#e5e7eb" : "#374151", marginBottom: "0.25rem" }}>
              <DollarSign style={{ width: "1rem", height: "1rem", color: isDark ? "#9ca3af" : "#6b7280" }} />
              Tipe
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "0.625rem 1rem",
                border: errors.type ? "1px solid #ef4444" : isDark ? "1px solid #4b5563" : "1px solid #d1d5db",
                borderRadius: "0.75rem",
                fontSize: "0.875rem",
                outline: "none",
                backgroundColor: isDark ? "#374151" : "#ffffff",
                color: isDark ? "#f9fafb" : "#111827",
              }}
            >
              <option value="expense">Pengeluaran</option>
              <option value="income">Pemasukan</option>
            </select>
            {errors.type && <p style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "0.25rem" }}>{errors.type}</p>}
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: isDark ? "#e5e7eb" : "#374151", marginBottom: "0.5rem" }}>
              Warna
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, color }))}
                  style={{
                    width: "2rem",
                    height: "2rem",
                    borderRadius: "50%",
                    backgroundColor: color,
                    border: formData.color === color
                      ? isDark ? "2px solid #818cf8" : "2px solid #4f46e5"
                      : isDark ? "2px solid #374151" : "2px solid #e5e7eb",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    transform: formData.color === color ? "scale(1.1)" : "scale(1)",
                    outline: "none",
                  }}
                  onMouseEnter={(e) => {
                    if (formData.color !== color) e.currentTarget.style.transform = "scale(1.05)";
                  }}
                  onMouseLeave={(e) => {
                    if (formData.color !== color) e.currentTarget.style.transform = "scale(1)";
                  }}
                />
              ))}
              <input
                type="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
                style={{
                  width: "2rem",
                  height: "2rem",
                  borderRadius: "50%",
                  border: isDark ? "2px solid #374151" : "2px solid #e5e7eb",
                  cursor: "pointer",
                  padding: "0",
                  background: "transparent",
                }}
              />
            </div>
            {errors.color && <p style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "0.25rem" }}>{errors.color}</p>}
          </div>

          {/* Preview */}
          {formData.name && (
            <div style={{
              padding: "1rem",
              backgroundColor: isDark ? "#374151" : "#f9fafb",
              borderRadius: "0.75rem",
              border: isDark ? "1px solid #4b5563" : "1px solid #e5e7eb",
              marginTop: "0.5rem",
            }}>
              <p style={{ fontSize: "0.75rem", color: isDark ? "#9ca3af" : "#6b7280", fontWeight: "500", marginBottom: "0.25rem" }}>Preview</p>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div
                  style={{
                    width: "2.5rem",
                    height: "2.5rem",
                    borderRadius: "0.75rem",
                    backgroundColor: formData.color + "20",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: "1rem",
                      height: "1rem",
                      borderRadius: "50%",
                      backgroundColor: formData.color,
                    }}
                  />
                </div>
                <div>
                  <p style={{ fontSize: "0.875rem", fontWeight: "500", color: isDark ? "#f9fafb" : "#111827" }}>
                    {formData.name || "Nama Kategori"}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: isDark ? "#9ca3af" : "#6b7280" }}>
                    {formData.type === "income" ? "Pemasukan" : "Pengeluaran"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.5rem", borderTop: isDark ? "1px solid #374151" : "1px solid #e5e7eb", marginTop: "0.5rem" }}>
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
                  <span style={{ display: "inline-block", width: "1rem", height: "1rem", border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  {editingId ? "Menyimpan..." : "Menambahkan..."}
                </>
              ) : (
                editingId ? "Simpan Kategori" : "Tambah Kategori"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );

  // ===== CSS ANIMATION =====
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.95) translateY(10px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }
  `;
  if (!document.getElementById("category-animations")) {
    styleSheet.id = "category-animations";
    document.head.appendChild(styleSheet);
  }

  // ===== RENDER =====
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Kategori</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Kelola kategori pemasukan dan pengeluaran</p>
        </div>
        <button onClick={() => openModal()} className="btn btn-primary">
          <Plus className="w-4 h-4" /> Tambah Kategori
        </button>
      </div>

      {/* Income Categories */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/70 dark:border-gray-800/70 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40">
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Pemasukan</h3>
          <span className="ml-auto text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
            {categories.income.length} kategori
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {categories.income.length === 0 ? (
            <p className="col-span-full text-sm text-gray-400 text-center py-4">Belum ada kategori pemasukan</p>
          ) : (
            categories.income.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                onEdit={() => openModal(cat)}
                onDelete={() => handleDelete(cat.id, cat.name)}
                isDark={isDark}
              />
            ))
          )}
        </div>
      </div>

      {/* Expense Categories */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/70 dark:border-gray-800/70 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40">
            <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Pengeluaran</h3>
          <span className="ml-auto text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
            {categories.expense.length} kategori
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {categories.expense.length === 0 ? (
            <p className="col-span-full text-sm text-gray-400 text-center py-4">Belum ada kategori pengeluaran</p>
          ) : (
            categories.expense.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                onEdit={() => openModal(cat)}
                onDelete={() => handleDelete(cat.id, cat.name)}
                isDark={isDark}
              />
            ))
          )}
        </div>
      </div>

      {modal}
    </div>
  );
};

// ===== CATEGORY CARD COMPONENT =====
const CategoryCard = ({ category, onEdit, onDelete, isDark }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.75rem 1rem",
        backgroundColor: isDark ? "#374151" : "#f9fafb",
        borderRadius: "0.75rem",
        border: isDark ? "1px solid #4b5563" : "1px solid #e5e7eb",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = isDark ? "#818cf8" : "#6366f1";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isDark ? "#4b5563" : "#e5e7eb";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
        <div
          style={{
            width: "0.75rem",
            height: "0.75rem",
            borderRadius: "50%",
            backgroundColor: category.color || "#6366f1",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: "0.875rem",
            fontWeight: "500",
            color: isDark ? "#f9fafb" : "#111827",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {category.name}
        </span>
      </div>
      <div style={{ display: "flex", gap: "0.25rem", flexShrink: 0 }}>
        <button
          onClick={onEdit}
          style={{
            padding: "0.25rem",
            borderRadius: "0.375rem",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: isDark ? "#9ca3af" : "#6b7280",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isDark ? "#4b5563" : "#e5e7eb")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <Edit style={{ width: "0.875rem", height: "0.875rem" }} />
        </button>
        <button
          onClick={onDelete}
          style={{
            padding: "0.25rem",
            borderRadius: "0.375rem",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#ef4444",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isDark ? "#450a0a" : "#fef2f2")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <Trash2 style={{ width: "0.875rem", height: "0.875rem" }} />
        </button>
      </div>
    </div>
  );
};

export default Categories;