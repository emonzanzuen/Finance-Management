import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
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
import { useCurrencies } from '@/hooks/useCurrencies';
import { useTranslation } from '@/i18n/useTranslation';
import { useTheme } from '@/theme/useTheme';
import { CURRENCY_SYMBOLS } from '@/utils/format';

const PRIMARY_CURRENCIES: CurrencyCode[] = ['IDR', 'USD', 'EUR'];

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const {
    theme: themePref,
    language,
    currency,
    setTheme,
    setLanguage,
    setCurrency,
  } = usePreferences();
  const { rates, updatedAt, source, isFetching, refetch } = useCurrencies();

  const themeOptions: { value: ThemePreference; label: string; icon: React.ComponentProps<typeof Feather>['name'] }[] = [
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

      {/* About Card (SET-05) */}
      <Card>
        <View style={styles.rateRow}>
          <AppText variant="subtitle">{t('settings.about')}</AppText>
          <AppText variant="caption" muted>
            v1.0.0
          </AppText>
        </View>
        <AppText variant="bodyStrong">FinManage Android</AppText>
        <AppText variant="caption" muted>
          {t('settings.about_description')}
        </AppText>
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
});
