import { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { SkeletonList } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { usePreferences } from '@/context/PreferencesContext';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsInfinite,
} from '@/hooks/useNotifications';
import { useTranslation } from '@/i18n/useTranslation';
import { useTheme } from '@/theme/useTheme';
import { ApiError, type NotificationItem } from '@/types/api';
import { formatRelativeTime } from '@/utils/format';

export default function NotificationsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { language } = usePreferences();
  const { showToast } = useToast();

  const notificationsQuery = useNotificationsInfinite();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const items = useMemo(
    () => notificationsQuery.data?.pages.flatMap((p) => p.data) ?? [],
    [notificationsQuery.data],
  );

  const unreadCount = notificationsQuery.data?.pages[0]?.meta?.unreadCount ?? 0;

  const getNotificationContent = (
    item: NotificationItem,
  ): {
    title: string;
    message: string;
    icon: React.ComponentProps<typeof Feather>['name'];
    color: string;
  } => {
    const monthIndex = item.data?.month ? Math.max(0, Math.min(11, item.data.month - 1)) : 0;
    const monthName = item.data?.month ? t(`common.months_full.${monthIndex}`) : '';
    const periodStr =
      monthName && item.data?.year ? `${monthName} ${item.data.year}` : '';

    if (item.type === 'budget_warning') {
      return {
        title: t('notifications.budget_warning_title'),
        message: t('notifications.budget_warning_body', {
          category: item.data?.categoryName ?? '-',
          percentage: Math.round(Number(item.data?.percentage ?? 90)),
          period: periodStr,
        }),
        icon: 'alert-triangle',
        color: theme.colors.warning,
      };
    }

    if (item.type === 'budget_exceeded') {
      return {
        title: t('notifications.budget_exceeded_title'),
        message: t('notifications.budget_exceeded_body', {
          category: item.data?.categoryName ?? '-',
          percentage: Math.round(Number(item.data?.percentage ?? 100)),
          period: periodStr,
        }),
        icon: 'alert-octagon',
        color: theme.colors.danger,
      };
    }

    return {
      title: t('notifications.goal_completed_title'),
      message: t('notifications.goal_completed_body', {
        title: item.data?.title ?? '-',
      }),
      icon: 'check-circle',
      color: theme.colors.income,
    };
  };

  const handlePressNotification = async (item: NotificationItem) => {
    if (!item.isRead) {
      try {
        await markReadMutation.mutateAsync(item.id);
      } catch {
        // Non-blocking navigation even if markRead fails
      }
    }
    if (item.type === 'goal_completed') {
      router.push('/(tabs)/savings');
    } else {
      router.push('/(tabs)/budget');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllReadMutation.mutateAsync();
      showToast(t('notifications.all_marked_read'), 'success');
    } catch (err) {
      if (err instanceof ApiError) {
        showToast(err.message, 'error');
      } else {
        showToast(t('errors.UNKNOWN'), 'error');
      }
    }
  };

  return (
    <Screen padded={false}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.lg,
          paddingBottom: theme.spacing.sm,
        }}
      >
        <View style={[styles.headerRow, { gap: theme.spacing.sm }]}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={[
              styles.backBtn,
              {
                minWidth: theme.sizes.touchTarget,
                minHeight: theme.sizes.touchTarget,
                borderRadius: theme.radius.control,
              },
            ]}
          >
            <Feather name="arrow-left" size={22} color={theme.colors.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <AppText variant="title">{t('common.notifications')}</AppText>
            {unreadCount > 0 ? (
              <AppText variant="caption" color={theme.colors.primary}>
                {unreadCount} {t('common.new')}
              </AppText>
            ) : (
              <AppText variant="caption" muted>
                {t('notifications.subtitle')}
              </AppText>
            )}
          </View>
          {unreadCount > 0 ? (
            <Pressable
              accessibilityRole="button"
              disabled={markAllReadMutation.isPending}
              onPress={() => void handleMarkAllRead()}
              style={[
                styles.markAllBtn,
                {
                  minHeight: theme.sizes.touchTarget,
                  paddingHorizontal: theme.spacing.md,
                  borderRadius: theme.radius.control,
                  backgroundColor: `${theme.colors.primary}15`,
                },
              ]}
            >
              <AppText variant="caption" color={theme.colors.primary} style={{ fontWeight: '600' }}>
                {t('common.mark_all_read')}
              </AppText>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={{ flex: 1, paddingHorizontal: theme.spacing.lg }}>
        {notificationsQuery.isLoading ? (
          <SkeletonList count={5} itemHeight={88} />
        ) : notificationsQuery.isError ? (
          <ErrorState
            message={notificationsQuery.error.message}
            onRetry={() => void notificationsQuery.refetch()}
          />
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              gap: theme.spacing.sm,
              paddingBottom: theme.spacing.xxl * 2,
              flexGrow: 1,
            }}
            refreshControl={
              <RefreshControl
                refreshing={
                  notificationsQuery.isRefetching && !notificationsQuery.isFetchingNextPage
                }
                onRefresh={() => void notificationsQuery.refetch()}
                tintColor={theme.colors.primary}
              />
            }
            onEndReachedThreshold={0.3}
            onEndReached={() => {
              if (
                notificationsQuery.hasNextPage &&
                !notificationsQuery.isFetchingNextPage
              ) {
                void notificationsQuery.fetchNextPage();
              }
            }}
            ListEmptyComponent={
              <EmptyState
                icon="bell"
                title={t('common.no_notifications')}
                subtitle={t('notifications.empty_subtitle')}
              />
            }
            ListFooterComponent={
              notificationsQuery.isFetchingNextPage ? (
                <View style={{ paddingVertical: theme.spacing.md, alignItems: 'center' }}>
                  <ActivityIndicator color={theme.colors.primary} />
                </View>
              ) : null
            }
            renderItem={({ item }) => {
              const info = getNotificationContent(item);
              return (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void handlePressNotification(item)}
                >
                  <Card
                    style={{
                      borderColor: item.isRead ? theme.colors.border : info.color,
                      backgroundColor: item.isRead
                        ? theme.colors.surface
                        : `${info.color}0E`,
                    }}
                  >
                    <View style={[styles.itemRow, { gap: theme.spacing.md }]}>
                      <View
                        style={[
                          styles.iconCircle,
                          {
                            backgroundColor: `${info.color}20`,
                            borderRadius: theme.radius.full,
                          },
                        ]}
                      >
                        <Feather name={info.icon} size={18} color={info.color} />
                      </View>
                      <View style={{ flex: 1, gap: 4 }}>
                        <View style={styles.titleRow}>
                          <AppText variant="bodyStrong" style={{ flex: 1 }}>
                            {info.title}
                          </AppText>
                          {!item.isRead ? (
                            <View
                              style={[
                                styles.unreadDot,
                                {
                                  backgroundColor: theme.colors.primary,
                                  borderRadius: theme.radius.full,
                                },
                              ]}
                            />
                          ) : null}
                        </View>
                        <AppText variant="body">{info.message}</AppText>
                        <AppText variant="caption" muted>
                          {formatRelativeTime(item.createdAt, t, language)}
                        </AppText>
                      </View>
                    </View>
                  </Card>
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markAllBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  unreadDot: {
    width: 9,
    height: 9,
  },
});
