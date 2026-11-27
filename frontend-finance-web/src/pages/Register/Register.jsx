import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import AuthShell from "../../components/auth/AuthShell";
import Button from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "../../hooks/useTranslation";
import { registerSchema } from "../../lib/schemas";
import { fieldErrors } from "../../api/errors";
import { apiMessage } from "../../lib/apiMessage";

const FIELDS = [
  { name: "name", icon: User, type: "text", auto: "name", labelKey: "auth.name", placeholder: "Budi Santoso" },
  { name: "email", icon: Mail, type: "email", auto: "email", labelKey: "auth.email", placeholder: "nama@email.com" },
  { name: "password", icon: Lock, type: "password", auto: "new-password", labelKey: "auth.password", isSecret: true },
  { name: "confirmPassword", icon: Lock, type: "password", auto: "new-password", labelKey: "auth.confirm_password", isSecret: true },
];

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register: signUp } = useAuth();
  const [formError, setFormError] = useState("");
  const [visibleSecrets, setVisibleSecrets] = useState({ password: false, confirmPassword: false });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const toggleSecret = (field) => {
    setVisibleSecrets((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const onSubmit = async (v) => {
    setFormError("");
    try {
      await signUp({
        name: v.name.trim(),
        email: v.email.trim().toLowerCase(),
        password: v.password,
      });
      toast.success(t("auth.register_success"));
      navigate("/", { replace: true });
    } catch (err) {
      const fe = fieldErrors(err);
      const mapped = Object.entries(fe).filter(([k]) => FIELDS.some((f) => f.name === k));
      if (mapped.length) {
        mapped.forEach(([k, msg]) => setError(k, { message: msg }));
      } else {
        setFormError(apiMessage(t, err));
      }
    }
  };

  return (
    <AuthShell
      title={t("auth.register_title")}
      subtitle={t("app.tagline")}
      footer={
        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          {t("auth.have_account")}{" "}
          <Link
            to="/login"
            className="font-semibold text-primary-600 transition-colors hover:text-primary-700 hover:underline dark:text-primary-400 dark:hover:text-primary-300"
          >
            {t("auth.login")}
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {formError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>{formError}</span>
          </div>
        )}

        {FIELDS.map(({ name, icon: Icon, type, auto, labelKey, placeholder, isSecret }) => {
          const isVisible = isSecret && visibleSecrets[name];
          const errorId = `register-${name}-error`;
          const hintId = name === "password" ? "register-password-hint" : undefined;
          const describedBy = [errors[name] ? errorId : null, hintId].filter(Boolean).join(" ") || undefined;

          return (
            <div key={name}>
              <label htmlFor={name} className="label">
                {t(labelKey)}
              </label>
              <div className="relative">
                <Icon
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                  aria-hidden="true"
                />
                <input
                  id={name}
                  type={isSecret ? (isVisible ? "text" : "password") : type}
                  autoComplete={auto}
                  placeholder={placeholder}
                  aria-invalid={Boolean(errors[name])}
                  aria-describedby={describedBy}
                  className={`input-field pl-10 ${isSecret ? "pr-10" : ""} ${
                    errors[name] ? "input-field-error" : ""
                  }`}
                  {...register(name)}
                />
                {isSecret && (
                  <button
                    type="button"
                    onClick={() => toggleSecret(name)}
                    aria-label={isVisible ? t("auth.hide_password") : t("auth.show_password")}
                    className="absolute right-2.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                  >
                    {isVisible ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                )}
              </div>
              {errors[name] && (
                <p id={errorId} className="mt-1.5 text-xs font-medium text-danger">
                  {errors[name].message}
                </p>
              )}
            </div>
          );
        })}

        <p id="register-password-hint" className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
          {t("auth.password_hint")}
        </p>

        <Button
          type="submit"
          fullWidth
          loading={isSubmitting}
          icon={ArrowRight}
          iconPosition="right"
          className="mt-2"
        >
          {isSubmitting ? t("auth.processing") : t("auth.register")}
        </Button>
      </form>
    </AuthShell>
  );
};

export default Register;