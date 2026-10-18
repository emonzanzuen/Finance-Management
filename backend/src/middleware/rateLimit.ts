import type { Request } from 'express';
import rateLimit from 'express-rate-limit';
import type { ErrorBody } from '../lib/errors';

interface RequestWithRateLimit extends Request {
  rateLimit?: {
    resetTime?: Date;
  };
}

/** Global limit for the whole API: 120 requests per minute per IP (docs/rules.md). */
export function createGlobalRateLimit(limit = 120, windowMs = 60_000) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (req, res) => {
      const resetTime = (req as RequestWithRateLimit).rateLimit?.resetTime;
      const retryAfterSeconds = resetTime
        ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
        : Math.ceil(windowMs / 1000);
      res.setHeader('Retry-After', String(retryAfterSeconds));
      const requestId: unknown = res.locals.requestId;
      const body: ErrorBody & { error: { requestId?: string } } = {
        error: {
          code: 'RATE_LIMITED',
          message: 'Terlalu banyak permintaan. Coba lagi nanti.',
          details: null,
          ...(typeof requestId === 'string' ? { requestId } : {}),
        },
      };
      res.status(429).json(body);
    },
  });
}
