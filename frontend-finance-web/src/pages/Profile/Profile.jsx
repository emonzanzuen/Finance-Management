import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  Trash2,
  RotateCcw,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  AlertCircle,
  ShieldAlert,
  User as UserIcon,
  Receipt,
  Target,
  Wallet,
} from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import SkeletonLoader from "../../components/ui/SkeletonLoader";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { useTranslation } from "../../hooks/useTranslation";
import { authService } from "../../api/services/auth.js";
import { apiMessage } from "../../lib/apiMessage";
import { formatCurrencyWithRate } from "../../utils/formatters";

export default function Profile() {
  const { user, updateProfile, changePassword, logoutAll } = useAuth();
  const { currency, exchangeRates } = useApp();
  const { t, language } = useTranslation();
  const isEn = language === "en";
  const qc = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: authService.profile,
  });
  const profile = profileQuery.data ?? user;

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    currentPassword: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [avatar, setAvatar] = useState(undefined);
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [logoutAllOpen, setLogoutAllOpen] = useState(false);
  const [logoutAllBusy, setLogoutAllBusy] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    emailConfirm: false,
    current: false,
    next: false,
  });

  useEffect(() => {
    if (profile) {
      setProfileForm({
        name: profile.name || "",
        email: profile.email || "",
        currentPassword: "",
      });
    }
  }, [profile?.id, profile?.name, profile?.email]);

  const emailChanged =
    profileForm.email.trim().toLowerCase() !== (profile?.email || "").toLowerCase();

  const toggleVisibility = (key) => {
    setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const pickAvatar = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(isEn ? "Please choose an image file." : "Pilih file gambar.");
      return;
    }
    if (file.size > 100_000) {
      toast.error(isEn ? "Maximum avatar size is 100 KB." : "Ukuran avatar maksimal 100 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatar(String(reader.result));
    reader.readAsDataURL(file);
  };

  const submitProfile = async (e) => {
    e.preventDefault();
    setProfileError("");

    const trimmedName = profileForm.name.trim();
    const trimmedEmail = profileForm.email.trim();
    if (!trimmedName) {
      setProfileError(isEn ? "Name is required." : "Nama wajib diisi.");
      return;
    }
    if (!trimmedEmail) {
      setProfileError(isEn ? "Email is required." : "Email wajib diisi.");
      return;
    }
    if (emailChanged && profileForm.currentPassword.length < 8) {
      setProfileError(
        isEn
          ? "Enter your current password to change email."
          : "Masukkan kata sandi saat ini untuk mengganti email."
      );
      return;
    }

    setProfileBusy(true);
    try {
      const body = { name: trimmedName, email: trimmedEmail };
      if (emailChanged) body.currentPassword = profileForm.currentPassword;
      if (avatar !== undefined) body.avatar = avatar;
      await updateProfile(body);
      setAvatar(undefined);
      setProfileForm((prev) => ({ ...prev, currentPassword: "" }));
      toast.success(isEn ? "Profile updated successfully." : "Profil berhasil diperbarui.");
    } catch (err) {
      setProfileError(apiMessage(t, err));
    } finally {
      setProfileBusy(false);
    }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    setPasswordError("");

    if (passwordForm.currentPassword.length < 8 || passwordForm.newPassword.length < 8) {
      setPasswordError(t("auth.password_hint"));
      return;
    }

    setPasswordBusy(true);
    try {
      await changePassword(passwordForm);
      await qc.invalidateQueries({ queryKey: ["profile"] });
      setPasswordForm({ currentPassword: "", newPassword: "" });
      toast.success(isEn ? "Password changed successfully." : "Kata sandi berhasil diubah.");
    } catch (err) {
      setPasswordError(apiMessage(t, err));
    } finally {
      setPasswordBusy(false);
    }
  };

  const handleConfirmLogoutAll = async () => {
    setLogoutAllBusy(true);
    try {
      await logoutAll();
      window.location.replace("/login");
    } catch (err) {
      toast.error(apiMessage(t, err));
      setLogoutAllBusy(false);
      setLogoutAllOpen(false);
    }
  };

  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    profile?.name || "User"
  )}&background=6366f1&color=fff&size=128`;

  const displayAvatar =
    avatar === null ? fallbackAvatar : avatar || profile?.avatar || fallbackAvatar;

  const statsItems = [
    {
      label: t("profile.total_transactions"),
      value:
        profile?.stats?.transactionCount !== undefined &&
        profile?.stats?.transactionCount !== null
          ? Number(profile.stats.transactionCount).toLocaleString(
              isEn ? "en-US" : "id-ID"
            )
          : "—",
      icon: Receipt,
    },
    {
      label: t("profile.saving_targets"),
      value:
        profile?.stats?.savingsGoalCount !== undefined &&
        profile?.stats?.savingsGoalCount !== null
          ? Number(profile.stats.savingsGoalCount).toLocaleString(
              isEn ? "en-US" : "id-ID"
            )
          : "—",
      icon: Target,
    },
    {
      label: t("profile.total_savings"),
      value:
        profile?.stats?.totalSavings !== undefined &&
        profile?.stats?.totalSavings !== null
          ? formatCurrencyWithRate(
              Number(profile.stats.totalSavings || 0),
              currency,
              exchangeRates
            )
          : "—",
      icon: Wallet,
    },
  ];

  if (profileQuery.isLoading && !profile) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <SkeletonLoader variant="card" count={3} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header Halaman */}
      <div className="page-header mb-0">
        <div>
          <h2 className="page-title">{t("profile.title")}</h2>
          <p className="page-subtitle">
            {isEn
              ? "Account information and security settings stored on the server."
              : "Informasi akun dan keamanan yang tersimpan pada server."}
          </p>
        </div>
      </div>

      {profileQuery.isError && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>{isEn ? "Failed to load profile." : "Gagal memuat profil."}</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => profileQuery.refetch()}>
            {t("common.retry")}
          </Button>
        </div>
      )}

      {/* Ringkasan Statistik Akun */}
      <div className="grid gap-4 sm:grid-cols-3">
        {statsItems.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {label}
                </p>
                <p className="tabular-nums-finance mt-1.5 truncate text-lg font-bold tracking-tight text-gray-900 dark:text-white">
                  {value}
                </p>
              </div>
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/70 dark:text-primary-400"
                aria-hidden="true"
              >
                <Icon className="h-4 w-4" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Form Informasi Profil */}
      <Card>
        <form onSubmit={submitProfile} className="space-y-5" noValidate>
          <div className="flex items-center gap-2.5 border-b border-gray-100 pb-4 dark:border-gray-800">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/70 dark:text-primary-400"
              aria-hidden="true"
            >
              <UserIcon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="section-title">
                {isEn ? "Profile information" : "Informasi profil"}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isEn
                  ? "Update your display name, email, or profile photo."
                  : "Perbarui nama tampilan, email, atau foto profil Anda."}
              </p>
            </div>
          </div>

          {profileError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <span>{profileError}</span>
            </div>
          )}

          {/* Avatar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <img
              src={displayAvatar}
              alt={t("profile.avatar")}
              className="h-16 w-16 flex-shrink-0 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700"
            />
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <label className="btn btn-outline btn-sm cursor-pointer">
                  <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{isEn ? "Choose photo" : "Pilih avatar"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={pickAvatar}
                  />
                </label>

                {profile?.avatar && avatar !== null && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    icon={Trash2}
                    onClick={() => setAvatar(null)}
                    className="text-danger hover:bg-red-50 dark:hover:bg-red-950/40"
                  >
                    {isEn ? "Remove" : "Hapus avatar"}
                  </Button>
                )}

                {avatar !== undefined && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    icon={RotateCcw}
                    onClick={() => setAvatar(undefined)}
                  >
                    {isEn ? "Undo photo change" : "Batalkan perubahan foto"}
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isEn
                  ? "JPG, PNG, or WebP. Maximum size 100 KB."
                  : "Format gambar (JPG, PNG, WebP). Ukuran maksimal 100 KB."}
              </p>
            </div>
          </div>

          <div className="form-row">
            <div>
              <label htmlFor="profile-name" className="label">
                {t("profile.name")}
              </label>
              <input
                id="profile-name"
                className="input-field"
                required
                maxLength={100}
                autoComplete="name"
                value={profileForm.name}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div>
              <label htmlFor="profile-email" className="label">
                {t("profile.email")}
              </label>
              <input
                id="profile-email"
                className="input-field"
                type="email"
                required
                autoComplete="email"
                value={profileForm.email}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
          </div>

          {emailChanged && (
            <div className="rounded-xl border border-primary-200/80 bg-primary-50/50 p-4 dark:border-primary-900/60 dark:bg-primary-950/30">
              <label htmlFor="profile-email-password" className="label">
                {isEn
                  ? "Current password (required to change email)"
                  : "Kata sandi saat ini (diperlukan untuk mengganti email)"}
              </label>
              <div className="relative">
                <input
                  id="profile-email-password"
                  className="input-field pr-10"
                  required
                  type={showPasswords.emailConfirm ? "text" : "password"}
                  minLength={8}
                  autoComplete="current-password"
                  value={profileForm.currentPassword}
                  onChange={(e) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                />
                <button
                  type="button"
                  onClick={() => toggleVisibility("emailConfirm")}
                  aria-label={
                    showPasswords.emailConfirm
                      ? t("auth.hide_password")
                      : t("auth.show_password")
                  }
                  className="absolute right-2.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                >
                  {showPasswords.emailConfirm ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <Button type="submit" loading={profileBusy}>
              {profileBusy
                ? isEn
                  ? "Saving..."
                  : "Menyimpan..."
                : isEn
                ? "Save profile"
                : "Simpan profil"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Form Ubah Kata Sandi */}
      <Card>
        <form onSubmit={submitPassword} className="space-y-5" noValidate>
          <div className="flex items-center gap-2.5 border-b border-gray-100 pb-4 dark:border-gray-800">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/70 dark:text-primary-400"
              aria-hidden="true"
            >
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <h3 className="section-title">
                {isEn ? "Change password" : "Ubah kata sandi"}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isEn
                  ? "Changing your password will sign out other active sessions."
                  : "Mengubah kata sandi akan mencabut sesi aktif di perangkat lain."}
              </p>
            </div>
          </div>

          {passwordError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <span>{passwordError}</span>
            </div>
          )}

          <div className="form-row">
            <div>
              <label htmlFor="current-password" className="label">
                {isEn ? "Current password" : "Kata sandi saat ini"}
              </label>
              <div className="relative">
                <input
                  id="current-password"
                  className="input-field pr-10"
                  required
                  type={showPasswords.current ? "text" : "password"}
                  minLength={8}
                  maxLength={128}
                  autoComplete="current-password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                />
                <button
                  type="button"
                  onClick={() => toggleVisibility("current")}
                  aria-label={
                    showPasswords.current
                      ? t("auth.hide_password")
                      : t("auth.show_password")
                  }
                  className="absolute right-2.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="new-password" className="label">
                {isEn ? "New password" : "Kata sandi baru"}
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  className="input-field pr-10"
                  required
                  type={showPasswords.next ? "text" : "password"}
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  aria-describedby="profile-password-hint"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                />
                <button
                  type="button"
                  onClick={() => toggleVisibility("next")}
                  aria-label={
                    showPasswords.next
                      ? t("auth.hide_password")
                      : t("auth.show_password")
                  }
                  className="absolute right-2.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                >
                  {showPasswords.next ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <p id="profile-password-hint" className="text-xs text-gray-500 dark:text-gray-400">
            {t("auth.password_hint")}
          </p>

          <div className="flex justify-end pt-1">
            <Button type="submit" loading={passwordBusy}>
              {passwordBusy
                ? isEn
                  ? "Saving..."
                  : "Menyimpan..."
                : isEn
                ? "Update password"
                : "Ubah kata sandi"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Keamanan Sesi: Keluar Semua Perangkat */}
      <Card className="border-rose-200/90 dark:border-rose-900/70">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
              aria-hidden="true"
            >
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div>
              <h3 className="section-title">
                {isEn ? "Sign out from all devices" : "Keluar dari semua perangkat"}
              </h3>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                {isEn
                  ? "All active sessions will be revoked, including this session."
                  : "Semua sesi aktif akan dicabut, termasuk sesi ini."}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            icon={LogOut}
            onClick={() => setLogoutAllOpen(true)}
            className="flex-shrink-0 border-rose-200 text-rose-600 hover:border-rose-300 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/50"
          >
            {isEn ? "Sign out all" : "Keluar semua"}
          </Button>
        </div>
      </Card>

      {/* Modal Konfirmasi Keluar Semua Perangkat */}
      <Modal
        isOpen={logoutAllOpen}
        onClose={() => !logoutAllBusy && setLogoutAllOpen(false)}
        title={isEn ? "Sign out from all devices?" : "Keluar dari semua perangkat?"}
        size="sm"
        footer={
          <div className="flex justify-end gap-2.5">
            <Button
              variant="outline"
              onClick={() => setLogoutAllOpen(false)}
              disabled={logoutAllBusy}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="danger"
              loading={logoutAllBusy}
              onClick={handleConfirmLogoutAll}
            >
              {isEn ? "Sign out all" : "Ya, keluar semua"}
            </Button>
          </div>
        }
      >
        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          {isEn
            ? "You will need to sign in again on this device and any other devices currently logged into your FinManage account."
            : "Anda perlu masuk kembali di perangkat ini serta perangkat lain yang sedang menggunakan akun FinManage Anda."}
        </p>
      </Modal>
    </div>
  );
}