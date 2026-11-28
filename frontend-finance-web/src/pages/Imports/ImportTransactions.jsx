import React, { useRef, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Info,
  Upload,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../../components/common/PageHeader";
import ErrorState from "../../components/common/ErrorState";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import SkeletonLoader from "../../components/ui/SkeletonLoader";
import { importService } from "../../api/services/imports.js";
import {
  useImportMutation,
  useImportPreview,
  useImportSpec,
} from "../../hooks/queries";
import { apiMessage } from "../../lib/apiMessage";
import { useTranslation } from "../../hooks/useTranslation";
import { formatCurrency } from "../../utils/formatters";
import { formatApiDate } from "../../lib/format";

function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ImportTransactions() {
  const { t, language } = useTranslation();
  const isEn = language === "en";
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState("create");
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [result, setResult] = useState(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  const spec = useImportSpec();
  const previewMutation = useImportPreview();
  const commitMutation = useImportMutation(importService.commit);

  const maxFileBytes = spec.data?.limits?.maxFileBytes ?? 2_097_152;
  const maxFileMB = Math.round(maxFileBytes / 1_048_576);
  const maxRows = spec.data?.limits?.maxRows ?? 1000;

  const chooseFile = (e) => {
    const picked = e.target.files?.[0];
    e.target.value = "";
    if (!picked) return;

    setError(null);
    setPreview(null);
    setResult(null);

    if (!picked.name.toLowerCase().endsWith(".xlsx")) {
      setError({
        message: isEn
          ? "Please select an Excel file in .xlsx format."
          : "Pilih file Excel dengan format .xlsx.",
      });
      return;
    }
    if (picked.size > maxFileBytes) {
      setError({
        message: isEn
          ? `File size exceeds the ${maxFileMB} MB limit.`
          : `Ukuran file melebihi batas ${maxFileMB} MB.`,
      });
      return;
    }
    setFile(picked);
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setError(null);
  };

  const loadPreview = async () => {
    if (!file) return;
    setError(null);
    setResult(null);
    try {
      const data = await previewMutation.mutateAsync(file);
      setPreview(data);
    } catch (err) {
      setError({ message: apiMessage(t, err), details: err.details });
    }
  };

  const downloadTemplate = async () => {
    setError(null);
    setDownloadingTemplate(true);
    try {
      const res = await importService.template();
      saveBlob(res.data, "FinManage_Template_Import.xlsx");
      toast.success(
        isEn ? "Import template downloaded." : "Template impor berhasil diunduh."
      );
    } catch (err) {
      const message = apiMessage(t, err);
      setError({ message });
      toast.error(message);
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const rowsToCommit = (preview?.rows ?? [])
    .filter((r) => r.status === "valid" && (!skipDuplicates || !r.duplicate))
    .map(({ type, category, amount, transactionDate, description }) => ({
      type,
      category,
      amount: Number(amount),
      transactionDate,
      description: description || "",
    }));

  const commit = async () => {
    setError(null);
    try {
      const data = await commitMutation.mutateAsync({
        unknownCategoryMode: mode,
        skipDuplicates,
        rows: rowsToCommit,
      });
      setResult(data);
      setPreview(null);
      setFile(null);
      toast.success(isEn ? "Import completed." : "Impor selesai.");
    } catch (err) {
      setError({ message: apiMessage(t, err), details: err.details });
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader
        title={t("nav.import")}
        subtitle={
          isEn
            ? "Files are validated by the server first. Transactions are only saved after you confirm."
            : "File diperiksa terlebih dahulu oleh server. Data baru disimpan setelah Anda mengonfirmasi."
        }
        icon={FileSpreadsheet}
        className="mb-0"
      />

      {/* Hasil Impor Berhasil */}
      {result && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-100"
        >
          <CheckCircle2
            className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <p className="font-semibold">
              {isEn ? "Import completed" : "Impor selesai"}
            </p>
            <p className="tabular-nums-finance text-xs sm:text-sm">
              {isEn ? "Imported" : "Berhasil"}:{" "}
              <strong>{result.imported ?? 0}</strong> ·{" "}
              {isEn ? "Skipped" : "Dilewati"}:{" "}
              <strong>{result.skipped ?? 0}</strong>
              {result.createdCategories?.length > 0 && (
                <>
                  {" "}
                  · {isEn ? "New categories" : "Kategori baru"}:{" "}
                  <strong>{result.createdCategories.join(", ")}</strong>
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Tahap 1: Aturan File & Unduh Template */}
      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="primary" size="sm">
                {isEn ? "Step 1" : "Langkah 1"}
              </Badge>
              <h3 className="section-title">
                {isEn ? "File rules & template" : "Aturan file & template"}
              </h3>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {isEn
                ? `Excel .xlsx up to ${maxFileMB} MB and ${maxRows.toLocaleString("en-US")} rows. Columns ${
                    spec.data?.ignoredColumns?.join(" & ") || "No & Hari"
                  } are ignored.`
                : `File .xlsx maksimal ${maxFileMB} MB dan ${maxRows.toLocaleString("id-ID")} baris. Kolom ${
                    spec.data?.ignoredColumns?.join(" dan ") || "No dan Hari"
                  } diabaikan.`}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            icon={Download}
            loading={downloadingTemplate}
            onClick={downloadTemplate}
          >
            {isEn ? "Download template" : "Unduh template"}
          </Button>
        </div>

        {spec.isLoading ? (
          <SkeletonLoader variant="table" />
        ) : spec.isError ? (
          <ErrorState
            message={
              apiMessage(t, spec.error) ||
              (isEn ? "Failed to load import rules." : "Gagal mengambil aturan impor.")
            }
            onRetry={() => spec.refetch()}
            retryText={t("common.retry")}
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200/90 dark:border-gray-800/90">
            <table className="w-full border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-gray-800/50">
                  <th className="px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {isEn ? "Column" : "Kolom"}
                  </th>
                  <th className="px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t("common.status")}
                  </th>
                  <th className="px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {isEn ? "Format / Allowed values" : "Format / Nilai"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800/80 dark:bg-gray-900">
                {(spec.data?.columns ?? []).map((col) => (
                  <tr key={col.name}>
                    <td className="whitespace-nowrap px-3.5 py-2.5 font-medium text-gray-900 dark:text-white">
                      {col.name}
                    </td>
                    <td className="whitespace-nowrap px-3.5 py-2.5">
                      <Badge
                        variant={col.required ? "primary" : "gray"}
                        size="sm"
                      >
                        {col.required
                          ? isEn
                            ? "Required"
                            : "Wajib"
                          : isEn
                          ? "Optional"
                          : "Opsional"}
                      </Badge>
                    </td>
                    <td className="px-3.5 py-2.5 text-gray-600 dark:text-gray-300">
                      {col.format ||
                        (col.allowed
                          ? col.allowed.join(", ")
                          : col.emptyCellAllowed
                          ? isEn
                            ? "Can be empty"
                            : "Boleh kosong"
                          : "—")}
                      {col.allowed && col.format
                        ? ` · ${col.allowed.join(", ")}`
                        : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Tahap 2: Pilih & Periksa File */}
      <Card className="space-y-4 p-5">
        <div className="flex items-center gap-2">
          <Badge variant="primary" size="sm">
            {isEn ? "Step 2" : "Langkah 2"}
          </Badge>
          <h3 className="section-title">
            {isEn ? "Upload & validate file" : "Pilih & periksa file"}
          </h3>
        </div>

        <input
          id="import-xlsx-input"
          ref={inputRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="sr-only"
          onChange={chooseFile}
        />

        <div className="flex flex-col justify-between gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-gray-800/40 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/70 dark:text-primary-400"
              aria-hidden="true"
            >
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              {file ? (
                <>
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {file.name}
                  </p>
                  <p className="tabular-nums-finance text-xs text-gray-500 dark:text-gray-400">
                    {formatBytes(file.size)} · .xlsx
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {isEn ? "No file selected yet" : "Belum ada file dipilih"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {isEn
                      ? `Select an .xlsx file (max ${maxFileMB} MB)`
                      : `Pilih file Excel .xlsx (maks ${maxFileMB} MB)`}
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={FileSpreadsheet}
              onClick={() => inputRef.current?.click()}
              disabled={previewMutation.isPending || commitMutation.isPending}
            >
              {file
                ? isEn
                  ? "Change file"
                  : "Ganti file"
                : isEn
                ? "Choose .xlsx file"
                : "Pilih file .xlsx"}
            </Button>

            {file && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={X}
                onClick={clearFile}
                disabled={previewMutation.isPending || commitMutation.isPending}
                aria-label={isEn ? "Remove selected file" : "Hapus file terpilih"}
              />
            )}

            <Button
              type="button"
              size="sm"
              icon={Upload}
              loading={previewMutation.isPending}
              disabled={!file || previewMutation.isPending || commitMutation.isPending}
              onClick={loadPreview}
            >
              {previewMutation.isPending
                ? isEn
                  ? "Checking..."
                  : "Memeriksa..."
                : isEn
                ? "Validate file"
                : "Periksa file"}
            </Button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <p className="font-medium">{error.message}</p>
            </div>
            {error.details?.unknown?.length > 0 && (
              <p className="pl-6 text-xs">
                {isEn
                  ? "Unrecognized columns (remove or rename): "
                  : "Kolom tidak dikenal (hapus atau ubah nama): "}
                <strong>{error.details.unknown.join(", ")}</strong>
              </p>
            )}
            {error.details?.missing?.length > 0 && (
              <p className="pl-6 text-xs">
                {isEn ? "Missing required columns: " : "Kolom wajib yang kurang: "}
                <strong>{error.details.missing.join(", ")}</strong>
              </p>
            )}
          </div>
        )}
      </Card>

      {/* Tahap 3: Hasil Pemeriksaan & Konfirmasi Impor */}
      {preview && (
        <Card className="space-y-5 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="primary" size="sm">
                  {isEn ? "Step 3" : "Langkah 3"}
                </Badge>
                <h3 className="section-title">
                  {isEn ? "Validation preview" : "Hasil pemeriksaan"}
                </h3>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {isEn
                  ? "Review the rows below before confirming. Nothing has been saved yet."
                  : "Tinjau baris di bawah sebelum konfirmasi. Belum ada data yang disimpan."}
              </p>
            </div>
          </div>

          {/* 4 Kartu Ringkasan Preview */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                label: isEn ? "Total rows" : "Total baris",
                value: preview.totalRows ?? 0,
                tone: "text-gray-900 dark:text-white",
              },
              {
                label: isEn ? "Valid" : "Valid",
                value: preview.validCount ?? 0,
                tone: "text-emerald-600 dark:text-emerald-400",
              },
              {
                label: isEn ? "Invalid" : "Bermasalah",
                value: preview.invalidCount ?? 0,
                tone: "text-rose-600 dark:text-rose-400",
              },
              {
                label: isEn ? "Duplicates" : "Duplikat",
                value: preview.duplicateCount ?? 0,
                tone: "text-amber-600 dark:text-amber-400",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-gray-200/80 bg-gray-50/80 p-3.5 dark:border-gray-800 dark:bg-gray-800/40"
              >
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {stat.label}
                </p>
                <p className={`tabular-nums-finance mt-1 text-xl font-bold ${stat.tone}`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Opsi Impor */}
          <div className="space-y-3 rounded-xl border border-gray-200/80 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-800/40">
            {preview.unknownCategories?.length > 0 && (
              <div>
                <label htmlFor="import-unknown-cat" className="label">
                  {isEn
                    ? "Unrecognized categories"
                    : "Kategori yang belum dikenal"}
                </label>
                <select
                  id="import-unknown-cat"
                  className="input-field max-w-md"
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                >
                  <option value="create">
                    {isEn
                      ? "Create categories automatically"
                      : "Buat kategori otomatis"}
                  </option>
                  <option value="other">
                    {isEn
                      ? "Assign to Other category"
                      : "Masukkan ke kategori Other"}
                  </option>
                </select>
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  {preview.unknownCategories.join(", ")}
                </p>
              </div>
            )}

            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-700 dark:text-gray-200">
              <input
                type="checkbox"
                checked={skipDuplicates}
                onChange={(e) => setSkipDuplicates(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600"
              />
              <span>
                {isEn
                  ? "Skip duplicate transactions"
                  : "Lewati transaksi duplikat"}
              </span>
            </label>
          </div>

          {/* Tabel Preview Baris */}
          <div className="max-h-96 overflow-auto rounded-xl border border-gray-200/90 dark:border-gray-800/90">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800">
                <tr>
                  <th className="px-3 py-2.5 font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {isEn ? "Row" : "Baris"}
                  </th>
                  <th className="px-3 py-2.5 font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t("common.status")}
                  </th>
                  <th className="px-3 py-2.5 font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t("transactions.date")}
                  </th>
                  <th className="px-3 py-2.5 font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t("transactions.type")}
                  </th>
                  <th className="px-3 py-2.5 font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t("transactions.category")}
                  </th>
                  <th className="px-3 py-2.5 font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t("transactions.description")}
                  </th>
                  <th className="px-3 py-2.5 text-right font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t("transactions.amount")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800/80 dark:bg-gray-900">
                {(preview.rows ?? []).map((r) => {
                  const isValid = r.status === "valid";
                  const badgeVariant = !isValid
                    ? "danger"
                    : r.duplicate
                    ? "warning"
                    : "success";
                  const statusLabel = !isValid
                    ? isEn
                      ? "Invalid"
                      : "Bermasalah"
                    : r.duplicate
                    ? isEn
                      ? "Duplicate"
                      : "Duplikat"
                    : "Valid";

                  return (
                    <tr key={r.row} className="align-top">
                      <td className="tabular-nums-finance whitespace-nowrap px-3 py-2.5 font-medium text-gray-500 dark:text-gray-400">
                        #{r.row}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge variant={badgeVariant} size="sm">
                          {statusLabel}
                        </Badge>
                        {r.errors?.length > 0 && (
                          <p className="mt-1 max-w-xs text-[11px] leading-snug text-rose-600 dark:text-rose-400">
                            {r.errors.join("; ")}
                          </p>
                        )}
                      </td>
                      <td className="tabular-nums-finance whitespace-nowrap px-3 py-2.5 text-gray-700 dark:text-gray-200">
                        {r.transactionDate
                          ? formatApiDate(r.transactionDate, language)
                          : "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-gray-700 dark:text-gray-200">
                        {r.type === "income"
                          ? t("transactions.income")
                          : r.type === "expense"
                          ? t("transactions.expense")
                          : "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-gray-700 dark:text-gray-200">
                        {r.category || "—"}
                      </td>
                      <td className="max-w-[200px] truncate px-3 py-2.5 text-gray-600 dark:text-gray-300">
                        {r.description || "—"}
                      </td>
                      <td className="tabular-nums-finance whitespace-nowrap px-3 py-2.5 text-right font-semibold text-gray-900 dark:text-white">
                        {r.amount !== null && r.amount !== undefined
                          ? formatCurrency(Number(r.amount), "IDR")
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Aksi Konfirmasi */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
            <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              {rowsToCommit.length > 0 ? (
                <>
                  <Info className="h-4 w-4 flex-shrink-0 text-primary-500" aria-hidden="true" />
                  <span>
                    {isEn
                      ? `${rowsToCommit.length} row(s) ready to be saved to your account.`
                      : `${rowsToCommit.length} baris siap disimpan ke akun Anda.`}
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-500" aria-hidden="true" />
                  <span>
                    {isEn
                      ? "No valid rows available to import."
                      : "Tidak ada baris valid yang dapat diimpor."}
                  </span>
                </>
              )}
            </p>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={clearFile}
                disabled={commitMutation.isPending}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="button"
                loading={commitMutation.isPending}
                disabled={!rowsToCommit.length || commitMutation.isPending}
                onClick={commit}
              >
                {commitMutation.isPending
                  ? isEn
                    ? "Saving..."
                    : "Menyimpan..."
                  : isEn
                  ? `Confirm import (${rowsToCommit.length})`
                  : `Konfirmasi impor (${rowsToCommit.length})`}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}