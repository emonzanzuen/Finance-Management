import type { ErrorRequestHandler, RequestHandler, Response } from 'express';
import { ZodError } from 'zod';
import { AppError, type ErrorBody, type ErrorCode } from '../lib/errors';

interface ErrorPayload {
  code: ErrorCode;
  message: string;
  details: unknown;
}

function send(res: Response, status: number, payload: ErrorPayload): void {
  const requestId: unknown = res.locals.requestId;
  const body: ErrorBody & { error: { requestId?: string } } = {
    error: {
      code: payload.code,
      message: payload.message,
      details: payload.details ?? null,
      ...(typeof requestId === 'string' ? { requestId } : {}),
    },
  };
  res.status(status).json(body);
}

/** Body-parser errors carry `type` and `status`; nothing else from them is exposed. */
function isBodyParserError(err: unknown): err is { type: string; status: number } {
  return (
    typeof err === 'object' &&
    err !== null &&
    typeof (err as { type?: unknown }).type === 'string' &&
    typeof (err as { status?: unknown }).status === 'number'
  );
}

/** Final 404 for unknown routes. */
export const notFound: RequestHandler = (_req, res) => {
  send(res, 404, { code: 'NOT_FOUND', message: 'Sumber daya tidak ditemukan.', details: null });
};

/**
 * Global error handler. Known errors map to safe codes/messages; anything else
 * becomes a generic 500 with only the requestId (no stack, SQL, Prisma text, or paths).
 */
export const errorHandler: ErrorRequestHandler = (err: unknown, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof AppError) {
    send(res, err.status, { code: err.code, message: err.message, details: err.details });
    return;
  }

  if (err instanceof ZodError) {
    send(res, 400, {
      code: 'VALIDATION_ERROR',
      message: 'Data yang dikirim tidak valid.',
      // Field paths and Zod issue codes only; input values are never echoed back.
      details: err.issues.map((issue) => ({
        path: issue.path.map(String).join('.'),
        code: issue.code,
      })),
    });
    return;
  }

  if (isBodyParserError(err)) {
    if (err.type === 'entity.parse.failed') {
      send(res, 400, {
        code: 'VALIDATION_ERROR',
        message: 'Format JSON tidak valid.',
        details: null,
      });
      return;
    }
    if (err.type === 'entity.too.large') {
      send(res, 413, {
        code: 'FILE_TOO_LARGE',
        message: 'Ukuran permintaan terlalu besar.',
        details: null,
      });
      return;
    }
    if (err.status >= 400 && err.status < 500) {
      send(res, 400, {
        code: 'VALIDATION_ERROR',
        message: 'Permintaan tidak valid.',
        details: null,
      });
      return;
    }
  }

  // Unknown error: log server-side (pino serializer, redacted) and return a generic body.
  const unknownError =
    typeof err === 'object' && err !== null
      ? (err as { name?: unknown; code?: unknown })
      : undefined;
  req.log?.error(
    {
      name: typeof unknownError?.name === 'string' ? unknownError.name : 'Error',
      ...(typeof unknownError?.code === 'string' || typeof unknownError?.code === 'number'
        ? { code: unknownError.code }
        : {}),
      requestId: res.locals.requestId,
    },
    'Unhandled error',
  );
  send(res, 500, {
    code: 'INTERNAL_ERROR',
    message: 'Terjadi kesalahan pada server.',
    details: null,
  });
};
