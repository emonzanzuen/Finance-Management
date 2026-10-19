import { AxiosError, create, isAxiosError, type AxiosInstance } from 'axios';
import { ApiError, NETWORK_ERROR_CODE, type ApiErrorBody } from '@/types/api';
import { getToken } from './tokenStore';

export const FIRST_REQUEST_TIMEOUT_MS = 60_000;
export const DEFAULT_TIMEOUT_MS = 20_000;

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

let firstRequestDone = false;
let unauthorizedHandler: (() => void) | null = null;
let errorMessageResolver: ((code: string, fallbackMessage: string) => string) | null = null;

/** Register the handler invoked on 401 UNAUTHORIZED (AuthContext wires signOut here). */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

/** Register active-language translator for error codes. */
export function setErrorMessageResolver(
  resolver: ((code: string, fallbackMessage: string) => string) | null,
): void {
  errorMessageResolver = resolver;
}

function resolveLocalizedMessage(code: string, fallbackMessage: string): string {
  if (errorMessageResolver) {
    return errorMessageResolver(code, fallbackMessage);
  }
  return fallbackMessage;
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
        const code = body.error.code;
        return new ApiError({
          code,
          message: resolveLocalizedMessage(code, body.error.message),
          details: body.error.details,
          status,
        });
      }
      const fallbackCode = status === 401 ? 'UNAUTHORIZED' : status === 429 ? 'RATE_LIMITED' : 'INTERNAL_ERROR';
      return new ApiError({
        code: fallbackCode,
        message: resolveLocalizedMessage(fallbackCode, error.message),
        status,
      });
    }
    return new ApiError({
      code: NETWORK_ERROR_CODE,
      message: resolveLocalizedMessage(NETWORK_ERROR_CODE, error.message),
      status: 0,
    });
  }
  return new ApiError({
    code: NETWORK_ERROR_CODE,
    message: resolveLocalizedMessage(
      NETWORK_ERROR_CODE,
      error instanceof Error ? error.message : 'Unknown error',
    ),
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
    if (apiError.status === 401 && apiError.code !== 'INVALID_CREDENTIALS') {
      unauthorizedHandler?.();
    }
    return Promise.reject(apiError);
  },
);
