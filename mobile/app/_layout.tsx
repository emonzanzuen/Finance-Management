import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { PreferencesProvider, usePreferences } from '@/context/PreferencesContext';
import { useTranslation } from '@/i18n/useTranslation';
import { useTheme } from '@/theme/useTheme';

function RootNavigator() {
  const { status, warmingUp } = useAuth();
  const { ready } = usePreferences();
  const { t } = useTranslation();
  const theme = useTheme();

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
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="categories" />
          <Stack.Screen name="transaction/form" />
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
