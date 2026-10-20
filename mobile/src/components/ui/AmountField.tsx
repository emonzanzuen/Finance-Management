import { useState } from 'react';
import { StyleSheet, TextInput, View, type ViewStyle } from 'react-native';
import { usePreferences } from '@/context/PreferencesContext';
import { useCurrencies } from '@/hooks/useCurrencies';
import { useTranslation } from '@/i18n/useTranslation';
import { useTheme } from '@/theme/useTheme';
import {
  formatCurrency,
  formatIdrThousandInput,
  parseIdrThousandInput,
} from '@/utils/format';
import { AppText } from './AppText';

type Props = {
  label?: string;
  value: number;
  onChangeValue: (nextAmount: number) => void;
  placeholder?: string;
  error?: string;
  rates?: Record<string, number>;
  disabled?: boolean;
  containerStyle?: ViewStyle;
};

/**
 * IDR integer input field with automatic dot thousand separators and numeric keyboard (BR-01, BR-02).
 */
export function AmountField({
  label,
  value,
  onChangeValue,
  placeholder = '0',
  error,
  rates,
  disabled = false,
  containerStyle,
}: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { currency, language } = usePreferences();
  const { rates: activeRates } = useCurrencies();
  const [focused, setFocused] = useState(false);

  const effectiveRates = rates ?? activeRates;
  const displayText = value > 0 ? formatIdrThousandInput(value) : '';
  const borderColor = error
    ? theme.colors.danger
    : focused
      ? theme.colors.primary
      : theme.colors.border;

  const showPreview = currency !== 'IDR' && value > 0 && effectiveRates?.[currency];

  return (
    <View style={[{ gap: theme.spacing.xs }, containerStyle]}>
      <AppText variant="bodyStrong">{label ?? t('transactions.amount')}</AppText>
      <View
        style={[
          styles.wrapper,
          {
            minHeight: theme.sizes.touchTarget,
            borderRadius: theme.radius.control,
            borderColor,
            backgroundColor: disabled ? theme.colors.surfaceAlt : theme.colors.surface,
            paddingHorizontal: theme.spacing.md,
            gap: theme.spacing.sm,
          },
        ]}
      >
        <AppText variant="bodyStrong" muted>
          Rp
        </AppText>
        <TextInput
          value={displayText}
          editable={!disabled}
          keyboardType="numeric"
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChangeText={(raw) => {
            const parsed = parseIdrThousandInput(raw);
            onChangeValue(parsed);
          }}
          style={[
            theme.typography.bodyStrong,
            styles.input,
            {
              color: disabled ? theme.colors.textMuted : theme.colors.text,
              paddingVertical: theme.spacing.sm,
            },
          ]}
        />
      </View>
      {error ? (
        <AppText variant="caption" color={theme.colors.danger}>
          {error}
        </AppText>
      ) : showPreview ? (
        <AppText variant="caption" muted>
          ≈ {formatCurrency(value, currency, effectiveRates, language)}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  input: {
    flex: 1,
  },
});
