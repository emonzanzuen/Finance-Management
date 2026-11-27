import React from "react";
import toast from "react-hot-toast";
import {
  Moon,
  Sun,
  Globe,
  RefreshCw,
  Clock,
  CircleHelp,
  Coins,
  AlertTriangle,
} from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Switch from "../../components/ui/Switch";
import { useTheme } from "../../context/ThemeContext";
import { useApp } from "../../context/AppContext";
import { useTranslation } from "../../hooks/useTranslation";

export default function Settings() {
  const { isDark, toggleTheme } = useTheme();
  const { t, language } = useTranslation();
  const isEn = language === "en";
  const {
    currency,
    setCurrency,
    setLanguage,
    currencies,
    isLoadingRates,
    ratesLastUpdated,
    ratesSource,
    ratesError,
    refreshRates,
  } = useApp();

  const handleCurrency = (e) => {
    const nextCurrency = e.target.value;
    setCurrency(nextCurrency);
    toast.success(
      isEn
        ? `Display currency set to ${nextCurrency}`
        : `Mata uang tampilan: ${nextCurrency}`
    );
  };

  const handleLanguage = (e) => {
    const nextLang = e.target.value;
    setLanguage(nextLang);
    toast.success(
      nextLang === "en" ? "Language changed to English." : "Bahasa berhasil diubah."
    );
  };

  const updatedAt = ratesLastUpdated
    ? new Date(ratesLastUpdated).toLocaleString(isEn ? "en-US" : "id-ID")
    : t("common.not_updated");

  const rateSourceVariant =
    ratesSource === "live"
      ? "success"
      : ratesSource === "cache"
      ? "info"
      : "warning";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header Halaman */}
      <div className="page-header mb-0">
        <div>
          <h2 className="page-title">{t("settings.title")}</h2>
          <p className="page-subtitle">
            {isEn
              ? "Interface preferences are saved on this device; exchange rates are loaded from the server."
              : "Preferensi antarmuka disimpan di perangkat; kurs diambil dari server."}
          </p>
        </div>
      </div>

      {/* Seksi Tampilan */}
      <Card className="space-y-5">
        <div className="border-b border-gray-100 pb-4 dark:border-gray-800">
          <h3 className="section-title">{isEn ? "Appearance" : "Tampilan"}</h3>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {isEn
              ? "Customize theme and interface language."
              : "Sesuaikan tema tampilan dan bahasa antarmuka."}
          </p>
        </div>

        {/* Tema */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
              aria-hidden="true"
            >
              {isDark ? (
                <Moon className="h-5 w-5 text-primary-400" />
              ) : (
                <Sun className="h-5 w-5 text-amber-500" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {t("settings.theme")}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isDark ? t("settings.dark") : t("settings.light")}
              </p>
            </div>
          </div>

          <Switch
            checked={isDark}
            onChange={toggleTheme}
            aria-label={t("common.toggle_theme")}
          />
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800" />

        {/* Bahasa */}
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
              aria-hidden="true"
            >
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <label
                htmlFor="settings-language"
                className="block text-sm font-medium text-gray-900 dark:text-white"
              >
                {t("settings.language")}
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isEn ? "Interface display language" : "Bahasa antarmuka aplikasi"}
              </p>
            </div>
          </div>

          <select
            id="settings-language"
            className="input-field sm:w-52"
            value={language}
            onChange={handleLanguage}
          >
            <option value="id">Bahasa Indonesia</option>
            <option value="en">English</option>
          </select>
        </div>
      </Card>

      {/* Seksi Mata Uang Tampilan */}
      <Card className="space-y-4">
        <div className="flex items-start gap-3 border-b border-gray-100 pb-4 dark:border-gray-800">
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/70 dark:text-primary-400"
            aria-hidden="true"
          >
            <Coins className="h-5 w-5" />
          </div>
          <div>
            <h3 className="section-title">
              {isEn ? "Display currency" : "Mata uang tampilan"}
            </h3>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {isEn
                ? "All transaction records remain stored in Indonesian Rupiah (IDR)."
                : "Catatan transaksi tetap disimpan dalam Rupiah Indonesia (IDR)."}
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="settings-currency" className="label">
            {t("settings.currency")}
          </label>
          <select
            id="settings-currency"
            className="input-field"
            value={currency}
            onChange={handleCurrency}
          >
            <option value="IDR">IDR · Rupiah Indonesia</option>
            {currencies
              .filter((x) => x.code !== "IDR")
              .map((x) => (
                <option key={x.code} value={x.code}>
                  {x.code} · {x.name}
                </option>
              ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-50/90 px-4 py-3 dark:bg-gray-800/50">
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
            <Clock className="h-4 w-4 flex-shrink-0 text-gray-400" aria-hidden="true" />
            <span className="tabular-nums-finance">
              {t("settings.last_updated")}: {updatedAt}
            </span>
            <Badge variant={rateSourceVariant} size="sm" dot>
              {ratesSource}
            </Badge>
          </div>

          <Button
            type="button"
            size="sm"
            variant="outline"
            icon={RefreshCw}
            loading={isLoadingRates}
            onClick={() => void refreshRates()}
          >
            {isLoadingRates
              ? t("common.updating")
              : isEn
              ? "Refresh rates"
              : "Perbarui kurs"}
          </Button>
        </div>

        {ratesError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-200"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>
              {isEn
                ? "Server exchange rates could not be loaded; fallback rates are currently used."
                : "Kurs server belum dapat dimuat; nilai cadangan sedang dipakai."}
            </span>
          </div>
        )}
      </Card>

      {/* Tentang FinManage */}
      <Card>
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/70 dark:text-primary-400"
            aria-hidden="true"
          >
            <CircleHelp className="h-5 w-5" />
          </div>
          <div>
            <h3 className="section-title">{t("settings.about")}</h3>
            <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              {isEn
                ? "FinManage tracks your income, expenses, budgets, and savings goals. The application does not hold or move funds and does not connect to any bank account."
                : "FinManage mencatat pemasukan, pengeluaran, anggaran, dan tabungan. Aplikasi tidak menyimpan atau memindahkan uang dan tidak terhubung ke rekening bank."}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}