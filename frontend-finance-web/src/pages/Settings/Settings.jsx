import React, { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useApp } from "../../context/AppContext";
import { useTranslation } from "../../hooks/useTranslation";
import {
  Moon,
  Sun,
  Globe,
  DollarSign,
  RefreshCw,
  Clock,
  AlertTriangle,
  Undo,
  Save,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

const Settings = () => {
  const { isDark, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const {
    currency,
    setCurrency,
    language,
    setLanguage,
    exchangeRates,
    isLoadingRates,
    ratesLastUpdated,
    refreshRates,
    createBackup,
    restoreBackup,
    hasBackup,
    getBackupList,
    clearBackups,
    resetDataWithBackup,
  } = useApp();

  // ===== STATE =====
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [resetError, setResetError] = useState("");
  const [hasBackupFlag, setHasBackupFlag] = useState(false);
  const [backupList, setBackupList] = useState([]);

  useEffect(() => {
    setHasBackupFlag(hasBackup());
    setBackupList(getBackupList());
  }, [hasBackup, getBackupList]);

  // ===== HANDLERS =====
  const handleCurrencyChange = (e) => {
    const newCurrency = e.target.value;
    setCurrency(newCurrency);
    toast.success(t('common.currency_changed', { currency: newCurrency }));
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    const langName = newLanguage === "id" ? "Bahasa Indonesia" : "English";
    toast.success(t('common.language_changed', { language: langName }));
  };

  const handleRefreshRates = () => {
    refreshRates();
  };

  const handleCreateBackup = () => {
    createBackup();
    setHasBackupFlag(hasBackup());
    setBackupList(getBackupList());
  };

  const handleRestoreBackup = () => {
    if (window.confirm(t('common.confirm_restore'))) {
      restoreBackup();
      setHasBackupFlag(hasBackup());
      setBackupList(getBackupList());
    }
  };

  const handleClearBackups = () => {
    if (window.confirm(t('common.confirm_clear_backups'))) {
      clearBackups();
      setHasBackupFlag(false);
      setBackupList([]);
    }
  };

  const handleResetData = () => {
    if (resetConfirmText !== "RESET") {
      setResetError(t('settings.type_reset_error') || 'Ketik "RESET" untuk konfirmasi.');
      return;
    }
    setResetError("");
    resetDataWithBackup();
    setShowResetModal(false);
    setResetConfirmText("");
    setHasBackupFlag(hasBackup());
    setBackupList(getBackupList());
    toast.success(t('settings.reset_success'));
  };

  const formatUpdateTime = (isoString) => {
    if (!isoString) return t('common.not_updated');
    const date = new Date(isoString);
    return date.toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatBackupTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          {t('settings.title')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Theme */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/70 dark:border-gray-800/70 p-5 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800">
            {isDark ? <Moon className="w-5 h-5 text-amber-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">{t('settings.theme')}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isDark ? t('settings.dark') : t('settings.light')}
            </p>
          </div>
        </div>
        <button
          onClick={toggleTheme}
          className={`relative w-11 h-6 rounded-full transition-colors ${isDark ? "bg-indigo-600" : "bg-gray-300"}`}
        >
          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isDark ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </div>

      {/* Currency */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/70 dark:border-gray-800/70 p-5 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800">
            <DollarSign className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">{t('settings.currency')}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {currency === "IDR" ? t('common.rupiah') : currency === "USD" ? t('common.dollar') : t('common.euro')}
            </p>
          </div>
        </div>
        <select
          value={currency}
          onChange={handleCurrencyChange}
          className="input-field w-32"
        >
          <option value="IDR">IDR (Rp)</option>
          <option value="USD">USD ($)</option>
          <option value="EUR">EUR (€)</option>
        </select>
      </div>

      {/* Language */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/70 dark:border-gray-800/70 p-5 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800">
            <Globe className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">{t('settings.language')}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {language === "id" ? "Bahasa Indonesia" : "English"}
            </p>
          </div>
        </div>
        <select
          value={language}
          onChange={handleLanguageChange}
          className="input-field w-32"
        >
          <option value="id">🇮🇩 Indonesia</option>
          <option value="en">🇬🇧 English</option>
        </select>
      </div>

      {/* Exchange Rates */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/70 dark:border-gray-800/70 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-900 dark:text-white">{t('settings.exchange_rates')}</h4>
          <button
            onClick={handleRefreshRates}
            disabled={isLoadingRates}
            className="btn btn-secondary btn-sm flex items-center gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingRates ? "animate-spin" : ""}`} />
            {isLoadingRates ? t('common.updating') : t('settings.refresh')}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <p className="text-xs text-gray-500 dark:text-gray-400">1 {t('common.usd')}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              Rp {exchangeRates?.USD?.toLocaleString("id-ID") || "—"}
            </p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <p className="text-xs text-gray-500 dark:text-gray-400">1 {t('common.eur')}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              Rp {exchangeRates?.EUR?.toLocaleString("id-ID") || "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-400 dark:text-gray-500">
          <Clock className="w-3 h-3" />
          <span>{t('settings.last_updated')}: {formatUpdateTime(ratesLastUpdated)}</span>
        </div>
      </div>

      {/* Backup & Restore */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/70 dark:border-gray-800/70 p-5 shadow-sm">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40">
            <Save className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">{t('settings.backup_restore')}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('settings.backup_description')}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleCreateBackup} className="btn btn-primary flex items-center gap-1.5">
            <Save className="w-4 h-4" />
            {t('settings.backup_now')}
          </button>
          {hasBackupFlag && (
            <>
              <button
                onClick={handleRestoreBackup}
                className="btn btn-secondary flex items-center gap-1.5"
              >
                <Undo className="w-4 h-4" />
                {t('settings.restore_backup')}
              </button>
              <button
                onClick={handleClearBackups}
                className="btn btn-ghost text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                {t('settings.clear_backups')}
              </button>
            </>
          )}
        </div>
        {backupList.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              {t('settings.backup_history')}:
            </p>
            <ul className="space-y-1">
              {backupList.slice(-3).reverse().map((backup, idx) => (
                <li key={idx} className="text-xs text-gray-600 dark:text-gray-300">
                  {formatBackupTime(backup.timestamp)} — {backup.transactionsCount} transaksi, {backup.goalsCount} target
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Reset Data */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/70 dark:border-gray-800/70 p-5 shadow-sm border-red-200 dark:border-red-800/50">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white text-red-600 dark:text-red-400">
              {t('settings.reset_data')}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('settings.reset_warning')}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowResetModal(true)}
          className="btn btn-danger"
        >
          {t('settings.reset_data')}
        </button>
      </div>

      {/* About */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/70 dark:border-gray-800/70 p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">F</span>
          </div>
          <h4 className="font-semibold text-gray-900 dark:text-white">{t('settings.about')}</h4>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('settings.about_description')}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('settings.about_tech')}
        </p>
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} FinManage — {t('app.tagline')}
          </p>
        </div>
      </div>

      {/* ===== MODAL RESET ===== */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('settings.confirm_reset')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              {t('settings.reset_confirm')}
            </p>
            <input
              type="text"
              value={resetConfirmText}
              onChange={(e) => {
                setResetConfirmText(e.target.value);
                setResetError("");
              }}
              placeholder={t('settings.type_reset')}
              className="input-field mb-2"
            />
            {resetError && <p className="text-xs text-danger mb-2">{resetError}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setResetConfirmText("");
                  setResetError("");
                }}
                className="flex-1 btn btn-secondary"
              >
                {t('settings.cancel')}
              </button>
              <button
                onClick={handleResetData}
                className={`flex-1 btn btn-danger ${resetConfirmText !== "RESET" ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={resetConfirmText !== "RESET"}
              >
                {t('settings.reset_confirm_button')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;