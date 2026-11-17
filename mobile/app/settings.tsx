import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { useRegisterDevice, useUnregisterDevice } from '@/hooks/useDevices';
import { useDeleteReceiptConsent, usePostReceiptConsent } from '@/hooks/useReceipts';
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

  const softBorderColor = theme.isDark ? theme.colors.border : `${theme.colors.border}B8`;
  const surfaceSubtle = theme.isDark ? theme.colors.surfaceAlt : `${theme.colors.surfaceAlt}90`;

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

  const languageOptions: { value: Language; label: string; code: string }[] = [
    { value: 'id', label: t('settings.lang_id'), code: 'ID' },
    { value: 'en', label: t('settings.lang_en'), code: 'EN' },
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
    <Screen scroll style={{ paddingBottom: theme.spacing.xxl * 1.5, gap: theme.spacing.md }}>
      {/* Header — Aligned Soft Depth Back Button */}
      <View
        style={[
          styles.header,
          {
            paddingTop: theme.spacing.xs,
            paddingBottom: theme.spacing.xs,
            gap: theme.spacing.md,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backBtn,
            {
              width: 42,
              height: 42,
              borderRadius: 12,
              backgroundColor: theme.colors.surface,
              borderColor: softBorderColor,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Feather name="arrow-left" size={20} color={theme.colors.text} />
        </Pressable>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="title">{t('settings.title')}</AppText>
          <AppText variant="caption" muted numberOfLines={1}>
            {t('settings.subtitle')}
          </AppText>
        </View>
      </View>

      {/* Section 1: Theme Selection (SET-01) — Floating Island 3-Card Picker */}
      <Card
        style={{
          padding: theme.spacing.lg,
          gap: theme.spacing.md,
          borderRadius: theme.radius.card + 2,
          borderColor: softBorderColor,
        }}
      >
        <View style={[styles.featureCardHeader, { gap: theme.spacing.md }]}>
          <View
            style={[
              styles.featureIconBadge,
              {
                backgroundColor: `${theme.colors.primary}14`,
                borderRadius: 12,
              },
            ]}
          >
            <Feather
              name={theme.isDark ? 'moon' : 'sun'}
              size={19}
              color={theme.colors.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="subtitle">{t('settings.theme')}</AppText>
          </View>
        </View>

        <View
          style={[
            styles.islandTrack,
            {
              backgroundColor: surfaceSubtle,
              borderColor: softBorderColor,
              borderRadius: 16,
              padding: 6,
              gap: 6,
            },
          ]}
        >
          {themeOptions.map((opt) => {
            const active = themePref === opt.value;
            return (
              <Pressable
                key={opt.value}
                accessibilityRole="button"
                onPress={() => setTheme(opt.value)}
                style={({ pressed }) => [
                  styles.themeIslandItem,
                  {
                    borderRadius: 12,
                    borderWidth: active ? 1.5 : 1,
                    borderColor: active ? theme.colors.primary : 'transparent',
                    backgroundColor: active
                      ? theme.colors.surface
                      : pressed
                        ? `${theme.colors.surface}80`
                        : 'transparent',
                    paddingVertical: theme.spacing.sm + 2,
                    paddingHorizontal: theme.spacing.xs,
                    gap: 6,
                    shadowColor: '#0F172A',
                    shadowOpacity: active && !theme.isDark ? 0.06 : 0,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: active && !theme.isDark ? 2 : 0,
                  },
                ]}
              >
                <View
                  style={[
                    styles.themeIconCircle,
                    {
                      backgroundColor: active
                        ? `${theme.colors.primary}16`
                        : `${theme.colors.textMuted}12`,
                      borderRadius: 10,
                    },
                  ]}
                >
                  <Feather
                    name={opt.icon}
                    size={16}
                    color={active ? theme.colors.primary : theme.colors.textMuted}
                  />
                </View>
                <AppText
                  variant="caption"
                  color={active ? theme.colors.primary : theme.colors.text}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                  style={{ fontWeight: active ? '700' : '500', textAlign: 'center' }}
                >
                  {opt.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {/* Section 2: Language Selection (SET-02) — Floating Island Dock */}
      <Card
        style={{
          padding: theme.spacing.lg,
          gap: theme.spacing.md,
          borderRadius: theme.radius.card + 2,
          borderColor: softBorderColor,
        }}
      >
        <View style={[styles.featureCardHeader, { gap: theme.spacing.md }]}>
          <View
            style={[
              styles.featureIconBadge,
              {
                backgroundColor: `${theme.colors.info}14`,
                borderRadius: 12,
              },
            ]}
          >
            <Feather name="globe" size={19} color={theme.colors.info} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="subtitle">{t('settings.language')}</AppText>
          </View>
        </View>

        <View
          style={[
            styles.islandTrack,
            {
              backgroundColor: surfaceSubtle,
              borderColor: softBorderColor,
              borderRadius: 14,
              padding: 5,
              gap: 6,
            },
          ]}
        >
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
                style={({ pressed }) => [
                  styles.segmentBtn,
                  {
                    minHeight: 44,
                    borderRadius: 10,
                    borderWidth: active ? 1.5 : 1,
                    borderColor: active ? theme.colors.primary : 'transparent',
                    backgroundColor: active
                      ? theme.colors.surface
                      : pressed
                        ? `${theme.colors.surface}80`
                        : 'transparent',
                    paddingHorizontal: theme.spacing.sm,
                    gap: 8,
                    shadowColor: '#0F172A',
                    shadowOpacity: active && !theme.isDark ? 0.05 : 0,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: active && !theme.isDark ? 1 : 0,
                  },
                ]}
              >
                <View
                  style={[
                    styles.langCodeBadge,
                    {
                      backgroundColor: active
                        ? theme.colors.primary
                        : `${theme.colors.textMuted}18`,
                      borderRadius: 6,
                    },
                  ]}
                >
                  <AppText
                    variant="caption"
                    color={active ? theme.colors.onPrimary : theme.colors.textMuted}
                    style={{ fontSize: 10, fontWeight: '700' }}
                  >
                    {opt.code}
                  </AppText>
                </View>
                <AppText
                  variant="bodyStrong"
                  color={active ? theme.colors.primary : theme.colors.text}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  {opt.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {/* Section 3: Display Currency Selection (SET-03, CUR-01, CUR-02, CUR-04) */}
      <Card
        style={{
          padding: theme.spacing.lg,
          gap: theme.spacing.md,
          borderRadius: theme.radius.card + 2,
          borderColor: softBorderColor,
        }}
      >
        <View style={[styles.featureCardHeader, { gap: theme.spacing.md }]}>
          <View
            style={[
              styles.featureIconBadge,
              {
                backgroundColor: `${theme.colors.income}14`,
                borderRadius: 12,
              },
            ]}
          >
            <Feather name="dollar-sign" size={19} color={theme.colors.income} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="subtitle">{t('settings.currency')}</AppText>
            <AppText variant="caption" muted>
              {t('settings.currency_hint')}
            </AppText>
          </View>
        </View>

        {/* P0 Primary Currencies: IDR, USD, EUR in a Floating Island Dock */}
        <View
          style={[
            styles.islandTrack,
            {
              backgroundColor: surfaceSubtle,
              borderColor: softBorderColor,
              borderRadius: 14,
              padding: 5,
              gap: 6,
            },
          ]}
        >
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
                style={({ pressed }) => [
                  styles.segmentBtn,
                  {
                    minHeight: 42,
                    borderRadius: 10,
                    borderWidth: active ? 1.5 : 1,
                    borderColor: active ? theme.colors.primary : 'transparent',
                    backgroundColor: active
                      ? theme.colors.surface
                      : pressed
                        ? `${theme.colors.surface}80`
                        : 'transparent',
                    paddingHorizontal: 6,
                    shadowColor: '#0F172A',
                    shadowOpacity: active && !theme.isDark ? 0.05 : 0,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: active && !theme.isDark ? 1 : 0,
                  },
                ]}
              >
                <AppText
                  variant="bodyStrong"
                  color={active ? theme.colors.primary : theme.colors.text}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                >
                  {code} ({CURRENCY_SYMBOLS[code].trim()})
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {/* Additional Supported Currencies */}
        <View style={[styles.currencyGrid, { gap: 8 }]}>
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
                style={({ pressed }) => [
                  styles.currencyChip,
                  {
                    minHeight: 38,
                    borderRadius: 10,
                    borderWidth: active ? 1.5 : 1,
                    borderColor: active ? theme.colors.primary : softBorderColor,
                    backgroundColor: active ? `${theme.colors.primary}15` : surfaceSubtle,
                    paddingHorizontal: theme.spacing.md,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <AppText
                  variant="caption"
                  color={active ? theme.colors.primary : theme.colors.text}
                  style={{ fontWeight: active ? '700' : '600' }}
                >
                  {code} ({CURRENCY_SYMBOLS[code].trim()})
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {/* Exchange Rates Info & Refresh — Recessed Flat-Layered Box */}
        <View
          style={[
            styles.ratesBox,
            {
              backgroundColor: surfaceSubtle,
              borderColor: softBorderColor,
              borderRadius: 14,
              padding: theme.spacing.md,
              gap: theme.spacing.sm,
            },
          ]}
        >
          <View style={styles.rateRow}>
            <View style={[styles.row, { gap: 6 }]}>
              <Feather name="activity" size={14} color={theme.colors.primary} />
              <AppText variant="bodyStrong">{t('settings.exchange_rates')}</AppText>
            </View>
            <View
              style={[
                styles.sourcePill,
                {
                  backgroundColor:
                    source === 'live'
                      ? `${theme.colors.income}16`
                      : `${theme.colors.textMuted}16`,
                  borderRadius: theme.radius.full,
                },
              ]}
            >
              <AppText
                variant="caption"
                color={source === 'live' ? theme.colors.income : theme.colors.textMuted}
                style={{ fontWeight: '700', fontSize: 11 }}
              >
                {sourceLabel}
              </AppText>
            </View>
          </View>

          <View
            style={{
              height: 1,
              backgroundColor: softBorderColor,
              opacity: 0.7,
            }}
          />

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
              ≈ Rp{' '}
              {Math.round(1 / (rates.USD || 0.0000606)).toLocaleString(
                language === 'en' ? 'en-US' : 'id-ID',
              )}
            </AppText>
          </View>

          <View style={styles.rateRow}>
            <AppText variant="caption" muted>
              1 EUR
            </AppText>
            <AppText variant="bodyStrong">
              ≈ Rp{' '}
              {Math.round(1 / (rates.EUR || 0.0000558)).toLocaleString(
                language === 'en' ? 'en-US' : 'id-ID',
              )}
            </AppText>
          </View>

          <View style={[styles.row, { gap: 6, marginTop: 2 }]}>
            <Feather name="clock" size={12} color={theme.colors.textMuted} />
            <AppText variant="caption" muted style={{ flex: 1 }}>
              {t('settings.last_updated')}: {formattedUpdated}
            </AppText>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={isFetching}
          onPress={async () => {
            await refetch();
            showToast(t('settings.rates_refreshed'), 'success');
          }}
          style={({ pressed }) => [
            styles.softActionBtn,
            {
              minHeight: 42,
              borderRadius: 12,
              backgroundColor: `${theme.colors.primary}12`,
              borderColor: `${theme.colors.primary}28`,
              opacity: isFetching ? 0.6 : pressed ? 0.8 : 1,
              gap: 8,
            },
          ]}
        >
          <Feather name="refresh-cw" size={15} color={theme.colors.primary} />
          <AppText variant="bodyStrong" color={theme.colors.primary}>
            {isFetching ? t('common.updating') : t('settings.refresh')}
          </AppText>
        </Pressable>
      </Card>

      {/* Section 4: Receipt Scan Consent (SCN-04, SCN-05) */}
      <Card
        style={{
          padding: theme.spacing.lg,
          gap: theme.spacing.md,
          borderRadius: theme.radius.card + 2,
          borderColor: softBorderColor,
          borderLeftWidth: 4,
          borderLeftColor: hasConsent ? theme.colors.income : theme.colors.warning,
        }}
      >
        <View style={[styles.featureCardHeader, { gap: theme.spacing.md }]}>
          <View
            style={[
              styles.featureIconBadge,
              {
                backgroundColor: hasConsent
                  ? `${theme.colors.income}16`
                  : `${theme.colors.warning}16`,
                borderRadius: 12,
              },
            ]}
          >
            <Feather
              name="camera"
              size={19}
              color={hasConsent ? theme.colors.income : theme.colors.warning}
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
              backgroundColor: surfaceSubtle,
              borderColor: softBorderColor,
              borderRadius: 12,
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

      {/* Section 5: Push Notifications (NOT-04, NOT-05, NOT-06, SET-04) */}
      <Card
        style={{
          padding: theme.spacing.lg,
          gap: theme.spacing.md,
          borderRadius: theme.radius.card + 2,
          borderColor: softBorderColor,
          borderLeftWidth: 4,
          borderLeftColor: pushEnabled ? theme.colors.primary : theme.colors.border,
        }}
      >
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
                backgroundColor: pushEnabled ? `${theme.colors.primary}16` : surfaceSubtle,
                borderRadius: 12,
              },
            ]}
          >
            <Feather
              name="bell"
              size={19}
              color={pushEnabled ? theme.colors.primary : theme.colors.textMuted}
            />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
              <AppText variant="subtitle">{t('settings.push_notifications')}</AppText>
              <Badge
                label={
                  pushEnabled
                    ? t('settings.push_status_active')
                    : t('settings.push_status_inactive')
                }
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
                borderColor: `${theme.colors.info}28`,
                borderRadius: 12,
                padding: theme.spacing.sm + 2,
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
          <Pressable
            accessibilityRole="button"
            onPress={() => void handleTestNotification()}
            style={({ pressed }) => [
              styles.softActionBtn,
              {
                minHeight: 42,
                borderRadius: 12,
                backgroundColor: `${theme.colors.primary}12`,
                borderColor: `${theme.colors.primary}28`,
                opacity: pressed ? 0.8 : 1,
                gap: 8,
              },
            ]}
          >
            <Feather name="bell" size={15} color={theme.colors.primary} />
            <AppText variant="bodyStrong" color={theme.colors.primary}>
              {t('settings.push_test_btn')}
            </AppText>
          </Pressable>
        ) : null}
      </Card>

      {/* Section 6: About FinManage (SET-05) */}
      <Card
        style={{
          padding: theme.spacing.lg,
          gap: theme.spacing.md,
          borderRadius: theme.radius.card + 2,
          borderColor: softBorderColor,
        }}
      >
        <View style={[styles.featureCardHeader, { gap: theme.spacing.md }]}>
          <View
            style={[
              styles.featureIconBadge,
              {
                backgroundColor: `${theme.colors.primary}14`,
                borderRadius: 12,
              },
            ]}
          >
            <Feather name="shield" size={19} color={theme.colors.primary} />
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
              backgroundColor: surfaceSubtle,
              borderColor: softBorderColor,
              borderRadius: 12,
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
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  islandTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  themeIslandItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeIconCircle: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langCodeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
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
    borderWidth: 1,
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sourcePill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  softActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  featureCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIconBadge: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureInfoBox: {
    width: '100%',
    borderWidth: 1,
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
