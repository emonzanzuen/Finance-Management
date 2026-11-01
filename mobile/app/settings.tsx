import { Alert, Pressable, StyleSheet, View, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { useToast } from '@/components/ui/Toast';
import {
  CURRENCY_CODES,
  usePreferences,
  type CurrencyCode,
  type Language,
  type ThemePreference,
} from '@/context/PreferencesContext';
import { useAuth } from '@/context/AuthContext';
import { useCurrencies } from '@/hooks/useCurrencies';
import { useDeleteReceiptConsent, usePostReceiptConsent } from '@/hooks/useReceipts';
import { useRegisterDevice, useUnregisterDevice } from '@/hooks/useDevices';
import { useTranslation } from '@/i18n/useTranslation';
import { useTheme } from '@/theme/useTheme';
import { CURRENCY_SYMBOLS } from '@/utils/format';
import {
  clearStoredPushToken,
  configureNotifications,
  getExpoPushToken,
  getNotifications,
  getStoredPushToken,
  isExpoGo,
  PUSH_ENABLED_KEY,
  saveStoredPushToken,
  sendLocalNotification,
} from '@/utils/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';

const PRIMARY_CURRENCIES: CurrencyCode[] = ['IDR', 'USD', 'EUR'];

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { profile, refreshProfile } = useAuth();
  const {
    theme: themePref,
    language,
    currency,
    setTheme,
    setLanguage,
    setCurrency,
  } = usePreferences();
  const { rates, updatedAt, source, isFetching, refetch } = useCurrencies();

  const postConsentMutation = usePostReceiptConsent();
  const deleteConsentMutation = useDeleteReceiptConsent();
  const registerDeviceMutation = useRegisterDevice();
  const unregisterDeviceMutation = useUnregisterDevice();

  const hasConsent = profile?.receiptScanConsent === true;
  const isConsentPending = postConsentMutation.isPending || deleteConsentMutation.isPending;

  // Push Notification state
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  useEffect(() => {
    const loadPushSetting = async () => {
      const stored = await AsyncStorage.getItem(PUSH_ENABLED_KEY);
      if (stored !== null) {
        setPushEnabled(stored === 'true');
      }
    };
    void loadPushSetting();
  }, []);

  const handleGrantConsent = async () => {
    try {
      await postConsentMutation.mutateAsync();
      await refreshProfile();
      showToast(t('transactions.scan.consent_granted_toast'), 'success');
    } catch {
      showToast(t('errors.UNKNOWN'), 'error');
    }
  };

  const handleRevokeConsent = async () => {
    Alert.alert(
      t('transactions.scan.consent_title'),
      t('transactions.scan.settings_revoke_confirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('transactions.scan.settings_revoke_consent'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteConsentMutation.mutateAsync();
              await refreshProfile();
              showToast(t('transactions.scan.consent_revoked_toast'), 'success');
            } catch {
              showToast(t('errors.UNKNOWN'), 'error');
            }
          },
        },
      ],
    );
  };

  const requestPushPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      const Notifications = await getNotifications();
      if (!Notifications) return false;
      try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status === 'granted') return true;
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        return newStatus === 'granted';
      } catch {
        return false;
      }
    }
    return true;
  };

  const handlePushToggle = async (enabled: boolean) => {
    if (pushLoading) return;
    const previous = pushEnabled;
    setPushLoading(true);
    try {
      if (enabled) {
        await configureNotifications();
        const granted = await requestPushPermission();
        if (!granted) {
          showToast(t('settings.push_permission_denied'), 'error');
          setPushEnabled(false);
          return;
        }

        // Try remote push registration on APK builds if EAS projectId is configured
        const token = await getExpoPushToken();
        if (token) {
          try {
            await registerDeviceMutation.mutateAsync({
              expoPushToken: token,
              locale: language,
            });
            await saveStoredPushToken(token);
          } catch {
            // Best-effort remote device registration; local phone notifications still work
          }
        }

        await AsyncStorage.setItem(PUSH_ENABLED_KEY, 'true');
        setPushEnabled(true);
        showToast(t('settings.push_enabled_toast'), 'success');

        // Immediately send an OS-level heads-up notification so the user sees it pop up like WhatsApp
        await sendLocalNotification({
          title: t('settings.push_test_title'),
          body: t('settings.push_test_body'),
          data: { targetScreen: 'notifications', url: '/notifications' },
        });
      } else {
        const token = await getStoredPushToken();
        if (token) {
          try {
            await unregisterDeviceMutation.mutateAsync(token);
          } catch {
            // Best-effort unregister
          }
          await clearStoredPushToken();
        }
        await AsyncStorage.setItem(PUSH_ENABLED_KEY, 'false');
        setPushEnabled(false);
        showToast(t('settings.push_disabled_toast'), 'success');
      }
    } catch {
      showToast(t('errors.UNKNOWN'), 'error');
      setPushEnabled(previous);
    } finally {
      setPushLoading(false);
    }
  };

  const handleTestNotification = async () => {
    const granted = await requestPushPermission();
    if (!granted) {
      showToast(t('settings.push_permission_denied'), 'error');
      return;
    }
    const ok = await sendLocalNotification({
      title: t('settings.push_test_title'),
      body: t('settings.push_test_body'),
      data: { targetScreen: 'notifications', url: '/notifications' },
    });
    if (ok) {
      showToast(t('settings.push_test_sent_toast'), 'info');
    } else {
      showToast(t('errors.UNKNOWN'), 'error');
    }
  };

  const themeOptions: {
    value: ThemePreference;
    label: string;
    icon: React.ComponentProps<typeof Feather>['name'];
  }[] = [
    { value: 'system', label: t('settings.system'), icon: 'smartphone' },
    { value: 'light', label: t('settings.light'), icon: 'sun' },
    { value: 'dark', label: t('settings.dark'), icon: 'moon' },
  ];

  const languageOptions: { value: Language; label: string }[] = [
    { value: 'id', label: t('settings.lang_id') },
    { value: 'en', label: t('settings.lang_en') },
  ];

  const sourceLabel =
    source === 'live'
      ? t('settings.source_live')
      : source === 'cache'
        ? t('settings.source_cache')
        : t('settings.source_fallback');

  const formattedUpdated = updatedAt
    ? new Date(updatedAt).toLocaleString(language === 'en' ? 'en-US' : 'id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : t('common.not_updated');

  return (
    <Screen scroll>
      {/* Header */}
      <View style={[styles.header, { gap: theme.spacing.sm }]}>
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
          <AppText variant="title">{t('settings.title')}</AppText>
          <AppText variant="caption" muted>
            {t('settings.subtitle')}
          </AppText>
        </View>
      </View>

      {/* Theme Selection (SET-01) */}
      <Card>
        <AppText variant="subtitle">{t('settings.theme')}</AppText>
        <View style={{ gap: theme.spacing.xs }}>
          {themeOptions.map((opt) => {
            const active = themePref === opt.value;
            return (
              <Pressable
                key={opt.value}
                accessibilityRole="button"
                onPress={() => {
                  setTheme(opt.value);
                }}
                style={[
                  styles.optionRow,
                  {
                    minHeight: theme.sizes.touchTarget,
                    borderRadius: theme.radius.control,
                    borderWidth: 1,
                    borderColor: active ? theme.colors.primary : theme.colors.border,
                    backgroundColor: active ? `${theme.colors.primary}15` : theme.colors.surface,
                    paddingHorizontal: theme.spacing.md,
                    gap: theme.spacing.md,
                  },
                ]}
              >
                <Feather
                  name={opt.icon}
                  size={18}
                  color={active ? theme.colors.primary : theme.colors.textMuted}
                />
                <AppText
                  variant="bodyStrong"
                  color={active ? theme.colors.primary : theme.colors.text}
                  style={{ flex: 1 }}
                >
                  {opt.label}
                </AppText>
                {active ? <Feather name="check" size={18} color={theme.colors.primary} /> : null}
              </Pressable>
            );
          })}
        </View>
      </Card>

      {/* Language Selection (SET-02) */}
      <Card>
        <AppText variant="subtitle">{t('settings.language')}</AppText>
        <View style={[styles.row, { gap: theme.spacing.sm }]}>
          {languageOptions.map((opt) => {
            const active = language === opt.value;
            return (
              <Pressable
                key={opt.value}
                accessibilityRole="button"
                onPress={() => {
                  setLanguage(opt.value);
                  showToast(t('common.language_changed', { language: opt.label }), 'info');
                }}
                style={[
                  styles.segmentBtn,
                  {
                    minHeight: theme.sizes.touchTarget,
                    borderRadius: theme.radius.control,
                    borderWidth: 1,
                    borderColor: active ? theme.colors.primary : theme.colors.border,
                    backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                    paddingHorizontal: theme.spacing.md,
                  },
                ]}
              >
                <AppText
                  variant="bodyStrong"
                  color={active ? theme.colors.onPrimary : theme.colors.text}
                >
                  {opt.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {/* Display Currency Selection (SET-03, CUR-01, CUR-02, CUR-04) */}
      <Card>
        <View style={{ gap: theme.spacing.xs }}>
          <AppText variant="subtitle">{t('settings.currency')}</AppText>
          <AppText variant="caption" muted>
            {t('settings.currency_hint')}
          </AppText>
        </View>

        {/* P0 Primary Currencies: IDR, USD, EUR */}
        <View style={[styles.row, { gap: theme.spacing.sm }]}>
          {PRIMARY_CURRENCIES.map((code) => {
            const active = currency === code;
            return (
              <Pressable
                key={code}
                accessibilityRole="button"
                onPress={() => {
                  setCurrency(code);
                  showToast(t('common.currency_changed', { currency: code }), 'info');
                }}
                style={[
                  styles.segmentBtn,
                  {
                    minHeight: theme.sizes.touchTarget,
                    borderRadius: theme.radius.control,
                    borderWidth: 1,
                    borderColor: active ? theme.colors.primary : theme.colors.border,
                    backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                  },
                ]}
              >
                <AppText
                  variant="bodyStrong"
                  color={active ? theme.colors.onPrimary : theme.colors.text}
                >
                  {code} ({CURRENCY_SYMBOLS[code].trim()})
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {/* Additional Supported Currencies */}
        <View style={[styles.currencyGrid, { gap: theme.spacing.xs }]}>
          {CURRENCY_CODES.filter((c) => !PRIMARY_CURRENCIES.includes(c)).map((code) => {
            const active = currency === code;
            return (
              <Pressable
                key={code}
                accessibilityRole="button"
                onPress={() => {
                  setCurrency(code);
                  showToast(t('common.currency_changed', { currency: code }), 'info');
                }}
                style={[
                  styles.currencyChip,
                  {
                    minHeight: 40,
                    borderRadius: theme.radius.control,
                    borderWidth: 1,
                    borderColor: active ? theme.colors.primary : theme.colors.border,
                    backgroundColor: active ? theme.colors.primary : theme.colors.surfaceAlt,
                    paddingHorizontal: theme.spacing.md,
                  },
                ]}
              >
                <AppText
                  variant="caption"
                  color={active ? theme.colors.onPrimary : theme.colors.text}
                  style={{ fontWeight: '600' }}
                >
                  {code} ({CURRENCY_SYMBOLS[code].trim()})
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {/* Exchange Rates Info & Refresh */}
        <View
          style={[
            styles.ratesBox,
            {
              backgroundColor: theme.colors.surfaceAlt,
              borderRadius: theme.radius.control,
              padding: theme.spacing.md,
              gap: theme.spacing.xs,
            },
          ]}
        >
          <AppText variant="bodyStrong">{t('settings.exchange_rates')}</AppText>
          {currency !== 'IDR' && currency !== 'USD' && currency !== 'EUR' ? (
            <View style={styles.rateRow}>
              <AppText variant="caption" muted>
                1 {currency}
              </AppText>
              <AppText variant="bodyStrong">
                ≈ Rp{' '}
                {Math.round(1 / (rates[currency] || 1)).toLocaleString(
                  language === 'en' ? 'en-US' : 'id-ID',
                )}
              </AppText>
            </View>
          ) : null}
          <View style={styles.rateRow}>
            <AppText variant="caption" muted>
              1 USD
            </AppText>
            <AppText variant="bodyStrong">
              ≈ Rp {Math.round(1 / (rates.USD || 0.0000606)).toLocaleString(language === 'en' ? 'en-US' : 'id-ID')}
            </AppText>
          </View>
          <View style={styles.rateRow}>
            <AppText variant="caption" muted>
              1 EUR
            </AppText>
            <AppText variant="bodyStrong">
              ≈ Rp {Math.round(1 / (rates.EUR || 0.0000558)).toLocaleString(language === 'en' ? 'en-US' : 'id-ID')}
            </AppText>
          </View>
          <AppText variant="caption" muted>
            {t('settings.last_updated')}: {formattedUpdated} • {sourceLabel}
          </AppText>
        </View>

        <Button
          variant="secondary"
          label={isFetching ? t('common.updating') : t('settings.refresh')}
          loading={isFetching}
          onPress={async () => {
            await refetch();
            showToast(t('settings.rates_refreshed'), 'success');
          }}
        />
      </Card>

      {/* Card 1 (Upgraded): Receipt Scan Consent (SCN-04, SCN-05) */}
      <Card>
        <View style={[styles.featureCardHeader, { gap: theme.spacing.md }]}>
          <View
            style={[
              styles.featureIconBadge,
              {
                backgroundColor: hasConsent
                  ? `${theme.colors.income}18`
                  : `${theme.colors.primary}15`,
                borderRadius: theme.radius.control,
              },
            ]}
          >
            <Feather
              name="camera"
              size={20}
              color={hasConsent ? theme.colors.income : theme.colors.primary}
            />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="subtitle">{t('transactions.scan.consent_title')}</AppText>
            <AppText variant="caption" muted>
              {t('transactions.scan.settings_consent_status')}
            </AppText>
          </View>
          <Badge
            label={
              hasConsent
                ? t('transactions.scan.settings_consent_status_granted')
                : t('transactions.scan.settings_consent_status_denied')
            }
            variant={hasConsent ? 'success' : 'warning'}
          />
        </View>

        <View
          style={[
            styles.featureInfoBox,
            {
              backgroundColor: theme.colors.surfaceAlt,
              borderRadius: theme.radius.control,
              padding: theme.spacing.md,
            },
          ]}
        >
          <AppText variant="caption" muted style={{ lineHeight: 19 }}>
            {t('transactions.scan.consent_description')}
          </AppText>
        </View>

        {hasConsent ? (
          <Button
            variant="danger"
            icon="slash"
            label={t('transactions.scan.settings_revoke_consent')}
            loading={isConsentPending}
            disabled={isConsentPending}
            onPress={() => void handleRevokeConsent()}
          />
        ) : (
          <Button
            variant="secondary"
            icon="check-circle"
            label={t('transactions.scan.settings_grant_consent')}
            loading={isConsentPending}
            disabled={isConsentPending}
            onPress={() => void handleGrantConsent()}
          />
        )}
      </Card>

      {/* Card 2 (Upgraded): Push Notifications (NOT-04, NOT-05, NOT-06, SET-04) */}
      <Card>
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: pushEnabled, busy: pushLoading }}
          onPress={() => void handlePushToggle(!pushEnabled)}
          disabled={pushLoading}
          style={[styles.featureCardHeader, { gap: theme.spacing.md }]}
        >
          <View
            style={[
              styles.featureIconBadge,
              {
                backgroundColor: pushEnabled
                  ? `${theme.colors.primary}18`
                  : theme.colors.surfaceAlt,
                borderRadius: theme.radius.control,
              },
            ]}
          >
            <Feather
              name="bell"
              size={20}
              color={pushEnabled ? theme.colors.primary : theme.colors.textMuted}
            />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
              <AppText variant="subtitle">{t('settings.push_notifications')}</AppText>
              <Badge
                label={pushEnabled ? t('settings.push_status_active') : t('settings.push_status_inactive')}
                variant={pushEnabled ? 'success' : 'neutral'}
              />
            </View>
            <AppText variant="caption" muted style={{ lineHeight: 18 }}>
              {t('settings.push_notifications_desc')}
            </AppText>
          </View>

          <View
            style={[
              styles.switchTrack,
              {
                backgroundColor: pushEnabled ? theme.colors.primary : theme.colors.border,
                borderColor: pushEnabled ? theme.colors.primary : theme.colors.border,
                opacity: pushLoading ? 0.6 : 1,
              },
            ]}
          >
            <View
              style={[
                styles.switchThumb,
                {
                  transform: [{ translateX: pushEnabled ? 22 : 0 }],
                  backgroundColor: '#FFFFFF',
                },
              ]}
            />
          </View>
        </Pressable>

        {isExpoGo ? (
          <View
            style={[
              styles.featureInfoBox,
              {
                backgroundColor: `${theme.colors.info}12`,
                borderRadius: theme.radius.control,
                padding: theme.spacing.sm,
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing.sm,
              },
            ]}
          >
            <Feather name="info" size={16} color={theme.colors.info} />
            <AppText variant="caption" color={theme.colors.info} style={{ flex: 1, lineHeight: 18 }}>
              {t('settings.push_only_apk')}
            </AppText>
          </View>
        ) : null}

        {pushEnabled ? (
          <Button
            variant="secondary"
            icon="bell"
            label={t('settings.push_test_btn')}
            onPress={() => void handleTestNotification()}
          />
        ) : null}
      </Card>

      {/* Card 3 (Upgraded): About FinManage (SET-05) */}
      <Card>
        <View style={[styles.featureCardHeader, { gap: theme.spacing.md }]}>
          <View
            style={[
              styles.featureIconBadge,
              {
                backgroundColor: `${theme.colors.primary}15`,
                borderRadius: theme.radius.control,
              },
            ]}
          >
            <Feather name="shield" size={20} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="subtitle">{t('settings.about')}</AppText>
            <AppText variant="caption" muted>
              FinManage Android
            </AppText>
          </View>
          <Badge label="v1.0.0" variant="info" />
        </View>

        <View
          style={[
            styles.featureInfoBox,
            {
              backgroundColor: theme.colors.surfaceAlt,
              borderRadius: theme.radius.control,
              padding: theme.spacing.md,
              gap: theme.spacing.sm,
            },
          ]}
        >
          <AppText variant="caption" muted style={{ lineHeight: 19 }}>
            {t('settings.about_description')}
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
            <Badge label={t('settings.about_privacy_badge')} variant="success" />
            <Badge label={t('settings.about_storage_badge')} variant="neutral" />
          </View>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  segmentBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  currencyChip: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratesBox: {
    width: '100%',
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featureCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIconBadge: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureInfoBox: {
    width: '100%',
  },
  switchTrack: {
    width: 52,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
});
