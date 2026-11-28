import React from "react";
import { TrendingUp, Moon, Sun, Globe } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useApp } from "../../context/AppContext";
import { useTranslation } from "../../hooks/useTranslation";

const AuthShell = ({ title, subtitle, children, footer }) => {
  const { isDark, toggleTheme } = useTheme();
  const { language, setLanguage } = useApp();
  const { t } = useTranslation();

  const toggleLanguage = () => {
    setLanguage(language === "id" ? "en" : "id");
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/80 px-4 py-6 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 md:p-6">
      {/* Latar dekoratif lembut */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute right-[-10%] top-[-20%] h-[460px] w-[460px] rounded-full bg-primary-500/5 blur-3xl dark:bg-primary-500/10" />
        <div className="absolute bottom-[-20%] left-[-10%] h-[380px] w-[380px] rounded-full bg-purple-500/5 blur-3xl dark:bg-purple-500/10" />
      </div>

      {/* Utilitas cepat tema & bahasa */}
      <div className="relative z-10 mb-4 flex w-full max-w-md items-center justify-end gap-2">
        <button
          type="button"
          onClick={toggleLanguage}
          aria-label={language === "id" ? "Switch to English" : "Ganti ke Bahasa Indonesia"}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-200/80 bg-white/80 px-3 text-xs font-semibold text-gray-700 backdrop-blur-md transition-colors hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900/80 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <Globe className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{language === "id" ? "ID" : "EN"}</span>
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={t("common.toggle_theme")}
          aria-pressed={isDark}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200/80 bg-white/80 text-gray-700 backdrop-blur-md transition-colors hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900/80 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          {isDark ? (
            <Sun className="h-4 w-4 text-yellow-400" aria-hidden="true" />
          ) : (
            <Moon className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>

      <main className="relative z-10 w-full max-w-md bg-transparent">
        {/* Identitas Aplikasi */}
        <div className="mb-5 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-500/20">
            <TrendingUp className="h-7 w-7 text-white" aria-hidden="true" />
          </div>
          <h1 className="mt-3.5 text-2xl font-bold tracking-tight text-gray-900 dark:text-white md:text-3xl">
            {t("app.name")}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>

        {/* Kartu Form */}
        <section className="rounded-2xl border border-gray-200/90 bg-white/95 p-6 shadow-xl shadow-gray-200/40 backdrop-blur-sm dark:border-gray-800/90 dark:bg-gray-900/95 dark:shadow-black/30 md:p-7">
          <h2 className="mb-5 text-center text-lg font-semibold tracking-tight text-gray-900 dark:text-white sm:text-xl">
            {title}
          </h2>
          {children}
        </section>

        {footer}

        <p className="mt-5 text-center text-xs text-gray-400 dark:text-gray-500">
          &copy; {new Date().getFullYear()} {t("app.name")}
        </p>
      </main>
    </div>
  );
};

export default AuthShell;