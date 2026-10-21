import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/api/notifications';

export const NOTIFICATIONS_QUERY_KEY = ['notifications'] as const;

export function useNotificationsInfinite(unreadOnly?: boolean) {
  return useInfiniteQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, 'list', { unreadOnly: Boolean(unreadOnly) }],
    queryFn: ({ pageParam }) =>
      getNotifications({
        page: pageParam,
        limit: 20,
        ...(unreadOnly !== undefined ? { unreadOnly } : {}),
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.page < lastPage.meta.totalPages) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, 'unreadCount'],
    queryFn: async () => {
      const res = await getNotifications({ page: 1, limit: 1 });
      return res.meta.unreadCount;
    },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });
}
