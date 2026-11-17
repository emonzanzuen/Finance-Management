import { Router } from 'express';
import rateLimit, { type Options } from 'express-rate-limit';
import type { Request } from 'express';
import { ipKeyGenerator } from 'express-rate-limit';
import { createHash } from 'node:crypto';
import { changePasswordController, forgotPasswordController, loginController, logoutAllController, logoutController, registerController, resetPasswordController } from './auth.controller';
import { requireAuth } from '../../middleware/auth';
import { createUserRateLimit } from '../../middleware/rateLimit';
import type { EmailSender } from './auth.passwordReset.service';

interface RateLimitRequest extends Request {
  rateLimit?: { resetTime?: Date };
}

const emailKey = (req: Request): string => {
  const body = req.body as { email?: unknown };
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : 'invalid';
  return `${ipKeyGenerator(req.ip ?? '')}:${email}`;
};

const limitHandler: Options['handler'] = (req, res) => {
  const requestId: unknown = res.locals.requestId;
  const resetTime = (req as RateLimitRequest).rateLimit?.resetTime;
  const retryAfter = resetTime ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000)) : 900;
  res.setHeader('Retry-After', String(retryAfter));
  res.status(429).json({
    error: {
      code: 'RATE_LIMITED',
      message: 'Terlalu banyak permintaan. Coba lagi nanti.',
      details: null,
      ...(typeof requestId === 'string' ? { requestId } : {}),
    },
  });
};

const loginIpLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false, handler: limitHandler });
const loginEmailLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 5, skipSuccessfulRequests: true, keyGenerator: emailKey, standardHeaders: 'draft-7', legacyHeaders: false, handler: limitHandler });
const registerLimiter = rateLimit({ windowMs: 60 * 60_000, limit: 5, standardHeaders: 'draft-7', legacyHeaders: false, handler: limitHandler });
export function createAuthRouter(emailSender?: EmailSender): Router {
  const authRouter = Router();
  const changePasswordLimiter = createUserRateLimit(5, 15 * 60_000);
  const forgotResetEmailLimiter = rateLimit({
    windowMs: 60 * 60_000,
    limit: 3,
    keyGenerator: (req) => {
      const body = req.body as { email?: unknown };
      const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : 'invalid';
      return createHash('sha256').update(email).digest('hex');
    },
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: limitHandler,
  });
  const forgotResetIpLimiter = rateLimit({ windowMs: 60 * 60_000, limit: 10, keyGenerator: (req) => ipKeyGenerator(req.ip ?? ''), standardHeaders: 'draft-7', legacyHeaders: false, handler: limitHandler });
  authRouter.post('/auth/register', registerLimiter, registerController);
  authRouter.post('/auth/login', loginIpLimiter, loginEmailLimiter, loginController);
  authRouter.post('/auth/logout', requireAuth, logoutController);
  authRouter.post('/auth/change-password', requireAuth, changePasswordLimiter, changePasswordController);
  authRouter.post('/auth/logout-all', requireAuth, logoutAllController);
  authRouter.post('/auth/forgot-password', forgotResetEmailLimiter, forgotResetIpLimiter, (req, res, next) => {
    void forgotPasswordController(req, res, emailSender).catch(next);
  });
  authRouter.post('/auth/reset-password', forgotResetEmailLimiter, forgotResetIpLimiter, (req, res, next) => {
    void resetPasswordController(req, res).catch(next);
  });
  return authRouter;
}
