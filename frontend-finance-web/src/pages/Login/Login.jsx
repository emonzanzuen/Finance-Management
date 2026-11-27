import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import AuthShell from "../../components/auth/AuthShell";
import Button from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "../../hooks/useTranslation";
import { loginSchema } from "../../lib/schemas";
import { apiMessage } from "../../lib/apiMessage";

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const successMessage = location.state?.message || "";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values) => {
    setFormError("");
    try {
      await login(values.email.trim().toLowerCase(), values.password);
      toast.success(t("auth.welcome_back"));
      navigate("/", { replace: true });
    } catch (err) {
      setFormError(apiMessage(t, err));
    }
  };

  return (
    <AuthShell
      title={t("auth.login_title")}
      subtitle={t("app.tagline")}
      footer={
        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          {t("auth.no_account")}{" "}
          <Link
            to="/register"
            className="font-semibold text-primary-600 transition-colors hover:text-primary-700 hover:underline dark:text-primary-400 dark:hover:text-primary-300"
          >
            {t("auth.register")}
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {successMessage && !formError && (
          <div
            role="status"
            className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-200"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>{successMessage}</span>
          </div>
        )}

        {formError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>{formError}</span>
          </div>
        )}

        <div>
          <label htmlFor="email" className="label">
            {t("auth.email")}
          </label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="nama@email.com"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "login-email-error" : undefined}
              className={`input-field pl-10 ${errors.email ? "input-field-error" : ""}`}
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p id="login-email-error" className="mt-1.5 text-xs font-medium text-danger">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label htmlFor="password" className="label mb-0">
              {t("auth.password")}
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-primary-600 transition-colors hover:text-primary-700 hover:underline dark:text-primary-400 dark:hover:text-primary-300"
            >
              {t("auth.forgot_password")}
            </Link>
          </div>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "login-password-error" : undefined}
              className={`input-field pl-10 pr-10 ${errors.password ? "input-field-error" : ""}`}
              {...register("password")}
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
          {errors.password && (
            <p id="login-password-error" className="mt-1.5 text-xs font-medium text-danger">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          fullWidth
          loading={isSubmitting}
          icon={ArrowRight}
          iconPosition="right"
          className="mt-2"
        >
          {isSubmitting ? t("auth.processing") : t("auth.login")}
        </Button>
      </form>
    </AuthShell>
  );
};

export default Login;