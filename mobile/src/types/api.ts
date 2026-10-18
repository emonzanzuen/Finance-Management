export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiSuccess<T, M = undefined> = M extends undefined ? { data: T } : { data: T; meta: M };

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/** Normalized error thrown by the API client. */
export class ApiError extends Error {
  readonly code: string;
  readonly details: unknown;
  readonly status: number;

  constructor(params: { code: string; message: string; details?: unknown; status: number }) {
    super(params.message);
    this.name = 'ApiError';
    this.code = params.code;
    this.details = params.details;
    this.status = params.status;
  }
}

export const NETWORK_ERROR_CODE = 'NETWORK_ERROR';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
};

// GET /health: the contract only lists the endpoint (public, server status); body is kept loose.
export type HealthResponse = {
  data?: { status?: string; [key: string]: unknown };
  [key: string]: unknown;
};
