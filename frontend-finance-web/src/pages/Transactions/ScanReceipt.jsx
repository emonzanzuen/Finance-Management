import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  AlertCircle,
  AlertTriangle,
  Camera,
  CheckCircle2,
  ScanLine,
  ShieldCheck,
  ShieldOff,
  X,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PageHeader from "../../components/common/PageHeader";
import ErrorState from "../../components/common/ErrorState";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import SkeletonLoader from "../../components/ui/SkeletonLoader";
import { authService } from "../../api/services/auth.js";
import { receiptService } from "../../api/services/receipts.js";
import { useApp } from "../../context/AppContext";
import { useCategories, useCreateTransaction } from "../../hooks/queries";
import { useTranslation } from "../../hooks/useTranslation";
import { apiMessage } from "../../lib/apiMessage";
import { todayWIB } from "../../lib/rules";
import { formatCurrencyWithRate } from "../../utils/formatters";

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ScanReceipt() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const qc = useQueryClient();
  const { t, language } = useTranslation();
  const isEn = language === "en";
  const { currency, exchangeRates } = useApp();

  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: authService.profile,
  });

  const [accepted, setAccepted] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [result, setResult] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [consentBusy, setConsentBusy] = useState(false);
  const [scanBusy, setScanBusy] = useState(false);

  const type = form?.type || "expense";
  const categories = useCategories(type);
  const create = useCreateTransaction();
  const consent = Boolean(profile.data?.receiptScanConsent);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const saveFile = (e) => {
    const next = e.target.files?.[0];
    e.target.value = "";
    if (!next) return;
    setError("");

    if (!/^image\/(jpeg|png)$/.test(next.type)) {
      setError(
        isEn
          ? "Please select a JPEG or PNG image."
          : "Pilih gambar berformat JPEG atau PNG."
      );
      return;
    }
    if (next.size > MAX_IMAGE_BYTES) {
      setError(
        isEn
          ? "Receipt image size exceeds the 3 MB limit."
          : "Ukuran foto nota maksimal 3 MB."
      );
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(next);
    setPreviewUrl(URL.createObjectURL(next));
    setResult(null);
    setForm(null);
  };

  const clearImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl("");
    setResult(null);
    setForm(null);
    setError("");
  };

  const runScan = async () => {
    if (!file) return;
    setScanBusy(true);
    setError("");
    try {
      const data = await receiptService.scan(file);
      setResult(data);
      setForm({
        type: data.type || "expense",
        amount: data.amount ? String(data.amount) : "",
        transactionDate: data.transactionDate || todayWIB(),
        description: data.description || "",
        categoryId: data.suggestedCategoryId || "",
      });
    } catch (e) {
      setError(apiMessage(t, e));
    } finally {
      setScanBusy(false);
    }
  };

  const acceptConsent = async () => {
    setConsentBusy(true);
    setError("");
    try {
      await receiptService.grantConsent();
      await qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success(
        isEn ? "Receipt scan consent saved." : "Persetujuan scan nota disimpan."
      );
    } catch (e) {
      setError(apiMessage(t, e));
    } finally {
      setConsentBusy(false);
    }
  };

  const confirmRevokeConsent = async () => {
    setConsentBusy(true);
    setError("");
    try {
      await receiptService.revokeConsent();
      await qc.invalidateQueries({ queryKey: ["profile"] });
      clearImage();
      setAccepted(false);
      toast.success(
        isEn ? "Receipt scan consent revoked." : "Persetujuan scan nota dicabut."
      );
    } catch (e) {
      setError(apiMessage(t, e));
    } finally {
      setConsentBusy(false);
      setRevokeOpen(false);
    }
  };

  const saveTransaction = async (e) => {
    e.preventDefault();
    setError("");

    const numericAmount = Number(form?.amount);
    if (!form?.categoryId) {
      setError(isEn ? "Please select a category." : "Pilih kategori terlebih dahulu.");
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount < 1) {
      setError(
        isEn ? "Amount must be greater than 0." : "Nominal harus lebih dari 0."
      );
      return;
    }

    try {
      await create.mutateAsync({
        type: form.type,
        categoryId: form.categoryId,
        amount: Math.round(numericAmount),
        transactionDate: form.transactionDate,
        description: form.description.trim(),
      });
      toast.success(
        isEn ? "Transaction saved." : "Transaksi berhasil disimpan."
      );
      navigate("/transactions");
    } catch (err) {
      setError(apiMessage(t, err));
    }
  };

  const confidenceVariant =
    result?.confidence === "high"
      ? "success"
      : result?.confidence === "medium"
      ? "warning"
      : "gray";

  const amountPreview = Number(form?.amount || 0);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        title={t("nav.scan_receipt")}
        subtitle={
          isEn
            ? "Scan results are suggestions only. Review and confirm before saving."
            : "Hasil pemindaian hanya usulan. Periksa dan simpan sendiri setelah sesuai."
        }
        icon={ScanLine}
        className="mb-0"
      />

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Seksi Persetujuan Privasi */}
      {profile.isLoading ? (
        <SkeletonLoader variant="card" />
      ) : profile.isError ? (
        <Card padding={false}>
          <ErrorState
            message={
              apiMessage(t, profile.error) ||
              (isEn ? "Failed to check consent status." : "Gagal memeriksa status persetujuan.")
            }
            onRetry={() => profile.refetch()}
            retryText={t("common.retry")}
          />
        </Card>
      ) : (
        <>
          <Card className="space-y-4 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${
                    consent
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                      : "bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400"
                  }`}
                  aria-hidden="true"
                >
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="section-title">
                      {isEn ? "Privacy consent" : "Persetujuan privasi"}
                    </h3>
                    <Badge variant={consent ? "success" : "warning"} size="sm" dot>
                      {consent
                        ? isEn
                          ? "Active"
                          : "Aktif"
                        : isEn
                        ? "Required"
                        : "Diperlukan"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                    {isEn
                      ? "Receipt photos are sent to a third-party AI service for extraction and are not stored by FinManage. Do not upload ID cards, payment cards, or bank transfer proofs."
                      : "Gambar nota akan dikirim ke layanan AI pihak ketiga untuk dibaca dan tidak disimpan oleh aplikasi. Jangan unggah KTP, kartu pembayaran, atau bukti transfer."}
                  </p>
                </div>
              </div>
            </div>

            {consent ? (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3.5 dark:border-gray-800">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {isEn
                      ? "You can upload and scan receipt photos below."
                      : "Anda dapat mengunggah dan memindai foto nota di bawah ini."}
                  </span>
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  icon={ShieldOff}
                  disabled={consentBusy || scanBusy}
                  onClick={() => setRevokeOpen(true)}
                  className="text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                >
                  {isEn ? "Revoke consent" : "Cabut persetujuan"}
                </Button>
              </div>
            ) : (
              <div className="space-y-3 border-t border-gray-100 pt-3.5 dark:border-gray-800">
                <label className="flex cursor-pointer items-start gap-2.5 text-sm text-gray-700 dark:text-gray-200">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600"
                  />
                  <span>
                    {isEn
                      ? "I understand and consent to sending receipt photos for processing."
                      : "Saya memahami dan menyetujui pengiriman foto nota untuk diproses."}
                  </span>
                </label>
                <Button
                  type="button"
                  loading={consentBusy}
                  disabled={!accepted || consentBusy}
                  onClick={acceptConsent}
                >
                  {consentBusy
                    ? isEn
                      ? "Saving..."
                      : "Menyimpan..."
                    : isEn
                    ? "Agree and continue"
                    : "Setujui dan lanjutkan"}
                </Button>
              </div>
            )}
          </Card>

          {/* Seksi Unggah & Pindai */}
          {consent && (
            <Card className="space-y-4 p-5">
              <div>
                <h3 className="section-title">
                  {isEn ? "Upload receipt photo" : "Unggah foto nota"}
                </h3>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {isEn
                    ? "Supported formats: JPEG or PNG, maximum 3 MB."
                    : "Format didukung: JPEG atau PNG, maksimal 3 MB."}
                </p>
              </div>

              <input
                id="receipt-image-input"
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png"
                capture="environment"
                className="sr-only"
                onChange={saveFile}
              />

              <div className="flex flex-col justify-between gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-gray-800/40 sm:flex-row sm:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/70 dark:text-primary-400"
                    aria-hidden="true"
                  >
                    <Camera className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    {file ? (
                      <>
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                          {file.name}
                        </p>
                        <p className="tabular-nums-finance text-xs text-gray-500 dark:text-gray-400">
                          {formatBytes(file.size)}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          {isEn ? "No receipt photo selected" : "Belum ada foto nota dipilih"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          JPEG / PNG · maks 3 MB
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    icon={Camera}
                    onClick={() => inputRef.current?.click()}
                    disabled={scanBusy || create.isPending}
                  >
                    {file
                      ? isEn
                        ? "Change photo"
                        : "Ganti foto"
                      : isEn
                      ? "Choose photo"
                      : "Pilih foto nota"}
                  </Button>
                  {file && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      icon={X}
                      onClick={clearImage}
                      disabled={scanBusy || create.isPending}
                      aria-label={isEn ? "Remove photo" : "Hapus foto"}
                    />
                  )}
                  <Button
                    type="button"
                    size="sm"
                    icon={ScanLine}
                    loading={scanBusy}
                    disabled={!file || scanBusy || create.isPending}
                    onClick={runScan}
                  >
                    {scanBusy
                      ? isEn
                        ? "Scanning..."
                        : "Memindai..."
                      : isEn
                      ? "Scan receipt"
                      : "Pindai"}
                  </Button>
                </div>
              </div>

              {previewUrl && (
                <div className="overflow-hidden rounded-xl border border-gray-200/90 bg-gray-50 p-2 dark:border-gray-800 dark:bg-gray-950/60">
                  <img
                    src={previewUrl}
                    alt={isEn ? "Receipt preview" : "Pratinjau nota"}
                    className="mx-auto max-h-72 rounded-lg object-contain"
                  />
                </div>
              )}

              {/* Hasil Usulan & Form Tinjau Sebelum Simpan */}
              {result && form && (
                <form
                  className="space-y-4 border-t border-gray-100 pt-5 dark:border-gray-800"
                  onSubmit={saveTransaction}
                  noValidate
                >
                  <div className="space-y-2 rounded-xl border border-amber-200/90 bg-amber-50/80 p-3.5 text-xs text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-100">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 font-semibold">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                        <span>
                          {isEn
                            ? "Draft suggestion — not saved yet. Verify all fields."
                            : "Usulan hasil pindai — belum tersimpan. Periksa semua kolom."}
                        </span>
                      </span>
                      <Badge variant={confidenceVariant} size="sm">
                        {isEn ? "Confidence" : "Keyakinan"}: {result.confidence || "—"}
                      </Badge>
                    </div>
                    {result.warnings?.length > 0 && (
                      <ul className="list-disc space-y-0.5 pl-6">
                        {result.warnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="form-row">
                    <div>
                      <label htmlFor="scan-type" className="label">
                        {t("transactions.type")}
                      </label>
                      <select
                        id="scan-type"
                        className="input-field"
                        value={form.type}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            type: e.target.value,
                            categoryId: "",
                          }))
                        }
                      >
                        <option value="expense">{t("transactions.expense")}</option>
                        <option value="income">{t("transactions.income")}</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="scan-category" className="label">
                        {t("transactions.category")}
                      </label>
                      <select
                        id="scan-category"
                        required
                        className="input-field"
                        value={form.categoryId}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            categoryId: e.target.value,
                          }))
                        }
                      >
                        <option value="">{t("transactions.select_category")}</option>
                        {(categories.data ?? []).map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div>
                      <label htmlFor="scan-amount" className="label">
                        {t("transactions.amount")} (IDR)
                      </label>
                      <div className="relative">
                        <span
                          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400"
                          aria-hidden="true"
                        >
                          Rp
                        </span>
                        <input
                          id="scan-amount"
                          required
                          min="1"
                          step="1"
                          type="number"
                          inputMode="numeric"
                          className="input-field tabular-nums-finance pl-10 font-semibold"
                          value={form.amount}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, amount: e.target.value }))
                          }
                        />
                      </div>
                      {currency !== "IDR" && amountPreview > 0 && (
                        <p className="tabular-nums-finance mt-1 text-xs text-gray-500 dark:text-gray-400">
                          ≈ {formatCurrencyWithRate(amountPreview, currency, exchangeRates)}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="scan-date" className="label">
                        {t("transactions.date")}
                      </label>
                      <input
                        id="scan-date"
                        required
                        type="date"
                        max={todayWIB()}
                        className="input-field tabular-nums-finance"
                        value={form.transactionDate}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            transactionDate: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="scan-desc" className="label">
                      {t("transactions.description")}
                    </label>
                    <input
                      id="scan-desc"
                      className="input-field"
                      maxLength={255}
                      value={form.description}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button
                      type="submit"
                      loading={create.isPending}
                      disabled={create.isPending || !form.categoryId}
                    >
                      {create.isPending
                        ? isEn
                          ? "Saving..."
                          : "Menyimpan..."
                        : isEn
                        ? "Save reviewed transaction"
                        : "Simpan transaksi setelah diperiksa"}
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          )}
        </>
      )}

      {/* Dialog Konfirmasi Cabut Persetujuan */}
      <ConfirmDialog
        isOpen={revokeOpen}
        onClose={() => !consentBusy && setRevokeOpen(false)}
        onConfirm={confirmRevokeConsent}
        loading={consentBusy}
        title={isEn ? "Revoke receipt scan consent?" : "Cabut persetujuan scan nota?"}
        message={
          isEn
            ? "You will need to grant consent again before scanning receipt photos."
            : "Anda perlu memberikan persetujuan kembali sebelum dapat memindai foto nota."
        }
        confirmText={isEn ? "Revoke" : "Ya, cabut"}
        cancelText={t("common.cancel")}
      />
    </div>
  );
}