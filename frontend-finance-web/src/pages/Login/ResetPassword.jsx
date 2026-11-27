import React, { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, KeyRound, Lock, Eye, EyeOff, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import AuthShell from "../../components/auth/AuthShell";
import Button from "../../components/ui/Button";
import { authService } from "../../api/services/auth.js";
import { apiMessage } from "../../lib/apiMessage";
import { useTranslation } from "../../hooks/useTranslation";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const { t, language } = useTranslation();
  const isEn = language === "en";

  const [form, setForm] = useState({
    email: params.get("email") || "",
    code: "",
    newPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrorsState, setFieldErrorsState] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const otpRequested = Boolean(location.state?.otpRequested);

  const validate = () => {
    const next = {};
    if (!form.email.trim()) {
      next.email = isEn ? "Email is required." : "Email wajib diisi.";
    }
    if (!/^\d{6}$/.test(form.code)) {
      next.code = isEn ? "OTP code must be 6 digits." : "Kode OTP harus terdiri dari 6 angka.";
    }
    if (form.newPassword.length < 8 || form.newPassword.length > 128) {
      next.newPassword = t("auth.password_hint");
    }
    return next;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setFieldErrorsState(nextErrors);
      return;
    }

    setBusy(true);
    try {
      await authService.resetPassword({
        email: form.email.trim().toLowerCase(),
        code: form.code,
        newPassword: form.newPassword,
      });
      navigate("/login", {
        replace: true,
        state: {
          message: isEn
            ? "Password has been reset. Please sign in again."
            : "Kata sandi berhasil diubah. Silakan masuk kembali.",
        },
      });
    } catch (err) {
      setError(apiMessage(t, err));
    } finally {
      setBusy(false);
    }
  };

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrorsState[key]) {
      setFieldErrorsState((prev) => ({ ...prev, [key]: "" }));
    }
  };

  return (
    <AuthShell
      title={isEn ? "Reset password" : "Atur ulang kata sandi"}
      subtitle={
        isEn
          ? "Enter the 6-digit OTP sent to your email and set a new password."
          : "Masukkan kode OTP 6 digit yang dikirim ke email Anda beserta kata sandi baru."
      }
      footer={
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 font-semibold text-primary-600 transition-colors hover:text-primary-700 hover:underline dark:text-primary-400 dark:hover:text-primary-300"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>{isEn ? "Back to login" : "Kembali ke login"}</span>
          </Link>
          <span aria-hidden="true">·</span>
          <Link
            to="/forgot-password"
            className="font-medium text-gray-600 transition-colors hover:text-gray-900 hover:underline dark:text-gray-300 dark:hover:text-white"
          >
            {isEn ? "Request new OTP" : "Kirim ulang OTP"}
          </Link>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={submit} noValidate>
        {otpRequested && !error && (
          <div
            role="status"
            className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-200"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>
              {isEn
                ? "If the email is registered, an OTP code has been sent. Check your inbox or spam folder."
                : "Jika email terdaftar, kode OTP telah dikirim. Periksa kotak masuk atau folder spam."}
            </span>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label htmlFor="reset-email" className="label">
            {t("auth.email")}
          </label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              id="reset-email"
              className={`input-field pl-10 ${fieldErrorsState.email ? "input-field-error" : ""}`}
              type="email"
              required
              autoComplete="email"
              aria-invalid={Boolean(fieldErrorsState.email)}
              aria-describedby={fieldErrorsState.email ? "reset-email-error" : undefined}
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
            />
          </div>
          {fieldErrorsState.email && (
            <p id="reset-email-error" className="mt-1.5 text-xs font-medium text-danger">
              {fieldErrorsState.email}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="reset-code" className="label">
            {isEn ? "OTP Code (6 digits)" : "Kode OTP (6 digit)"}
          </label>
          <div className="relative">
            <KeyRound
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              id="reset-code"
              className={`input-field tabular-nums-finance pl-10 tracking-[0.25em] font-semibold ${
                fieldErrorsState.code ? "input-field-error" : ""
              }`}
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              minLength={6}
              maxLength={6}
              placeholder="000000"
              aria-invalid={Boolean(fieldErrorsState.code)}
              aria-describedby={fieldErrorsState.code ? "reset-code-error" : undefined}
              value={form.code}
              onChange={(e) => updateField("code", e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
          </div>
          {fieldErrorsState.code && (
            <p id="reset-code-error" className="mt-1.5 text-xs font-medium text-danger">
              {fieldErrorsState.code}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="reset-new-password" className="label">
            {isEn ? "New Password" : "Kata Sandi Baru"}
          </label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              id="reset-new-password"
              className={`input-field pl-10 pr-10 ${
                fieldErrorsState.newPassword ? "input-field-error" : ""
              }`}
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              aria-invalid={Boolean(fieldErrorsState.newPassword)}
              aria-describedby={
                fieldErrorsState.newPassword ? "reset-password-error" : "reset-password-hint"
              }
              value={form.newPassword}
              onChange={(e) => updateField("newPassword", e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? t("auth.hide_password") : t("auth.show_password")}
              className="absolute right-2.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {fieldErrorsState.newPassword ? (
            <p id="reset-password-error" className="mt-1.5 text-xs font-medium text-danger">
              {fieldErrorsState.newPassword}
            </p>
          ) : (
            <p id="reset-password-hint" className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              {t("auth.password_hint")}
            </p>
          )}
        </div>

        <Button type="submit" fullWidth loading={busy} className="mt-2">
          {busy
            ? t("auth.processing")
            : isEn
            ? "Reset password"
            : "Atur ulang kata sandi"}
        </Button>
      </form>
    </AuthShell>
  );
}