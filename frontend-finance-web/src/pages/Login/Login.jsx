import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import AuthShell from "../../components/auth/AuthShell";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "../../hooks/useTranslation";
import { loginSchema } from "../../lib/schemas";
import { apiMessage } from "../../lib/apiMessage";

const inputCls =
  "w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition";

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

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
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          {t("auth.no_account")}{" "}
          <Link to="/register" className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">{t("auth.register")}</Link>
          <span className="mx-2">·</span><Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">Lupa kata sandi?</Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {formError && (
          <div role="alert" className="p-3 rounded-xl text-sm bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900">
            {formError}
          </div>
        )}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {t("auth.email")}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="nama@email.com"
              className={`${inputCls} ${errors.email ? "border-red-400" : "border-gray-300 dark:border-gray-700"}`}
              {...register("email")}
            />
          </div>
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {t("auth.password")}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className={`${inputCls} pr-10 ${errors.password ? "border-red-400" : "border-gray-300 dark:border-gray-700"}`}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? t("auth.hide_password") : t("auth.show_password")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/20"
        >
          {isSubmitting ? t("auth.processing") : (<>{t("auth.login")}<ArrowRight className="w-4 h-4" /></>)}
        </button>
      </form>
    </AuthShell>
  );
};

export default Login;
