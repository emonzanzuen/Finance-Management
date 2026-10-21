import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  ApiError,
  type ApiSuccess,
  type ImportCommitInput,
  type ImportCommitResponse,
  type ImportPreviewResponse,
  type ImportSpecResponse,
} from '@/types/api';
import { API_URL, apiClient, normalizeError } from './client';
import { getToken } from './tokenStore';

export type PickedExcelFile = {
  uri: string;
  name: string;
  mimeType?: string;
  file?: globalThis.File;
};

export async function getImportSpec(): Promise<ImportSpecResponse> {
  const response = await apiClient.get<ApiSuccess<ImportSpecResponse>>('/imports/spec');
  return response.data.data;
}

export async function downloadImportTemplate(): Promise<void> {
  const filename = 'FinManage_Template_Import.xlsx';
  const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  if (Platform.OS === 'web') {
    const response = await apiClient.get<Blob>('/imports/template', {
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
  const downloadUrl = `${baseUrl}/imports/template`;
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
        message: 'Terlalu banyak permintaan. Coba lagi sebentar lagi.',
        status: 429,
      });
    }
    throw normalizeError(err);
  }
}

export async function previewTransactionsImport(
  picked: PickedExcelFile,
): Promise<ImportPreviewResponse> {
  const formData = new FormData();
  const mimeType =
    picked.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  if (Platform.OS === 'web' && picked.file) {
    formData.append('file', picked.file, picked.name);
  } else {
    formData.append('file', {
      uri: picked.uri,
      name: picked.name,
      type: mimeType,
    } as unknown as Blob);
  }

  const response = await apiClient.post<ApiSuccess<ImportPreviewResponse>>(
    '/imports/transactions/preview',
    formData,
    {
      headers: Platform.OS === 'web' ? undefined : { 'Content-Type': 'multipart/form-data' },
    },
  );
  const d = response.data.data;
  return {
    totalRows: Number(d.totalRows ?? 0),
    validCount: Number(d.validCount ?? 0),
    invalidCount: Number(d.invalidCount ?? 0),
    duplicateCount: Number(d.duplicateCount ?? 0),
    unknownCategories: d.unknownCategories ?? [],
    rows: (d.rows ?? []).map((r) => ({
      ...r,
      row: Number(r.row),
      ...(r.amount !== undefined ? { amount: Number(r.amount) } : {}),
    })),
  };
}

export async function commitTransactionsImport(
  input: ImportCommitInput,
): Promise<ImportCommitResponse> {
  const response = await apiClient.post<ApiSuccess<ImportCommitResponse>>(
    '/imports/transactions/commit',
    input,
  );
  const d = response.data.data;
  return {
    imported: Number(d.imported ?? 0),
    skipped: Number(d.skipped ?? 0),
    createdCategories: d.createdCategories ?? [],
  };
}
