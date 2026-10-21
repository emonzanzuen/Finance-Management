import { AppError } from '../../lib/errors';
import { prisma } from '../../lib/prisma';
import type { z } from 'zod';
import type { notificationListQuery } from './notifications.schema';

type NotificationQuery = z.infer<typeof notificationListQuery>;

export async function listNotifications(userId: string, query: NotificationQuery) {
  const where = { userId, ...(query.unreadOnly ? { isRead: false } : {}) };
  const [items, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      select: { id: true, type: true, isRead: true, createdAt: true, data: true },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);
  return {
    items,
    meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit), unreadCount },
  };
}

export async function markNotificationRead(userId: string, id: string): Promise<void> {
  const result = await prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } });
  if (result.count !== 1) throw new AppError('NOT_FOUND', 404, 'Sumber daya tidak ditemukan.');
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
}
