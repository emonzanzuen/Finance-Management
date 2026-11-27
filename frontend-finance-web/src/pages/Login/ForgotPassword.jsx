import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
import AuthShell from "../../components/auth/AuthShell";
import Button from "../../components/ui/Button";
import { authService } from "../../api/services/auth.js";
import { apiMessage } from "../../lib/apiMessage";
import { useTranslation } from "../../hooks/useTranslation";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const isEn = language === "en";

  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldError("");

    const normalized = email.trim().toLowerCase();
    if (!normalized || !EMAIL_RE.test(normalized)) {
      setFieldError(isEn ? "Please enter a valid email address." : "Masukkan alamat email yang valid.");
      return;
    }

    setBusy(true);
    try {
      await authService.forgotPassword({ email: normalized });
      navigate(`/reset-password?email=${encodeURIComponent(normalized)}`, {
        state: { otpRequested: true },
      });
    } catch (err) {
      setError(apiMessage(t, err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title={isEn ? "Forgot password" : "Lupa kata sandi"}
      subtitle={
        isEn
          ? "We will send a 6-digit OTP code if your email is registered."
          : "Kami akan mengirim kode OTP 6 digit jika alamat email terdaftar."
      }
      footer={
        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 font-semibold text-primary-600 transition-colors hover:text-primary-700 hover:underline dark:text-primary-400 dark:hover:text-primary-300"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>{isEn ? "Back to login" : "Kembali ke login"}</span>
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={submit} noValidate>
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
          <label htmlFor="forgot-email" className="label">
            {t("auth.email")}
          </label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              id="forgot-email"
              className={`input-field pl-10 ${fieldError ? "input-field-error" : ""}`}
              type="email"
              required
              autoComplete="email"
              placeholder="nama@email.com"
              aria-invalid={Boolean(fieldError)}
              aria-describedby={fieldError ? "forgot-email-error" : undefined}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldError) setFieldError("");
              }}
            />
          </div>
          {fieldError && (
            <p id="forgot-email-error" className="mt-1.5 text-xs font-medium text-danger">
              {fieldError}
            </p>
          )}
        </div>

        <Button
          type="submit"
          fullWidth
          loading={busy}
          icon={ArrowRight}
          iconPosition="right"
        >
          {busy
            ? isEn
              ? "Sending..."
              : "Mengirim..."
            : isEn
            ? "Send OTP code"
            : "Kirim kode OTP"}
        </Button>
      </form>
    </AuthShell>
  );
}