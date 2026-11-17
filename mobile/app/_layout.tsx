import { useState, useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { PreferencesProvider, usePreferences } from '@/context/PreferencesContext';
import { useNotificationsInfinite } from '@/hooks/useNotifications';
import { useTranslation } from '@/i18n/useTranslation';
import { useTheme } from '@/theme/useTheme';
import type { NotificationItem } from '@/types/api';
import {
  getNotifications,
  configureNotifications,
  PUSH_ENABLED_KEY,
  sendLocalNotification,
} from '@/utils/notifications';

const ALLOWED_PUSH_PATHS = ['/(tabs)/budget', '/(tabs)/savings', '/notifications'];

type PushResponse = {
  notification: { request: { content: { data?: unknown } } };
};

function resolveNotificationTarget(data: unknown): string {
  if (typeof data !== 'object' || data === null) return '/notifications';
  const record = data as { url?: unknown; targetScreen?: unknown };

  if (typeof record.targetScreen === 'string') {
    if (record.targetScreen === 'budget') return '/(tabs)/budget';
    if (record.targetScreen === 'savings') return '/(tabs)/savings';
    if (record.targetScreen === 'notifications') return '/notifications';
  }

  if (typeof record.url === 'string' && record.url.length > 0) {
    const path = record.url.split('?')[0].split('#')[0];
    if (ALLOWED_PUSH_PATHS.includes(path)) return path;
  }

  return '/notifications';
}

function PushNotificationListener() {
  const { status } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const unreadQuery = useNotificationsInfinite(true);
  const seenIdsRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (status !== 'signedIn') return;

    let listener: { remove: () => void } | null = null;
    let cancelled = false;

    const handleResponse = (response: PushResponse) => {
      const data = response.notification.request.content.data;
      const target = resolveNotificationTarget(data);
      router.push(target as never);
    };

    const setup = async () => {
      try {
        await configureNotifications();
        const Notifications = await getNotifications();
        if (
          !Notifications ||
          cancelled ||
          typeof Notifications.addNotificationResponseReceivedListener !== 'function'
        ) {
          return;
        }

        listener = Notifications.addNotificationResponseReceivedListener(handleResponse);

        // Cold start: app opened by tapping a notification while terminated.
        if (typeof Notifications.getLastNotificationResponseAsync === 'function') {
          const lastResponse = await Notifications.getLastNotificationResponseAsync();
          if (lastResponse && !cancelled) handleResponse(lastResponse);
        }
      } catch {
        // Safely ignore listener setup errors if native module is unavailable
      }
    };

    void setup();

    return () => {
      cancelled = true;
      listener?.remove();
    };
  }, [status, router]);

  // Watch unread notifications and trigger OS-level heads-up notification banner
  // on the phone (like WhatsApp) whenever a new unread notification arrives.
  useEffect(() => {
    if (status !== 'signedIn' || !unreadQuery.data) return;

    const items = unreadQuery.data.pages.flatMap((p) => p.data);

    // On initial load, seed existing unread IDs so we only pop up newly created alerts.
    if (seenIdsRef.current === null) {
      seenIdsRef.current = new Set(items.map((item) => item.id));
      return;
    }

    const newItems: NotificationItem[] = [];
    for (const item of items) {
      if (!seenIdsRef.current.has(item.id)) {
        seenIdsRef.current.add(item.id);
        newItems.push(item);
      }
    }

    if (newItems.length === 0) return;

    void (async () => {
      const storedPref = await AsyncStorage.getItem(PUSH_ENABLED_KEY);
      // Default to enabled unless user explicitly turned it off ('false')
      if (storedPref === 'false') return;

      for (const item of newItems) {
        const monthIndex = item.data?.month ? Math.max(0, Math.min(11, item.data.month - 1)) : 0;
        const monthName = item.data?.month ? t(`common.months_full.${monthIndex}`) : '';
        const periodStr =
          monthName && item.data?.year ? `${monthName} ${item.data.year}` : '';

        let title = '';
        let body = '';
        let targetScreen: 'budget' | 'savings' = 'budget';

        if (item.type === 'budget_warning') {
          title = t('notifications.budget_warning_title');
          body = t('notifications.budget_warning_body', {
            category: item.data?.categoryName ?? '-',
            percentage: Math.round(Number(item.data?.percentage ?? 90)),
            period: periodStr,
          });
          targetScreen = 'budget';
        } else if (item.type === 'budget_exceeded') {
          title = t('notifications.budget_exceeded_title');
          body = t('notifications.budget_exceeded_body', {
            category: item.data?.categoryName ?? '-',
            percentage: Math.round(Number(item.data?.percentage ?? 100)),
            period: periodStr,
          });
          targetScreen = 'budget';
        } else {
          title = t('notifications.goal_completed_title');
          body = t('notifications.goal_completed_body', {
            title: item.data?.title ?? '-',
          });
          targetScreen = 'savings';
        }

        await sendLocalNotification({
          title,
          body,
          data: {
            targetScreen,
            url: targetScreen === 'savings' ? '/(tabs)/savings' : '/(tabs)/budget',
            notificationId: item.id,
          },
        });
      }
    })();
  }, [status, unreadQuery.data, t]);

  return null;
}

function RootNavigator() {
  const { status, warmingUp } = useAuth();
  const { ready } = usePreferences();
  const { t } = useTranslation();
  const theme = useTheme();

  // Configure notifications once on app startup
  useEffect(() => {
    void configureNotifications();
  }, []);

  if (status === 'loading' || !ready) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.background,
          gap: theme.spacing.md,
          padding: theme.spacing.lg,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        {warmingUp ? (
          <AppText color={theme.colors.warning}>{t('health.warming_up')}</AppText>
        ) : null}
      </View>
    );
  }

  const signedIn = status === 'signedIn';
  return (
    <>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      {signedIn && <PushNotificationListener />}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="categories" />
          <Stack.Screen name="reports" />
          <Stack.Screen name="import" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="transaction/form" />
          <Stack.Screen name="transaction/scan" />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  // In-memory cache only: no persistence of financial data to disk.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
      }),
  );

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <PreferencesProvider>
          <AuthProvider>
            <ToastProvider>
              <RootNavigator />
            </ToastProvider>
          </AuthProvider>
        </PreferencesProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
