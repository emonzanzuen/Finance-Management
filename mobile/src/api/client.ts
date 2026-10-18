import { AxiosError, create, isAxiosError, type AxiosInstance } from 'axios';
import { ApiError, NETWORK_ERROR_CODE, type ApiErrorBody } from '@/types/api';
import { getToken } from './tokenStore';

export const FIRST_REQUEST_TIMEOUT_MS = 60_000;
export const DEFAULT_TIMEOUT_MS = 20_000;

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

let firstRequestDone = false;
let unauthorizedHandler: (() => void) | null = null;

/** Register the handler invoked on any 401 (AuthContext wires signOut here). */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

/** Host part of the configured API URL only (never includes path, query, or token). */
export function getApiHost(): string {
  try {
    return new URL(API_URL).host;
  } catch {
    return '';
  }
}

function isErrorBody(data: unknown): data is ApiErrorBody {
  if (typeof data !== 'object' || data === null || !('error' in data)) return false;
  const err = (data as { error: unknown }).error;
  return typeof err === 'object' && err !== null && typeof (err as { code?: unknown }).code === 'string';
}

export function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (status !== undefined) {
      const body: unknown = error.response?.data;
      if (isErrorBody(body)) {
        return new ApiError({
          code: body.error.code,
          message: body.error.message,
          details: body.error.details,
          status,
        });
      }
      return new ApiError({
        code: status === 401 ? 'UNAUTHORIZED' : 'INTERNAL_ERROR',
        message: error.message,
        status,
      });
    }
    return new ApiError({ code: NETWORK_ERROR_CODE, message: error.message, status: 0 });
  }
  return new ApiError({
    code: NETWORK_ERROR_CODE,
    message: error instanceof Error ? error.message : 'Unknown error',
    status: 0,
  });
}

export const apiClient: AxiosInstance = create({
  baseURL: API_URL,
  headers: { Accept: 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  config.timeout = firstRequestDone ? DEFAULT_TIMEOUT_MS : FIRST_REQUEST_TIMEOUT_MS;
  const token = await getToken();
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    firstRequestDone = true;
    return response;
  },
  (error: AxiosError) => {
    if (error.response) firstRequestDone = true;
    const apiError = normalizeError(error);
    if (apiError.status === 401) unauthorizedHandler?.();
    return Promise.reject(apiError);
  },
);
