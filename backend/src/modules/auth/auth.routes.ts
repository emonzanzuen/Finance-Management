import { Router } from 'express';
import rateLimit, { type Options } from 'express-rate-limit';
import type { Request } from 'express';
import { ipKeyGenerator } from 'express-rate-limit';
import { loginController, logoutController, registerController } from './auth.controller';
import { requireAuth } from '../../middleware/auth';

const authRouter = Router();

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

authRouter.post('/auth/register', registerLimiter, registerController);
authRouter.post('/auth/login', loginIpLimiter, loginEmailLimiter, loginController);
authRouter.post('/auth/logout', requireAuth, logoutController);

export { authRouter };
