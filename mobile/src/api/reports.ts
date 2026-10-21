import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  ApiError,
  type ApiSuccess,
  type MonthlyReportResponse,
  type ReportExportFormat,
  type YearlyTrendResponse,
} from '@/types/api';
import { API_URL, apiClient, normalizeError } from './client';
import { getToken } from './tokenStore';

export async function getMonthlyReport(
  month: number,
  year: number,
): Promise<MonthlyReportResponse> {
  const response = await apiClient.get<ApiSuccess<MonthlyReportResponse>>('/reports/monthly', {
    params: { month, year },
  });
  const d = response.data.data;
  return {
    ...d,
    income: Number(d.income ?? 0),
    expense: Number(d.expense ?? 0),
    difference: Number(d.difference ?? 0),
    expenseByCategory: (d.expenseByCategory ?? []).map((item) => ({
      ...item,
      amount: Number(item.amount ?? 0),
      percentage: Number(item.percentage ?? 0),
    })),
    incomeByCategory: (d.incomeByCategory ?? []).map((item) => ({
      ...item,
      amount: Number(item.amount ?? 0),
      percentage: Number(item.percentage ?? 0),
    })),
  };
}

export async function getYearlyTrend(year: number): Promise<YearlyTrendResponse> {
  const response = await apiClient.get<ApiSuccess<YearlyTrendResponse>>('/reports/trend', {
    params: { year },
  });
  const d = response.data.data;
  return {
    ...d,
    months: (d.months ?? []).map((m) => ({
      ...m,
      income: Number(m.income ?? 0),
      expense: Number(m.expense ?? 0),
    })),
  };
}

export async function exportReportFile(
  format: ReportExportFormat,
  month: number,
  year: number,
): Promise<void> {
  const paddedMonth = String(month).padStart(2, '0');
  const filename = `FinManage_Laporan_${year}-${paddedMonth}.${format}`;
  const mimeType =
    format === 'pdf'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  if (Platform.OS === 'web') {
    const response = await apiClient.get<Blob>('/reports/export', {
      params: { format, month, year },
      responseType: 'blob',
    });
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    }
    return;
  }

  const token = await getToken();
  const baseUrl = API_URL.replace(/\/+$/, '');
  const downloadUrl = `${baseUrl}/reports/export?format=${encodeURIComponent(format)}&month=${encodeURIComponent(String(month))}&year=${encodeURIComponent(String(year))}`;
  const targetFile = new File(Paths.cache, filename);

  try {
    const downloaded = await File.downloadFileAsync(downloadUrl, targetFile, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      idempotent: true,
    });
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(downloaded.uri, {
        mimeType,
        dialogTitle: filename,
      });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('429')) {
      throw new ApiError({
        code: 'RATE_LIMITED',
        message: 'Terlalu banyak permintaan ekspor. Coba lagi sebentar lagi.',
        status: 429,
      });
    }
    if (msg.includes('400')) {
      throw new ApiError({
        code: 'VALIDATION_ERROR',
        message: 'Jumlah transaksi melebihi batas ekspor (maksimal 5.000 baris).',
        status: 400,
      });
    }
    throw normalizeError(err);
  }
}

