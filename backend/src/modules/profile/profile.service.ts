import { Prisma } from '@prisma/client';
import { AppError } from '../../lib/errors';
import { decimalToAmount } from '../../lib/money';
import { prisma } from '../../lib/prisma';

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
