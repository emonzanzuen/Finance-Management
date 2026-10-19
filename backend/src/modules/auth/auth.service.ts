import argon2 from 'argon2';
import { Prisma, type User } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { loadEnv } from '../../config/env';
import { AppError } from '../../lib/errors';
import { prisma } from '../../lib/prisma';
import type { LoginInput, RegisterInput } from './auth.schema';

const SESSION_MS = 7 * 24 * 60 * 60 * 1000;
const ARGON_OPTIONS: argon2.HashOptions = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};
const COMMON_PASSWORDS = new Set([
  'password1', 'password123', 'qwerty123', 'abc12345', 'admin123', 'welcome1',
  'letmein1', 'iloveyou1', 'rahasia1', 'bismillah1', 'indonesia1', '12345678',
  '123456789', 'qwertyui', 'p@ssw0rd', 'admin1234', 'passw0rd1', 'qwerty12345',
]);
let dummyHash: Promise<string> | undefined;

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

export interface AuthResult {
  token: string;
  user: PublicUser;
}

export function toPublicUser(user: Pick<User, 'id' | 'name' | 'email' | 'avatarData'>): PublicUser {
  return { id: user.id, name: user.name, email: user.email, avatar: user.avatarData };
}

function validatePassword(password: string, email: string): void {
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new AppError('VALIDATION_ERROR', 400, 'Password harus mengandung huruf dan angka.');
  }
  if (password.toLowerCase() === email.toLowerCase() || COMMON_PASSWORDS.has(password.toLowerCase())) {
    throw new AppError('VALIDATION_ERROR', 400, 'Password terlalu mudah ditebak.');
  }
}

function makeToken(userId: string, sessionId: string): string {
  const { JWT_SECRET } = loadEnv();
  return jwt.sign({ sid: sessionId }, JWT_SECRET, {
    algorithm: 'HS256',
    subject: userId,
    issuer: 'finmanage-api',
    audience: 'finmanage-mobile',
    expiresIn: '7d',
  });
}

function mapPrismaConflict(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    throw new AppError('EMAIL_TAKEN', 409, 'Email sudah terdaftar.');
  }
  throw error;
}

const DEFAULT_CATEGORIES = [
  { name: 'Salary', type: 'income' as const, color: '#10B981' },
  { name: 'Freelance', type: 'income' as const, color: '#34D399' },
  { name: 'Bonus', type: 'income' as const, color: '#6EE7B7' },
  { name: 'Investment', type: 'income' as const, color: '#059669' },
  { name: 'Other', type: 'income' as const, color: '#A7F3D0' },
  { name: 'Food', type: 'expense' as const, color: '#F59E0B' },
  { name: 'Transportation', type: 'expense' as const, color: '#3B82F6' },
  { name: 'Shopping', type: 'expense' as const, color: '#EC4899' },
  { name: 'Bills', type: 'expense' as const, color: '#8B5CF6' },
  { name: 'Entertainment', type: 'expense' as const, color: '#F97316' },
  { name: 'Education', type: 'expense' as const, color: '#06B6D4' },
  { name: 'Health', type: 'expense' as const, color: '#EF4444' },
  { name: 'Other', type: 'expense' as const, color: '#9CA3AF' },
];

export async function register(input: RegisterInput, userAgent: string | undefined): Promise<AuthResult> {
  validatePassword(input.password, input.email);
  const passwordHash = await argon2.hash(input.password, ARGON_OPTIONS);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_MS);
  const sessionId = randomUUID();

  try {
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { name: input.name, email: input.email, passwordHash },
      });
      await tx.category.createMany({
        data: DEFAULT_CATEGORIES.map((category) => ({
          userId: created.id,
          name: category.name,
          nameKey: category.name.toLowerCase(),
          type: category.type,
          color: category.color,
        })),
      });
      await tx.session.create({
        data: {
          id: sessionId,
          userId: created.id,
          createdAt: now,
          lastUsedAt: now,
          expiresAt,
          userAgent: userAgent?.slice(0, 200),
        },
      });
      return created;
    });

    return { token: makeToken(user.id, sessionId), user: toPublicUser(user) };
  } catch (error) {
    return mapPrismaConflict(error);
  }
}

async function getDummyHash(): Promise<string> {
  return (dummyHash ??= argon2.hash(randomUUID(), ARGON_OPTIONS));
}

export async function login(input: LoginInput, userAgent: string | undefined): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  let passwordValid = false;
  try {
    passwordValid = await argon2.verify(user?.passwordHash ?? (await getDummyHash()), input.password);
  } catch {
    passwordValid = false;
  }
  if (!user || user.status !== 'active' || !passwordValid) {
    throw new AppError('INVALID_CREDENTIALS', 401, 'Email atau password tidak valid.');
  }

  const now = new Date();
  const sessionId = randomUUID();
  await prisma.session.create({
    data: {
      id: sessionId,
      userId: user.id,
      createdAt: now,
      lastUsedAt: now,
      expiresAt: new Date(now.getTime() + SESSION_MS),
      userAgent: userAgent?.slice(0, 200),
    },
  });
  return { token: makeToken(user.id, sessionId), user: toPublicUser(user) };
}

export function issueToken(userId: string, sessionId: string): string {
  return makeToken(userId, sessionId);
}
