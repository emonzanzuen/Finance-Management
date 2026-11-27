import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Mail, Lock, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import AuthShell from "../../components/auth/AuthShell";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "../../hooks/useTranslation";
import { registerSchema } from "../../lib/schemas";
import { fieldErrors } from "../../api/errors";
import { apiMessage } from "../../lib/apiMessage";

const inputCls =
  "w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition";

const FIELDS = [
  { name: "name", icon: User, type: "text", auto: "name", labelKey: "auth.name" },
  { name: "email", icon: Mail, type: "email", auto: "email", labelKey: "auth.email" },
  { name: "password", icon: Lock, type: "password", auto: "new-password", labelKey: "auth.password" },
  { name: "confirmPassword", icon: Lock, type: "password", auto: "new-password", labelKey: "auth.confirm_password" },
];

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register: signUp } = useAuth();
  const [formError, setFormError] = useState("");
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (v) => {
    setFormError("");
    try {
      await signUp({ name: v.name.trim(), email: v.email.trim().toLowerCase(), password: v.password });
      toast.success(t("auth.register_success"));
      navigate("/", { replace: true });
    } catch (err) {
      // Kesalahan per field dari server (mis. kebijakan password) ditampilkan di field terkait.
      const fe = fieldErrors(err);
      const mapped = Object.entries(fe).filter(([k]) => FIELDS.some((f) => f.name === k));
      if (mapped.length) mapped.forEach(([k, msg]) => setError(k, { message: msg }));
      else setFormError(apiMessage(t, err));
    }
  };

  return (
    <AuthShell
      title={t("auth.register_title")}
      subtitle={t("app.tagline")}
      footer={
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          {t("auth.have_account")}{" "}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
            {t("auth.login")}
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {formError && (
          <div role="alert" className="p-3 rounded-xl text-sm bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900">
            {formError}
          </div>
        )}
        {FIELDS.map(({ name, icon: Icon, type, auto, labelKey }) => (
          <div key={name}>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t(labelKey)}
            </label>
            <div className="relative">
              <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id={name}
                type={type}
                autoComplete={auto}
                className={`${inputCls} ${errors[name] ? "border-red-400" : "border-gray-300 dark:border-gray-700"}`}
                {...register(name)}
              />
            </div>
            {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name].message}</p>}
          </div>
        ))}
        <p className="text-xs text-gray-500 dark:text-gray-400">{t("auth.password_hint")}</p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/20"
        >
          {isSubmitting ? t("auth.processing") : (<>{t("auth.register")}<ArrowRight className="w-4 h-4" /></>)}
        </button>
      </form>
    </AuthShell>
  );
};

export default Register;
