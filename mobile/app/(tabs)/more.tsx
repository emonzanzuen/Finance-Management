import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Screen } from '@/components/ui/Screen';
import { getApiHost } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import { useUnreadNotificationCount } from '@/hooks/useNotifications';
import { useTranslation } from '@/i18n/useTranslation';
import { useTheme } from '@/theme/useTheme';

const WARMING_UP_AFTER_MS = 3000;

function ServerCheckCard() {
  const { t } = useTranslation();
  const theme = useTheme();
  const health = useHealthCheck();
  const [slow, setSlow] = useState(false);
  const host = getApiHost();

  useEffect(() => {
    if (!health.isPending) return;
    const timer = setTimeout(() => setSlow(true), WARMING_UP_AFTER_MS);
    return () => {
      clearTimeout(timer);
      setSlow(false);
    };
  }, [health.isPending]);

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
        <Feather name="server" size={theme.sizes.icon} color={theme.colors.textMuted} />
        <View style={{ flex: 1 }}>
          <AppText variant="bodyStrong">{t('more.server_check')}</AppText>
          <AppText variant="caption" muted>
            {t('more.server_check_hint')}
          </AppText>
        </View>
      </View>
      <Button
        variant="secondary"
        label={health.isPending ? t('health.checking') : t('health.check')}
        loading={health.isPending}
        onPress={() => health.mutate()}
      />
      {health.isPending && slow ? (
        <AppText color={theme.colors.warning}>{t('health.warming_up')}</AppText>
      ) : null}
      {health.isSuccess ? (
        <View style={{ gap: theme.spacing.xs }}>
          <AppText color={theme.colors.income} variant="bodyStrong">
            {t('health.ok')}
          </AppText>
          <AppText variant="caption" muted>
            {t('health.response_time', { ms: health.data.ms })}
          </AppText>
        </View>
      ) : null}
      {health.isError ? (
        <View style={{ gap: theme.spacing.xs }}>
          <AppText color={theme.colors.danger} variant="bodyStrong">
            {t('health.failed')}
          </AppText>
          <AppText variant="caption" muted>
            {t(`errors.${health.error.code}`) === `errors.${health.error.code}`
              ? t('errors.UNKNOWN')
              : t(`errors.${health.error.code}`)}
          </AppText>
        </View>
      ) : null}
      <AppText variant="caption" muted>
        {host ? t('health.host', { host }) : t('health.not_configured')}
      </AppText>
    </Card>
  );
}

export default function MoreScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { user, logout } = useAuth();
  const unreadQuery = useUnreadNotificationCount();
  const unreadCount = unreadQuery.data ?? 0;

  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
      setConfirmLogout(false);
    }
  };

  const menuItems = [
    {
      key: 'profile',
      icon: 'user' as const,
      title: t('profile.title'),
      subtitle: t('more.profile_subtitle'),
      badge: undefined as string | undefined,
      onPress: () => router.push('/profile'),
    },
    {
      key: 'notifications',
      icon: 'bell' as const,
      title: t('common.notifications'),
      subtitle: t('more.notifications_subtitle'),
      badge: unreadCount > 0 ? String(unreadCount) : undefined,
      onPress: () => router.push('/notifications'),
    },
    {
      key: 'categories',
      icon: 'tag' as const,
      title: t('categories.title'),
      subtitle: t('more.categories_subtitle'),
      badge: undefined as string | undefined,
      onPress: () => router.push('/categories'),
    },
    {
      key: 'reports',
      icon: 'pie-chart' as const,
      title: t('reports.title'),
      subtitle: t('more.reports_subtitle'),
      badge: undefined as string | undefined,
      onPress: () => router.push('/reports'),
    },
    {
      key: 'import',
      icon: 'upload' as const,
      title: t('import.title'),
      subtitle: t('more.import_subtitle'),
      badge: undefined as string | undefined,
      onPress: () => router.push('/import'),
    },
    {
      key: 'settings',
      icon: 'settings' as const,
      title: t('settings.title'),
      subtitle: t('more.settings_subtitle'),
      badge: undefined as string | undefined,
      onPress: () => router.push('/settings'),
    },
  ];

  return (
    <Screen scroll>
      <AppText variant="title">{t('nav.more')}</AppText>

      {user ? (
        <Pressable accessibilityRole="button" onPress={() => router.push('/profile')}>
          <Card>
            <View style={[styles.row, { gap: theme.spacing.md }]}>
              {user.avatar ? (
                <Image
                  source={{ uri: user.avatar }}
                  style={[
                    styles.avatar,
                    {
                      borderRadius: theme.radius.full,
                    },
                  ]}
                />
              ) : (
                <View
                  style={[
                    styles.avatar,
                    {
                      backgroundColor: theme.colors.primary,
                      borderRadius: theme.radius.full,
                    },
                  ]}
                >
                  <AppText variant="bodyStrong" color={theme.colors.onPrimary}>
                    {user.name.trim().charAt(0).toUpperCase() || 'U'}
                  </AppText>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong">{user.name}</AppText>
                <AppText variant="caption" muted>
                  {user.email}
                </AppText>
              </View>
              <Feather name="chevron-right" size={20} color={theme.colors.textMuted} />
            </View>
          </Card>
        </Pressable>
      ) : null}

      <Card style={{ padding: 0, overflow: 'hidden', gap: 0 }}>
        {menuItems.map((item, idx) => (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            onPress={item.onPress}
            style={({ pressed }) => [
              styles.menuItem,
              {
                minHeight: theme.sizes.touchTarget,
                paddingHorizontal: theme.spacing.lg,
                paddingVertical: theme.spacing.md,
                gap: theme.spacing.md,
                backgroundColor: pressed ? theme.colors.surfaceAlt : theme.colors.surface,
                borderBottomWidth: idx < menuItems.length - 1 ? 1 : 0,
                borderBottomColor: theme.colors.border,
              },
            ]}
          >
            <Feather name={item.icon} size={theme.sizes.icon} color={theme.colors.primary} />
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong">{item.title}</AppText>
              <AppText variant="caption" muted>
                {item.subtitle}
              </AppText>
            </View>
            {item.badge ? <Badge label={item.badge} variant="danger" /> : null}
            <Feather name="chevron-right" size={20} color={theme.colors.textMuted} />
          </Pressable>
        ))}
      </Card>

      <ServerCheckCard />

      <Button
        variant="danger"
        label={t('auth.logout')}
        onPress={() => setConfirmLogout(true)}
      />

      <ConfirmDialog
        visible={confirmLogout}
        title={t('auth.logout_title')}
        message={t('common.logout_confirm')}
        confirmLabel={t('auth.logout')}
        cancelLabel={t('common.cancel')}
        danger
        loading={loggingOut}
        onCancel={() => setConfirmLogout(false)}
        onConfirm={() => void handleConfirmLogout()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
