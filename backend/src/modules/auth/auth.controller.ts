import type { Request, Response } from 'express';
import { AppError } from '../../lib/errors';
import { prisma } from '../../lib/prisma';
import { authenticatedUserId } from '../../middleware/auth';
import { login, register } from './auth.service';
import { loginSchema, registerSchema } from './auth.schema';

function parseUserAgent(req: Request): string | undefined {
  const value = req.header('user-agent');
  return value ? value.slice(0, 200) : undefined;
}

export async function registerController(req: Request, res: Response): Promise<void> {
  const input = registerSchema.parse(req.body);
  const result = await register(input, parseUserAgent(req));
  res.status(201).json({ data: result });
}

export async function loginController(req: Request, res: Response): Promise<void> {
  const input = loginSchema.parse(req.body);
  const result = await login(input, parseUserAgent(req));
  res.status(200).json({ data: result });
}

export async function logoutController(req: Request, res: Response): Promise<void> {
  const auth = req.auth;
  if (!auth) throw new AppError('UNAUTHORIZED', 401, 'Sesi tidak valid.');
  await prisma.session.updateMany({
    where: { id: auth.sessionId, userId: authenticatedUserId(req), revokedAt: null },
    data: { revokedAt: new Date() },
  });
  res.status(204).end();
}
