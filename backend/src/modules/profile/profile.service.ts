import argon2 from 'argon2';
import { Prisma } from '@prisma/client';
import { AppError } from '../../lib/errors';
import { decimalToAmount } from '../../lib/money';
import { prisma } from '../../lib/prisma';
import type { UpdateProfileInput } from './profile.schema';

export async function getProfile(userId: string) {
  const [user, transactionCount, savingsGoalCount, deposits] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.transaction.count({ where: { userId } }),
    prisma.savingsGoal.count({ where: { userId } }),
    prisma.savingsDeposit.groupBy({
      by: ['entryType'],
      where: { userId },
      _sum: { amount: true },
    }),
  ]);
  if (!user) throw new AppError('UNAUTHORIZED', 401, 'Sesi tidak valid.');

  const totalSavings = deposits.reduce((sum, group) => {
    const amount = group._sum.amount ?? new Prisma.Decimal(0);
    return group.entryType === 'deposit' ? sum.add(amount) : sum.sub(amount);
  }, new Prisma.Decimal(0));

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatarData,
    receiptScanConsent: user.receiptScanConsentAt !== null,
    stats: { transactionCount, savingsGoalCount, totalSavings: decimalToAmount(totalSavings) },
  };
}

function validateAvatar(value: string | null | undefined): void {
  if (value === undefined || value === null) return;
  const match = value.match(/^data:image\/(jpeg|png);base64,([A-Za-z0-9+/]*={0,2})$/);
  if (!match || match[2]!.length % 4 !== 0) {
    throw new AppError('VALIDATION_ERROR', 400, 'Avatar harus berupa data URI JPEG atau PNG yang valid.');
  }
  if (Buffer.from(match[2]!, 'base64').byteLength > 100 * 1024) {
    throw new AppError('FILE_TOO_LARGE', 413, 'Ukuran avatar maksimal 100 KB.');
  }
}

export async function updateProfile(userId: string, currentSessionId: string, input: UpdateProfileInput): Promise<void> {
  validateAvatar(input.avatar);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('UNAUTHORIZED', 401, 'Sesi tidak valid.');
  const nextEmail = input.email ?? user.email;
  const emailChanged = nextEmail !== user.email;
  if (emailChanged) {
    if (!input.currentPassword) {
      throw new AppError('VALIDATION_ERROR', 400, 'Password saat ini wajib untuk mengubah email.');
    }
    let passwordMatches = false;
    try {
      passwordMatches = await argon2.verify(user.passwordHash, input.currentPassword);
    } catch {
      passwordMatches = false;
    }
    if (!passwordMatches) throw new AppError('INVALID_CREDENTIALS', 401, 'Email atau password tidak valid.');
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(emailChanged ? { email: nextEmail } : {}),
          ...(input.avatar !== undefined ? { avatarData: input.avatar } : {}),
        },
      });
      if (emailChanged) {
        await tx.session.updateMany({
          where: { userId, revokedAt: null, id: { not: currentSessionId } },
          data: { revokedAt: new Date() },
        });
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError('EMAIL_TAKEN', 409, 'Email sudah terdaftar.');
    }
    throw error;
  }
}
