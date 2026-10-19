import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { usePreferences } from '@/context/PreferencesContext';
import { useTheme } from '@/theme/useTheme';
import {
  formatDateDisplay,
  formatLocalDateToYmd,
  getMaxWibDateForPicker,
  parseDateStringToLocal,
} from '@/utils/format';
import { AppText } from './AppText';

type Props = {
  label?: string;
  value: string; // YYYY-MM-DD
  onChange: (nextDateYmd: string) => void;
  maximumDate?: Date;
  minimumDate?: Date;
  placeholder?: string;
  error?: string;
  allowClear?: boolean;
  containerStyle?: ViewStyle;
};

export function DatePickerField({
  label,
  value,
  onChange,
  maximumDate,
  minimumDate,
  placeholder,
  error,
  allowClear = false,
  containerStyle,
}: Props) {
  const theme = useTheme();
  const { language } = usePreferences();
  const [open, setOpen] = useState(false);

  const pickerDate = value ? parseDateStringToLocal(value) : new Date();
  const maxDate = maximumDate ?? getMaxWibDateForPicker();

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setOpen(false);
    }
    if (event.type === 'set' && selectedDate) {
      onChange(formatLocalDateToYmd(selectedDate));
    }
  };

  return (
    <View style={[{ gap: theme.spacing.xs }, containerStyle]}>
      {label ? <AppText variant="bodyStrong">{label}</AppText> : null}
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={[
          styles.trigger,
          {
            minHeight: theme.sizes.touchTarget,
            borderRadius: theme.radius.control,
            borderColor: error ? theme.colors.danger : theme.colors.border,
            backgroundColor: theme.colors.surface,
            paddingHorizontal: theme.spacing.md,
            gap: theme.spacing.sm,
          },
        ]}
      >
        <Feather name="calendar" size={18} color={theme.colors.textMuted} />
        <AppText
          style={styles.valueText}
          color={value ? theme.colors.text : theme.colors.textMuted}
        >
          {value ? formatDateDisplay(value, language) : (placeholder ?? '-')}
        </AppText>
        {allowClear && value ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={12}
            onPress={(e) => {
              e.stopPropagation();
              onChange('');
            }}
          >
            <Feather name="x" size={18} color={theme.colors.textMuted} />
          </Pressable>
        ) : null}
      </Pressable>
      {error ? (
        <AppText variant="caption" color={theme.colors.danger}>
          {error}
        </AppText>
      ) : null}
      {open ? (
        <DateTimePicker
          value={pickerDate}
          mode="date"
          display="default"
          maximumDate={maxDate}
          minimumDate={minimumDate}
          onChange={handleChange}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  valueText: {
    flex: 1,
  },
});
