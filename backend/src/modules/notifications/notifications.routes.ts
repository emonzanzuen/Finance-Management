import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { listNotificationsController, markAllNotificationsReadController, markNotificationReadController } from './notifications.controller';

export const notificationsRouter = Router();
notificationsRouter.get('/notifications', requireAuth, listNotificationsController);
notificationsRouter.patch('/notifications/:id/read', requireAuth, markNotificationReadController);
notificationsRouter.post('/notifications/read-all', requireAuth, markAllNotificationsReadController);
