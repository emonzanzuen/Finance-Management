import type {
  ApiSuccess,
  NotificationItem,
  NotificationListParams,
  NotificationPaginationMeta,
} from '@/types/api';
import { apiClient } from './client';

export async function getNotifications(
  params?: NotificationListParams,
): Promise<ApiSuccess<NotificationItem[], NotificationPaginationMeta>> {
  const cleanParams: Record<string, string | number | boolean> = {};
  if (params?.page !== undefined) cleanParams.page = params.page;
  if (params?.limit !== undefined) cleanParams.limit = params.limit;
  if (params?.unreadOnly !== undefined) cleanParams.unreadOnly = params.unreadOnly;

  const response = await apiClient.get<ApiSuccess<NotificationItem[], NotificationPaginationMeta>>(
    '/notifications',
    { params: cleanParams },
  );
  return {
    data: response.data.data ?? [],
    meta: {
      page: Number(response.data.meta?.page ?? 1),
      limit: Number(response.data.meta?.limit ?? 20),
      total: Number(response.data.meta?.total ?? 0),
      totalPages: Number(response.data.meta?.totalPages ?? 1),
      unreadCount: Number(response.data.meta?.unreadCount ?? 0),
    },
  };
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiClient.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.post('/notifications/read-all');
}
