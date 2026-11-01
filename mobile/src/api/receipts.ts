import { Platform } from 'react-native';
import {
  ApiError,
  NETWORK_ERROR_CODE,
  REQUEST_TIMEOUT_CODE,
  type ApiErrorBody,
  type ApiSuccess,
  type ReceiptScanResponse,
} from '@/types/api';
import { API_URL, apiClient, normalizeError, SCAN_TIMEOUT_MS } from './client';
import { getToken } from './tokenStore';

export async function postReceiptConsent(): Promise<void> {
  await apiClient.post('/receipts/consent');
}

export async function deleteReceiptConsent(): Promise<void> {
  await apiClient.delete('/receipts/consent');
}

function isErrorBody(data: unknown): data is ApiErrorBody {
  if (typeof data !== 'object' || data === null || !('error' in data)) return false;
  const err = (data as { error: unknown }).error;
  return (
    typeof err === 'object' &&
    err !== null &&
    typeof (err as { code?: unknown }).code === 'string'
  );
}

export async function scanReceipt(imageUri: string): Promise<ReceiptScanResponse> {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    const blobRes = await fetch(imageUri);
    const blob = await blobRes.blob();
    formData.append('image', blob, 'receipt.jpg');
  } else {
    formData.append('image', {
      uri: imageUri,
      name: 'receipt.jpg',
      type: 'image/jpeg',
    } as unknown as Blob);
  }

  const token = await getToken();
  const baseUrl = API_URL.replace(/\/+$/, '');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SCAN_TIMEOUT_MS);

  try {
    // Do NOT set Content-Type manually here; React Native's fetch automatically
    // attaches "multipart/form-data; boundary=..." with the generated boundary.
    const response = await fetch(`${baseUrl}/receipts/scan`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
      signal: controller.signal,
    });

    const json: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      if (isErrorBody(json)) {
        throw new ApiError({
          code: json.error.code,
          message: json.error.message,
          details: json.error.details,
          status: response.status,
          serverMessage: json.error.message,
        });
      }
      const fallbackCode =
        response.status === 401
          ? 'UNAUTHORIZED'
          : response.status === 413
            ? 'FILE_TOO_LARGE'
            : response.status === 415
              ? 'UNSUPPORTED_FILE'
              : response.status === 429
                ? 'RATE_LIMITED'
                : response.status === 503
                  ? 'SCAN_FAILED'
                  : 'INTERNAL_ERROR';
      throw new ApiError({
        code: fallbackCode,
        message: `HTTP ${response.status}`,
        status: response.status,
      });
    }

    if (
      typeof json === 'object' &&
      json !== null &&
      'data' in json &&
      typeof (json as ApiSuccess<ReceiptScanResponse>).data === 'object'
    ) {
      return (json as ApiSuccess<ReceiptScanResponse>).data;
    }

    throw new ApiError({
      code: 'SCAN_FAILED',
      message: 'Invalid scan response',
      status: 503,
    });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError({
        code: REQUEST_TIMEOUT_CODE,
        message: 'Request timed out',
        status: 0,
      });
    }
    throw normalizeError(
      new ApiError({
        code: NETWORK_ERROR_CODE,
        message: err instanceof Error ? err.message : 'Network error',
        status: 0,
      }),
    );
  } finally {
    clearTimeout(timeoutId);
  }
}