import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
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

  const softBorderColor = theme.isDark ? theme.colors.border : `${theme.colors.border}B8`;
  const surfaceSubtle = theme.isDark ? theme.colors.surfaceAlt : `${theme.colors.surfaceAlt}90`;

  useEffect(() => {
    if (!health.isPending) return;
    const timer = setTimeout(() => setSlow(true), WARMING_UP_AFTER_MS);
    return () => {
      clearTimeout(timer);
      setSlow(false);
    };
  }, [health.isPending]);

  return (
    <Card
      style={{
        padding: theme.spacing.lg,
        gap: theme.spacing.md,
        borderRadius: theme.radius.card + 2,
        borderColor: softBorderColor,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        <View
          style={[
            styles.iconBox,
            { backgroundColor: `${theme.colors.info}14`, borderRadius: 12 },
          ]}
        >
          <Feather name="server" size={19} color={theme.colors.info} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {t('more.server_check')}
          </AppText>
          <AppText variant="caption" muted numberOfLines={2}>
            {t('more.server_check_hint')}
          </AppText>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={health.isPending}
        onPress={() => health.mutate()}
        style={({ pressed }) => [
          styles.softCheckBtn,
          {
            minHeight: 42,
            borderRadius: 12,
            backgroundColor: `${theme.colors.info}12`,
            borderColor: `${theme.colors.info}28`,
            opacity: health.isPending ? 0.65 : pressed ? 0.8 : 1,
            gap: 8,
          },
        ]}
      >
        <Feather name="activity" size={15} color={theme.colors.info} />
        <AppText variant="bodyStrong" color={theme.colors.info}>
          {health.isPending ? t('health.checking') : t('health.check')}
        </AppText>
      </Pressable>

      {health.isPending && slow ? (
        <AppText variant="caption" color={theme.colors.warning}>
          {t('health.warming_up')}
        </AppText>
      ) : null}

      {health.isSuccess ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.sm,
            padding: theme.spacing.md,
            borderRadius: 12,
            backgroundColor: `${theme.colors.income}12`,
            borderWidth: 1,
            borderColor: `${theme.colors.income}28`,
          }}
        >
          <Feather name="check-circle" size={18} color={theme.colors.income} />
          <View style={{ flex: 1, gap: 2 }}>
            <AppText color={theme.colors.income} variant="bodyStrong">
              {t('health.ok')}
            </AppText>
            <AppText variant="caption" muted>
              {t('health.response_time', { ms: health.data.ms })}
            </AppText>
          </View>
        </View>
      ) : null}

      {health.isError ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.sm,
            padding: theme.spacing.md,
            borderRadius: 12,
            backgroundColor: `${theme.colors.danger}12`,
            borderWidth: 1,
            borderColor: `${theme.colors.danger}28`,
          }}
        >
          <Feather name="alert-circle" size={18} color={theme.colors.danger} />
          <View style={{ flex: 1, gap: 2 }}>
            <AppText color={theme.colors.danger} variant="bodyStrong">
              {t('health.failed')}
            </AppText>
            <AppText variant="caption" muted>
              {t(`errors.${health.error.code}`) === `errors.${health.error.code}`
                ? t('errors.UNKNOWN')
                : t(`errors.${health.error.code}`)}
            </AppText>
          </View>
        </View>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: theme.spacing.sm + 2,
          paddingVertical: 8,
          borderRadius: 10,
          backgroundColor: surfaceSubtle,
        }}
      >
        <Feather name="globe" size={13} color={theme.colors.textMuted} />
        <AppText variant="caption" muted numberOfLines={1} style={{ flex: 1 }}>
          {host ? t('health.host', { host }) : t('health.not_configured')}
        </AppText>
      </View>
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

  const softBorderColor = theme.isDark ? theme.colors.border : `${theme.colors.border}B8`;
  const surfaceSubtle = theme.isDark ? theme.colors.surfaceAlt : `${theme.colors.surfaceAlt}90`;

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
      setConfirmLogout(false);
    }
  };

  type MenuItem = {
    key: string;
    icon: React.ComponentProps<typeof Feather>['name'];
    title: string;
    subtitle: string;
    badge?: string;
    tint: string;
    onPress: () => void;
  };

  const accountItems: MenuItem[] = [
    {
      key: 'profile',
      icon: 'user',
      title: t('profile.title'),
      subtitle: t('more.profile_subtitle'),
      tint: theme.colors.primary,
      onPress: () => router.push('/profile'),
    },
    {
      key: 'notifications',
      icon: 'bell',
      title: t('common.notifications'),
      subtitle: t('more.notifications_subtitle'),
      badge: unreadCount > 0 ? String(unreadCount) : undefined,
      tint: theme.colors.warning,
      onPress: () => router.push('/notifications'),
    },
    {
      key: 'settings',
      icon: 'sliders',
      title: t('settings.title'),
      subtitle: t('more.settings_subtitle'),
      tint: theme.colors.info,
      onPress: () => router.push('/settings'),
    },
  ];

  const dataItems: MenuItem[] = [
    {
      key: 'categories',
      icon: 'tag',
      title: t('categories.title'),
      subtitle: t('more.categories_subtitle'),
      tint: theme.colors.primary,
      onPress: () => router.push('/categories'),
    },
    {
      key: 'reports',
      icon: 'pie-chart',
      title: t('reports.title'),
      subtitle: t('more.reports_subtitle'),
      tint: theme.colors.income,
      onPress: () => router.push('/reports'),
    },
    {
      key: 'import',
      icon: 'upload',
      title: t('import.title'),
      subtitle: t('more.import_subtitle'),
      tint: theme.colors.info,
      onPress: () => router.push('/import'),
    },
  ];

  const renderMenuGroup = (items: MenuItem[]) => (
    <Card
      style={{
        padding: theme.spacing.xs,
        overflow: 'hidden',
        gap: 2,
        borderRadius: theme.radius.card + 2,
        borderColor: softBorderColor,
      }}
    >
      {items.map((item, idx) => (
        <View key={item.key}>
          <Pressable
            accessibilityRole="button"
            onPress={item.onPress}
            style={({ pressed }) => [
              styles.menuItem,
              {
                minHeight: theme.sizes.touchTarget + theme.spacing.sm,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.md,
                gap: theme.spacing.md,
                borderRadius: 12,
                backgroundColor: pressed ? surfaceSubtle : 'transparent',
              },
            ]}
          >
            <View
              style={[
                styles.iconBox,
                { backgroundColor: `${item.tint}14`, borderRadius: 12 },
              ]}
            >
              <Feather name={item.icon} size={19} color={item.tint} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="bodyStrong" numberOfLines={1}>
                {item.title}
              </AppText>
              <AppText variant="caption" muted numberOfLines={1}>
                {item.subtitle}
              </AppText>
            </View>
            {item.badge ? <Badge label={item.badge} variant="danger" /> : null}
            <View
              style={[
                styles.chevronCircle,
                {
                  backgroundColor: surfaceSubtle,
                  borderRadius: theme.radius.full,
                },
              ]}
            >
              <Feather name="chevron-right" size={16} color={theme.colors.textMuted} />
            </View>
          </Pressable>
          {idx < items.length - 1 ? (
            <View
              style={{
                height: 1,
                backgroundColor: softBorderColor,
                opacity: 0.6,
                marginLeft: theme.spacing.md + 42 + theme.spacing.md,
                marginRight: theme.spacing.md,
              }}
            />
          ) : null}
        </View>
      ))}
    </Card>
  );

  return (
    <Screen scroll style={{ paddingBottom: theme.spacing.xxl * 1.5, gap: theme.spacing.md }}>
      {/* Header — Aligned with Transaksi, Anggaran, Tabungan */}
      <View
        style={[
          styles.row,
          {
            paddingTop: theme.spacing.xs,
            paddingBottom: theme.spacing.xs,
            justifyContent: 'space-between',
          },
        ]}
      >
        <AppText variant="title">{t('nav.more')}</AppText>
      </View>

      {/* Profile Hero Island Card */}
      {user ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/profile')}
          style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}
        >
          <Card
            style={{
              padding: theme.spacing.lg,
              borderRadius: theme.radius.card + 2,
              borderColor: softBorderColor,
              borderLeftWidth: 4,
              borderLeftColor: theme.colors.primary,
            }}
          >
            <View style={[styles.row, { gap: theme.spacing.md }]}>
              <View style={styles.avatarContainer}>
                {user.avatar ? (
                  <Image
                    source={{ uri: user.avatar }}
                    style={[
                      styles.avatar,
                      {
                        borderRadius: theme.radius.full,
                        borderWidth: 1.5,
                        borderColor: `${theme.colors.primary}40`,
                      },
                    ]}
                  />
                ) : (
                  <View
                    style={[
                      styles.avatar,
                      {
                        backgroundColor: `${theme.colors.primary}16`,
                        borderRadius: theme.radius.full,
                        borderWidth: 1.5,
                        borderColor: `${theme.colors.primary}35`,
                      },
                    ]}
                  >
                    <AppText variant="subtitle" color={theme.colors.primary}>
                      {user.name.trim().charAt(0).toUpperCase() || 'U'}
                    </AppText>
                  </View>
                )}
                <View
                  style={[
                    styles.onlineDot,
                    {
                      backgroundColor: theme.colors.income,
                      borderColor: theme.colors.surface,
                      borderRadius: theme.radius.full,
                    },
                  ]}
                />
              </View>

              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="subtitle" numberOfLines={1}>
                  {user.name}
                </AppText>
                <AppText variant="caption" muted numberOfLines={1}>
                  {user.email}
                </AppText>
              </View>

              <View
                style={[
                  styles.chevronCircleLarge,
                  {
                    backgroundColor: `${theme.colors.primary}12`,
                    borderRadius: 12,
                  },
                ]}
              >
                <Feather name="chevron-right" size={18} color={theme.colors.primary} />
              </View>
            </View>
          </Card>
        </Pressable>
      ) : null}

      {/* Menu Island 1: Akun, Notifikasi & Pengaturan */}
      {renderMenuGroup(accountItems)}

      {/* Menu Island 2: Kategori, Laporan & Impor */}
      {renderMenuGroup(dataItems)}

      {/* Server Diagnostic Card */}
      <ServerCheckCard />

      {/* Soft Logout Button */}
      <Pressable
        accessibilityRole="button"
        onPress={() => setConfirmLogout(true)}
        style={({ pressed }) => [
          styles.softLogoutBtn,
          {
            minHeight: 50,
            borderRadius: theme.radius.card,
            backgroundColor: `${theme.colors.danger}12`,
            borderColor: `${theme.colors.danger}30`,
            opacity: pressed ? 0.8 : 1,
            gap: theme.spacing.sm,
          },
        ]}
      >
        <Feather name="log-out" size={18} color={theme.colors.danger} />
        <AppText variant="bodyStrong" color={theme.colors.danger}>
          {t('auth.logout')}
        </AppText>
      </Pressable>

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
  avatarContainer: {
    position: 'relative',
    width: 56,
    height: 56,
  },
  avatar: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  onlineDot: {
    position: 'absolute',
    right: 1,
    bottom: 1,
    width: 14,
    height: 14,
    borderWidth: 2,
  },
  chevronCircle: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronCircleLarge: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  softCheckBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  softLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
