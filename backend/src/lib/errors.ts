/** Error codes defined in docs/contract.md section 1. */
export const ERROR_CODES = [
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'INVALID_CREDENTIALS',
  'EMAIL_TAKEN',
  'NOT_FOUND',
  'CATEGORY_DUPLICATE',
  'CATEGORY_IN_USE',
  'CATEGORY_TYPE_LOCKED',
  'BUDGET_DUPLICATE',
  'DEPOSIT_EXCEEDS_TARGET',
  'GOAL_COMPLETED',
  'TARGET_BELOW_SAVED',
  'WITHDRAWAL_EXCEEDS_SAVED',
  'TOPUP_EXCEEDS_SAVED',
  'FILE_TOO_LARGE',
  'UNSUPPORTED_FILE',
  'IMPORT_HEADER_MISMATCH',
  'IMPORT_INVALID_FILE',
  'IMPORT_LIMIT_EXCEEDED',
  'CONSENT_REQUIRED',
  'RATE_LIMITED',
  'SCAN_QUOTA_EXCEEDED',
  'SCAN_FAILED',
  'OTP_INVALID_OR_EXPIRED',
  'INTERNAL_ERROR',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

/** Known, safe-to-expose application error. Message must be user-facing Indonesian text. */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: ErrorCode, status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/** Shape of every error response body (docs/contract.md section 1). */
export interface ErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    details: unknown;
  };
}
