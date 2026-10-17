import React, { useState } from "react";
import ReactDOM from "react-dom";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../context/ThemeContext";
import { formatCurrency } from "../../utils/formatters";
import {
  User,
  Mail,
  Camera,
  Save,
  X,
  Wallet,
  Target,
  TrendingUp,
  Edit,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const Profile = () => {
  const { user, updateUser, transactions, goals } = useApp();
  const { isDark } = useTheme();
  const { logout } = useAuth();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
  });
  const [errors, setErrors] = useState({});
  const [avatarFile, setAvatarFile] = useState(null);
  const fileInputRef = React.useRef(null);

  // ===== HANDLER =====
  const openModal = () => {
    setFormData({
      name: user.name,
      email: user.email,
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Nama harus diisi";
    if (!formData.email.trim()) newErrors.email = "Email harus diisi";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Format email tidak valid";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setTimeout(() => {
      updateUser(formData);
      setIsLoading(false);
      closeModal();
    }, 500);
  };

  // ===== UPLOAD AVATAR =====
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validasi ukuran (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran gambar maksimal 2MB");
      return;
    }

    // Validasi tipe
    if (!file.type.startsWith("image/")) {
      toast.error("Hanya file gambar yang diperbolehkan");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      // Update user dengan avatar baru
      updateUser({ avatar: base64 });
      toast.success("Foto profil berhasil diperbarui!");
    };
    reader.readAsDataURL(file);
    // Reset input agar bisa upload file yang sama lagi
    e.target.value = "";
  };

  const handleLogout = () => {
    if (window.confirm("Apakah Anda yakin ingin keluar?")) {
      logout();
      toast.success("Berhasil keluar!");
      window.location.href = "/login";
    }
  };

  // ===== DATA STATS =====
  const totalSavings = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  // ===== MODAL CONTENT =====
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
                Edit Profil
              </h3>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: isDark ? "#9ca3af" : "#6b7280",
                }}
              >
                Perbarui informasi akun Anda
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

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: "1.5rem" }}>
          {/* Avatar Preview */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
            <div style={{ position: "relative" }}>
              <img
                src={
                  user.avatar ||
                  `https://ui-avatars.com/api/?name=${user.name}&background=6366f1&color=fff`
                }
                alt={user.name}
                style={{
                  width: "5rem",
                  height: "5rem",
                  borderRadius: "50%",
                  border: "3px solid #6366f1",
                  objectFit: "cover",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  backgroundColor: isDark ? "#374151" : "#e5e7eb",
                  borderRadius: "50%",
                  padding: "0.35rem",
                  border: "2px solid",
                  borderColor: isDark ? "#1f2937" : "#ffffff",
                }}
              >
                <Camera style={{ width: "1rem", height: "1rem", color: isDark ? "#9ca3af" : "#6b7280" }} />
              </div>
            </div>
          </div>

          {/* Name */}
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
              <User style={{ width: "1rem", height: "1rem" }} />
              Nama Lengkap
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "0.625rem 1rem",
                border: errors.name
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
                if (!errors.name)
                  e.currentTarget.style.borderColor = isDark ? "#4b5563" : "#d1d5db";
              }}
            />
            {errors.name && (
              <p style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "0.25rem" }}>
                {errors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div style={{ marginBottom: "1.5rem" }}>
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
              <Mail style={{ width: "1rem", height: "1rem" }} />
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "0.625rem 1rem",
                border: errors.email
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
                if (!errors.email)
                  e.currentTarget.style.borderColor = isDark ? "#4b5563" : "#d1d5db";
              }}
            />
            {errors.email && (
              <p style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "0.25rem" }}>
                {errors.email}
              </p>
            )}
          </div>

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
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  ) : null;

  // ===== RENDER =====
  return (
    <div className="space-y-6 animate-fade-in">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Profil
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Kelola informasi profil dan akun Anda
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={openModal} className="btn btn-primary">
            <Edit className="w-4 h-4" /> Edit Profil
          </button>
          <button onClick={handleLogout} className="btn btn-danger">
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>
      </div>

      {/* ===== PROFILE CARD ===== */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/70 dark:border-gray-800/70 p-6 shadow-sm transition-all duration-200 hover:shadow-md">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Avatar */}
          <div className="flex flex-col items-center md:items-start">
            <div className="relative">
              <img
                src={
                  user.avatar ||
                  `https://ui-avatars.com/api/?name=${user.name}&background=6366f1&color=fff`
                }
                alt={user.name}
                className="w-24 h-24 rounded-full border-4 border-indigo-100 dark:border-indigo-900/50 object-cover"
              />
              {/* ===== TOMBOL KAMERA ===== */}
              <button
                onClick={handleAvatarClick}
                className="absolute bottom-0 right-0 p-1.5 bg-indigo-600 text-white rounded-full shadow hover:bg-indigo-700 transition-colors"
                title="Upload foto profil"
              >
                <Camera className="w-4 h-4" />
              </button>
              {/* Input file tersembunyi */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              Klik kamera untuk ubah foto
            </p>
          </div>

          {/* Info */}
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Nama Lengkap
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {user.name}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Email
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {user.email}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status Akun
              </p>
              <span className="badge badge-success">Aktif</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== STATISTICS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { title: "Total Transaksi", value: transactions.length, icon: Wallet },
          { title: "Target Tabungan", value: goals.length, icon: Target },
          {
            title: "Total Tabungan",
            value: totalSavings,
            icon: TrendingUp,
            isCurrency: true,
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
                <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {item.isCurrency ? formatCurrency(item.value) : item.value}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40">
                <item.icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ===== MODAL ===== */}
      {modalContent}
    </div>
  );
};

export default Profile;