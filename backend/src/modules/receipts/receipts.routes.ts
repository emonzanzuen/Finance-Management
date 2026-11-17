import { Router, type Request, type RequestHandler, type Response } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import multer, { MulterError } from 'multer';
import { loadEnv } from '../../config/env';
import { AppError } from '../../lib/errors';
import { requireAuth } from '../../middleware/auth';
import { createUserRateLimit } from '../../middleware/rateLimit';
import { GeminiReceiptExtractor, type ReceiptExtractor } from './receipts.extractor';
import { grantReceiptConsentController, revokeReceiptConsentController, scanReceiptController } from './receipts.controller';
import { hasReceiptScanConsent, reserveReceiptScan } from './receipts.service';

export interface ReceiptRouterOptions {
  extractor?: ReceiptExtractor;
  scanEnabled?: boolean;
  dailyLimit?: number;
  requestTimeoutMs?: number;
}

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 3 * 1024 * 1024, files: 1, fields: 0 } });

function rateLimitHandler(req: Request, res: Response): void {
  const resetTime = (req as Request & { rateLimit?: { resetTime?: Date } }).rateLimit?.resetTime;
  const retryAfter = resetTime ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000)) : 60;
  res.setHeader('Retry-After', String(retryAfter));
  res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Terlalu banyak permintaan. Coba lagi nanti.', details: null, requestId: res.locals.requestId } });
}

function enabledMiddleware(options: ReceiptRouterOptions): RequestHandler {
  return (_req, _res, next) => {
    if (!(options.scanEnabled ?? loadEnv().SCAN_ENABLED)) {
      next(new AppError('SCAN_FAILED', 503, 'Fitur scan nota sedang tidak tersedia.'));
      return;
    }
    next();
  };
}

function consentMiddleware(): RequestHandler {
  return (req, _res, next) => {
    void hasReceiptScanConsent(req.auth!.userId).then((consented) => {
      if (!consented) {
        next(new AppError('CONSENT_REQUIRED', 403, 'Persetujuan scan nota diperlukan.'));
        return;
      }
      next();
    }).catch(next);
  };
}

function reservationMiddleware(options: ReceiptRouterOptions, activeUsers: Set<string>, getActiveCount: () => number, changeActiveCount: (delta: number) => void): RequestHandler {
  return (req, res, next) => {
    const userId = req.auth!.userId;
    if (activeUsers.has(userId) || getActiveCount() >= 2) {
      res.setHeader('Retry-After', '1');
      next(new AppError('RATE_LIMITED', 429, 'Scan lain sedang diproses. Coba lagi sebentar.'));
      return;
    }
    activeUsers.add(userId);
    changeActiveCount(1);
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      activeUsers.delete(userId);
      changeActiveCount(-1);
      req.file?.buffer.fill(0);
    };
    void reserveReceiptScan(userId, options.dailyLimit).then((scanId) => {
      res.locals.receiptScanId = scanId;
      res.once('finish', release);
      res.once('close', release);
      next();
    }).catch((error: unknown) => {
      release();
      next(error);
    });
  };
}

function uploadMiddleware(): RequestHandler {
  return (req, res, next) => {
    upload.single('image')(req, res, (error: unknown) => {
      if (error instanceof MulterError && error.code === 'LIMIT_FILE_SIZE') {
        next(new AppError('FILE_TOO_LARGE', 413, 'Ukuran gambar maksimal 3 MB.'));
        return;
      }
      if (error instanceof MulterError) {
        next(new AppError('VALIDATION_ERROR', 400, 'Permintaan upload tidak valid.'));
        return;
      }
      next(error);
    });
  };
}

export function createReceiptsRouter(options: ReceiptRouterOptions = {}): Router {
  const router = Router();
  const activeUsers = new Set<string>();
  let activeCount = 0;
  const extractor = options.extractor ?? new GeminiReceiptExtractor();
  const perUserLimiter = createUserRateLimit(3, 60_000);
  const perIpLimiter = rateLimit({ windowMs: 60 * 60_000, limit: 30, keyGenerator: (req) => ipKeyGenerator(req.ip ?? '127.0.0.1'), standardHeaders: 'draft-7', legacyHeaders: false, handler: rateLimitHandler });

  router.post('/receipts/consent', requireAuth, grantReceiptConsentController);
  router.delete('/receipts/consent', requireAuth, revokeReceiptConsentController);
  router.post(
    '/receipts/scan',
    requireAuth,
    enabledMiddleware(options),
    consentMiddleware(),
    perUserLimiter,
    perIpLimiter,
    reservationMiddleware(options, activeUsers, () => activeCount, (delta) => { activeCount += delta; }),
    uploadMiddleware(),
    (req, res, next) => { void scanReceiptController(req, res, extractor, options.requestTimeoutMs).catch(next); },
  );
  return router;
}
