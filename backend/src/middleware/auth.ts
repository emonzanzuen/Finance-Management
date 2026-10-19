import type { RequestHandler } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { loadEnv } from '../config/env';
import { AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const unauthorized = (): AppError => new AppError('UNAUTHORIZED', 401, 'Sesi tidak valid.');

export const requireAuth: RequestHandler = async (req, _res, next) => {
  let userId: string;
  let sessionId: string;
  try {
    const header = req.header('authorization');
    const match = header?.match(/^Bearer ([^\s]+)$/i);
    if (!match) throw unauthorized();

    const { JWT_SECRET } = loadEnv();
    const decoded = jwt.verify(match[1]!, JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'finmanage-api',
      audience: 'finmanage-mobile',
      clockTolerance: 30,
    });
    if (typeof decoded === 'string') throw unauthorized();
    const payload = decoded as JwtPayload;
    const subject = payload.sub;
    const sid = payload.sid;
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (
      typeof subject !== 'string' ||
      typeof sid !== 'string' ||
      !UUID_PATTERN.test(subject) ||
      !UUID_PATTERN.test(sid) ||
      typeof payload.iat !== 'number' ||
      payload.iat < 1 ||
      payload.iat > nowSeconds + 30 ||
      typeof payload.exp !== 'number' ||
      payload.exp <= nowSeconds ||
      payload.exp <= payload.iat
    ) {
      throw unauthorized();
    }
    userId = subject;
    sessionId = sid;
  } catch {
    next(unauthorized());
    return;
  }

  try {
    const now = new Date();
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        userId,
        revokedAt: null,
        expiresAt: { gt: now },
        user: { status: 'active' },
      },
      select: { id: true, userId: true, lastUsedAt: true },
    });
    if (!session) throw unauthorized();

    req.auth = { userId: session.userId, sessionId: session.id };
    if (session.lastUsedAt.getTime() <= now.getTime() - 5 * 60_000) {
      await prisma.session.updateMany({
        where: {
          id: session.id,
          userId: session.userId,
          revokedAt: null,
          expiresAt: { gt: now },
          lastUsedAt: { lte: new Date(now.getTime() - 5 * 60_000) },
        },
        data: { lastUsedAt: now },
      });
    }
    next();
  } catch (error) {
    next(error);
  }
};

export function authenticatedUserId(req: Express.Request): string {
  if (!req.auth) throw unauthorized();
  return req.auth.userId;
}
