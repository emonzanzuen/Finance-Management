import { prisma } from '../../lib/prisma';
import { AppError } from '../../lib/errors';
import type { RegisterDeviceInput } from './devices.schema';

export async function registerDevice(userId: string, input: RegisterDeviceInput): Promise<void> {
  const now = new Date();
  await prisma.deviceToken.upsert({
    where: { expoPushToken: input.expoPushToken },
    create: { userId, expoPushToken: input.expoPushToken, locale: input.locale ?? 'id', lastSeenAt: now },
    update: { userId, locale: input.locale ?? 'id', lastSeenAt: now },
  });
}

export async function deleteDevice(userId: string, expoPushToken: string): Promise<void> {
  const result = await prisma.deviceToken.deleteMany({ where: { userId, expoPushToken } });
  if (result.count !== 1) throw new AppError('NOT_FOUND', 404, 'Sumber daya tidak ditemukan.');
}
