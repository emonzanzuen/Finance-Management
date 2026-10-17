import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../context/ThemeContext";
import {
  Plus,
  Search,
  X,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Tag,
  FileText,
  DollarSign,
  ArrowUpDown,
} from "lucide-react";

const Transactions = () => {
  const { transactions, categories, addTransaction, editTransaction, deleteTransaction } = useApp();
  const { isDark } = useTheme();

  // ===== STATE =====
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "expense",
    category: "",
    amount: "",
    description: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, filterCategory]);

  // ===== FILTER & SORT =====
  const allCategories = [...categories.income, ...categories.expense];

  const filtered = transactions
    .filter((t) => {
      const matchSearch =
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = filterType === "all" || t.type === filterType;
      const matchCategory = filterCategory === "all" || t.category === filterCategory;
      return matchSearch && matchType && matchCategory;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return sortOrder === "desc"
          ? new Date(b.date) - new Date(a.date)
          : new Date(a.date) - new Date(b.date);
      }
      if (sortBy === "amount") {
        return sortOrder === "desc" ? b.amount - a.amount : a.amount - b.amount;
      }
      return 0;
    });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // ===== CRUD HANDLERS =====
  const openModal = (transaction = null) => {
    if (transaction) {
      setEditingId(transaction.id);
      setFormData({
        date: transaction.date,
        type: transaction.type,
        category: transaction.category,
        amount: transaction.amount.toString(),
        description: transaction.description,
      });
    } else {
      setEditingId(null);
      setFormData({
        date: new Date().toISOString().split("T")[0],
        type: "expense",
        category: "",
        amount: "",
        description: "",
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.date) newErrors.date = "Tanggal harus diisi";
    if (!formData.type) newErrors.type = "Tipe harus dipilih";
    if (!formData.category) newErrors.category = "Kategori harus dipilih";
    if (!formData.amount || Number(formData.amount) <= 0)
      newErrors.amount = "Jumlah harus lebih dari 0";
    if (!formData.description.trim()) newErrors.description = "Deskripsi harus diisi";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    const data = {
      date: formData.date,
      type: formData.type,
      category: formData.category,
      amount: Number(formData.amount),
      description: formData.description.trim(),
    };

    setTimeout(() => {
      if (editingId) {
        editTransaction(editingId, data);
      } else {
        addTransaction(data);
      }
      setIsLoading(false);
      closeModal();
    }, 500);
  };

  const handleDelete = (id) => {
    if (window.confirm("Hapus transaksi ini?")) {
      deleteTransaction(id);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterType("all");
    setFilterCategory("all");
    setSortBy("date");
    setSortOrder("desc");
  };

  const hasActiveFilters =
    searchTerm !== "" ||
    filterType !== "all" ||
    filterCategory !== "all" ||
    sortBy !== "date" ||
    sortOrder !== "desc";

  // ===== MODAL CONTENT (Portal + Inline Style + Tema) =====
  const modalContent = isModalOpen ? ReactDOM.createPortal(
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
                <Plus style={{ width: "1.25rem", height: "1.25rem", color: isDark ? "#818cf8" : "#4f46e5" }} />
              )}
            </div>
            <div>
              <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: isDark ? "#f9fafb" : "#111827" }}>
                {editingId ? "Edit Transaksi" : "Tambah Transaksi"}
              </h3>
              <p style={{ fontSize: "0.75rem", color: isDark ? "#9ca3af" : "#6b7280" }}>
                {editingId ? "Perbarui data transaksi" : "Isi data transaksi baru"}
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", fontWeight: "500", color: isDark ? "#e5e7eb" : "#374151", marginBottom: "0.25rem" }}>
                <Calendar style={{ width: "1rem", height: "1rem", color: isDark ? "#9ca3af" : "#6b7280" }} />
                Tanggal
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.625rem 1rem",
                  border: errors.date ? "1px solid #ef4444" : isDark ? "1px solid #4b5563" : "1px solid #d1d5db",
                  borderRadius: "0.75rem",
                  fontSize: "0.875rem",
                  outline: "none",
                  backgroundColor: isDark ? "#374151" : "#ffffff",
                  color: isDark ? "#f9fafb" : "#111827",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#6366f1")}
                onBlur={(e) => {
                  if (!errors.date) e.currentTarget.style.borderColor = isDark ? "#4b5563" : "#d1d5db";
                }}
              />
              {errors.date && <p style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "0.25rem" }}>{errors.date}</p>}
            </div>
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", fontWeight: "500", color: isDark ? "#e5e7eb" : "#374151", marginBottom: "0.25rem" }}>
                <ArrowUpDown style={{ width: "1rem", height: "1rem", color: isDark ? "#9ca3af" : "#6b7280" }} />
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
          </div>

          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", fontWeight: "500", color: isDark ? "#e5e7eb" : "#374151", marginBottom: "0.25rem" }}>
              <Tag style={{ width: "1rem", height: "1rem", color: isDark ? "#9ca3af" : "#6b7280" }} />
              Kategori
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "0.625rem 1rem",
                border: errors.category ? "1px solid #ef4444" : isDark ? "1px solid #4b5563" : "1px solid #d1d5db",
                borderRadius: "0.75rem",
                fontSize: "0.875rem",
                outline: "none",
                backgroundColor: isDark ? "#374151" : "#ffffff",
                color: isDark ? "#f9fafb" : "#111827",
              }}
            >
              <option value="">Pilih Kategori</option>
              {(formData.type === "income" ? categories.income : categories.expense).map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.category && <p style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "0.25rem" }}>{errors.category}</p>}
          </div>

          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", fontWeight: "500", color: isDark ? "#e5e7eb" : "#374151", marginBottom: "0.25rem" }}>
              <DollarSign style={{ width: "1rem", height: "1rem", color: isDark ? "#9ca3af" : "#6b7280" }} />
              Jumlah
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="Masukkan jumlah (contoh: 100000)"
              min="0"
              step="1000"
              style={{
                width: "100%",
                padding: "0.625rem 1rem",
                border: errors.amount ? "1px solid #ef4444" : isDark ? "1px solid #4b5563" : "1px solid #d1d5db",
                borderRadius: "0.75rem",
                fontSize: "0.875rem",
                outline: "none",
                backgroundColor: isDark ? "#374151" : "#ffffff",
                color: isDark ? "#f9fafb" : "#111827",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6366f1")}
              onBlur={(e) => {
                if (!errors.amount) e.currentTarget.style.borderColor = isDark ? "#4b5563" : "#d1d5db";
              }}
            />
            {errors.amount && <p style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "0.25rem" }}>{errors.amount}</p>}
          </div>

          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", fontWeight: "500", color: isDark ? "#e5e7eb" : "#374151", marginBottom: "0.25rem" }}>
              <FileText style={{ width: "1rem", height: "1rem", color: isDark ? "#9ca3af" : "#6b7280" }} />
              Deskripsi
            </label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Deskripsi transaksi (contoh: Beli makan siang)"
              style={{
                width: "100%",
                padding: "0.625rem 1rem",
                border: errors.description ? "1px solid #ef4444" : isDark ? "1px solid #4b5563" : "1px solid #d1d5db",
                borderRadius: "0.75rem",
                fontSize: "0.875rem",
                outline: "none",
                backgroundColor: isDark ? "#374151" : "#ffffff",
                color: isDark ? "#f9fafb" : "#111827",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6366f1")}
              onBlur={(e) => {
                if (!errors.description) e.currentTarget.style.borderColor = isDark ? "#4b5563" : "#d1d5db";
              }}
            />
            {errors.description && <p style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "0.25rem" }}>{errors.description}</p>}
          </div>

          {formData.category && formData.amount && (
            <div style={{
              padding: "1rem",
              backgroundColor: isDark ? "#374151" : "#f9fafb",
              borderRadius: "0.75rem",
              border: isDark ? "1px solid #4b5563" : "1px solid #e5e7eb",
              marginTop: "0.5rem",
            }}>
              <p style={{ fontSize: "0.75rem", color: isDark ? "#9ca3af" : "#6b7280", fontWeight: "500", marginBottom: "0.25rem" }}>Preview</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: "0.875rem", fontWeight: "500", color: isDark ? "#f9fafb" : "#111827" }}>
                    {formData.description || "Deskripsi transaksi"}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: isDark ? "#9ca3af" : "#6b7280" }}>
                    {formData.category} · {formData.type === "income" ? "Pemasukan" : "Pengeluaran"}
                  </p>
                </div>
                <p style={{ fontSize: "1.125rem", fontWeight: "700", color: formData.type === "income" ? "#22c55e" : "#ef4444" }}>
                  {formData.type === "income" ? "+" : "-"}{" "}
                  {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Number(formData.amount) || 0)}
                </p>
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
                editingId ? "Simpan Transaksi" : "Tambah Transaksi"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  ) : null;

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
  if (!document.getElementById("modal-animations")) {
    styleSheet.id = "modal-animations";
    document.head.appendChild(styleSheet);
  }

  // ===== RENDER =====
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Transaksi</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Kelola semua transaksi keuangan Anda</p>
        </div>
        <button onClick={() => openModal()} className="btn btn-primary">
          <Plus className="w-4 h-4" /> Tambah Transaksi
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/70 dark:border-gray-800/70 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari transaksi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input-field w-full md:w-40"
          >
            <option value="all">Semua Tipe</option>
            <option value="income">Pemasukan</option>
            <option value="expense">Pengeluaran</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="input-field w-full md:w-44"
          >
            <option value="all">Semua Kategori</option>
            {allCategories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field w-full md:w-32"
            >
              <option value="date">Tanggal</option>
              <option value="amount">Jumlah</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
              className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="text-sm">{sortOrder === "desc" ? "↓" : "↑"}</span>
            </button>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-gray-700 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4 inline mr-1" /> Reset
            </button>
          )}
        </div>

        {paginated.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Belum ada transaksi</p>
            <button onClick={() => openModal()} className="btn btn-primary mt-4">
              Tambah Transaksi Pertama
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Tanggal</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Tipe</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Kategori</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Deskripsi</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Jumlah</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((t) => (
                  <tr key={t.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400 text-sm">
                      {new Date(t.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`badge ${t.type === "income" ? "badge-success" : "badge-danger"}`}>
                        {t.type === "income" ? "Pemasukan" : "Pengeluaran"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400 text-sm">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs">
                        {t.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400 text-sm max-w-[150px] truncate">
                      {t.description}
                    </td>
                    <td className={`py-2.5 px-3 text-sm font-medium text-right ${t.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                      {t.type === "income" ? "+" : "-"}{" "}
                      {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(t.amount)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openModal(t)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Edit">
                          <Edit className="w-4 h-4 text-gray-500" />
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors" title="Hapus">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-800 mt-4">
            <p className="text-sm text-gray-500">
              Menampilkan {filtered.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} -{" "}
              {Math.min(currentPage * itemsPerPage, filtered.length)} dari {filtered.length} transaksi
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                let pageNum;
                if (totalPages <= 5) pageNum = i + 1;
                else if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      currentPage === pageNum
                        ? "bg-primary-600 text-white"
                        : "border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {modalContent}
    </div>
  );
};

export default Transactions;