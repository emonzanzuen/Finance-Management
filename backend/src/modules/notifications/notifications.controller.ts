import type { Request, Response } from 'express';
import { authenticatedUserId } from '../../middleware/auth';
import { notificationId, notificationListQuery } from './notifications.schema';
import { listNotifications, markAllNotificationsRead, markNotificationRead } from './notifications.service';

export async function listNotificationsController(req: Request, res: Response): Promise<void> {
  const query = notificationListQuery.parse(req.query);
  const result = await listNotifications(authenticatedUserId(req), query);
  res.status(200).json({ data: result.items, meta: result.meta });
}

export async function markNotificationReadController(req: Request, res: Response): Promise<void> {
  await markNotificationRead(authenticatedUserId(req), notificationId.parse(req.params.id));
  res.status(200).json({ data: { success: true } });
}

export async function markAllNotificationsReadController(req: Request, res: Response): Promise<void> {
  await markAllNotificationsRead(authenticatedUserId(req));
  res.status(200).json({ data: { success: true } });
}
