import { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { usePreferences } from '@/context/PreferencesContext';
import { useTranslation } from '@/i18n/useTranslation';
import { useTheme } from '@/theme/useTheme';
import {
  formatDateDisplay,
  formatLocalDateToYmd,
  getMaxWibDateForPicker,
  getTodayWibString,
  parseDateStringToLocal,
} from '@/utils/format';
import { AppText } from './AppText';

type Props = {
  label?: string;
  value: string; // YYYY-MM-DD
  onChange: (nextDateYmd: string) => void;
  maximumDate?: Date;
  minimumDate?: Date;
  disableMaxDate?: boolean;
  placeholder?: string;
  error?: string;
  allowClear?: boolean;
  containerStyle?: ViewStyle;
};

const WEEKDAYS_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function DatePickerField({
  label,
  value,
  onChange,
  maximumDate,
  minimumDate,
  disableMaxDate = false,
  placeholder,
  error,
  allowClear = false,
  containerStyle,
}: Props) {
  const theme = useTheme();
  const { language } = usePreferences();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const normalizedValue = value ? value.slice(0, 10) : '';
  const pickerDate = normalizedValue ? parseDateStringToLocal(normalizedValue) : new Date();
  const maxDate = disableMaxDate ? maximumDate : (maximumDate ?? getMaxWibDateForPicker());

  const [viewYear, setViewYear] = useState<number>(() => pickerDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(() => pickerDate.getMonth()); // 0..11

  const maxYmd = maxDate ? formatLocalDateToYmd(maxDate) : null;
  const minYmd = minimumDate ? formatLocalDateToYmd(minimumDate) : null;
  const todayYmd = getTodayWibString();

  const handleOpen = () => {
    const base = normalizedValue ? parseDateStringToLocal(normalizedValue) : new Date();
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    setOpen(true);
  };

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setOpen(false);
    }
    if (event.type === 'set' && selectedDate) {
      onChange(formatLocalDateToYmd(selectedDate));
    }
  };

  const calendarCells = useMemo(() => {
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: { day: number | null; ymd: string | null; disabled: boolean }[] = [];

    for (let i = 0; i < firstDayOfWeek; i += 1) {
      cells.push({ day: null, ymd: null, disabled: true });
    }

    for (let d = 1; d <= daysInMonth; d += 1) {
      const mStr = String(viewMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const ymd = `${viewYear}-${mStr}-${dStr}`;
      const isAfterMax = Boolean(maxYmd && ymd > maxYmd);
      const isBeforeMin = Boolean(minYmd && ymd < minYmd);
      cells.push({
        day: d,
        ymd,
        disabled: isAfterMax || isBeforeMin,
      });
    }

    return cells;
  }, [viewYear, viewMonth, maxYmd, minYmd]);

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const shiftYear = (delta: number) => {
    setViewYear((prev) => prev + delta);
  };

  const weekdays = language === 'en' ? WEEKDAYS_EN : WEEKDAYS_ID;
  const isTodayAllowed =
    (!maxYmd || todayYmd <= maxYmd) && (!minYmd || todayYmd >= minYmd);

  return (
    <View style={[{ gap: theme.spacing.xs }, containerStyle]}>
      {label ? <AppText variant="bodyStrong">{label}</AppText> : null}
      <Pressable
        accessibilityRole="button"
        onPress={handleOpen}
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
          color={normalizedValue ? theme.colors.text : theme.colors.textMuted}
        >
          {normalizedValue ? formatDateDisplay(normalizedValue, language) : (placeholder ?? '-')}
        </AppText>
        {allowClear && normalizedValue ? (
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

      {open && Platform.OS !== 'web' ? (
        <DateTimePicker
          value={pickerDate}
          mode="date"
          display="default"
          maximumDate={maxDate}
          minimumDate={minimumDate}
          onChange={handleChange}
        />
      ) : null}

      {open && Platform.OS === 'web' ? (
        <Modal
          visible={open}
          transparent
          animationType="fade"
          onRequestClose={() => setOpen(false)}
        >
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={[
                styles.webDialog,
                {
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.radius.card,
                  borderColor: theme.colors.border,
                  padding: theme.spacing.lg,
                  gap: theme.spacing.md,
                },
              ]}
            >
              {label ? <AppText variant="subtitle">{label}</AppText> : null}

              {/* Month & Year Navigation */}
              <View style={styles.navHeader}>
                <View style={styles.navGroup}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => shiftYear(-1)}
                    style={[
                      styles.navBtn,
                      {
                        borderRadius: theme.radius.control,
                        backgroundColor: theme.colors.surfaceAlt,
                      },
                    ]}
                  >
                    <Feather name="chevrons-left" size={16} color={theme.colors.text} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => shiftMonth(-1)}
                    style={[
                      styles.navBtn,
                      {
                        borderRadius: theme.radius.control,
                        backgroundColor: theme.colors.surfaceAlt,
                      },
                    ]}
                  >
                    <Feather name="chevron-left" size={16} color={theme.colors.text} />
                  </Pressable>
                </View>

                <AppText variant="bodyStrong">
                  {t(`common.months_full.${viewMonth}`)} {viewYear}
                </AppText>

                <View style={styles.navGroup}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => shiftMonth(1)}
                    style={[
                      styles.navBtn,
                      {
                        borderRadius: theme.radius.control,
                        backgroundColor: theme.colors.surfaceAlt,
                      },
                    ]}
                  >
                    <Feather name="chevron-right" size={16} color={theme.colors.text} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => shiftYear(1)}
                    style={[
                      styles.navBtn,
                      {
                        borderRadius: theme.radius.control,
                        backgroundColor: theme.colors.surfaceAlt,
                      },
                    ]}
                  >
                    <Feather name="chevrons-right" size={16} color={theme.colors.text} />
                  </Pressable>
                </View>
              </View>

              {/* Weekday Headers */}
              <View style={styles.weekRow}>
                {weekdays.map((dayName) => (
                  <View key={dayName} style={styles.dayCell}>
                    <AppText variant="caption" muted>
                      {dayName}
                    </AppText>
                  </View>
                ))}
              </View>

              {/* Calendar Grid */}
              <View style={styles.grid}>
                {calendarCells.map((cell, index) => {
                  if (!cell.day || !cell.ymd) {
                    return <View key={`empty-${index}`} style={styles.dayCell} />;
                  }
                  const isSelected = cell.ymd === normalizedValue;
                  const isToday = cell.ymd === todayYmd;

                  return (
                    <Pressable
                      key={cell.ymd}
                      accessibilityRole="button"
                      disabled={cell.disabled}
                      onPress={() => {
                        if (cell.ymd) {
                          onChange(cell.ymd);
                          setOpen(false);
                        }
                      }}
                      style={[
                        styles.dayCell,
                        styles.dayButton,
                        {
                          borderRadius: theme.radius.control,
                          backgroundColor: isSelected
                            ? theme.colors.primary
                            : isToday
                              ? `${theme.colors.primary}18`
                              : 'transparent',
                          opacity: cell.disabled ? 0.35 : 1,
                        },
                      ]}
                    >
                      <AppText
                        variant={isSelected || isToday ? 'bodyStrong' : 'body'}
                        color={
                          isSelected
                            ? theme.colors.onPrimary
                            : isToday
                              ? theme.colors.primary
                              : theme.colors.text
                        }
                      >
                        {cell.day}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>

              {/* Footer Actions */}
              <View style={styles.footerRow}>
                {isTodayAllowed ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      onChange(todayYmd);
                      setOpen(false);
                    }}
                    style={{
                      paddingVertical: theme.spacing.xs,
                      paddingHorizontal: theme.spacing.sm,
                    }}
                  >
                    <AppText variant="bodyStrong" color={theme.colors.primary}>
                      {language === 'en' ? 'Today' : 'Hari Ini'}
                    </AppText>
                  </Pressable>
                ) : (
                  <View />
                )}

                <Pressable
                  accessibilityRole="button"
                  onPress={() => setOpen(false)}
                  style={{
                    paddingVertical: theme.spacing.xs,
                    paddingHorizontal: theme.spacing.sm,
                  }}
                >
                  <AppText variant="bodyStrong" muted>
                    {t('common.cancel')}
                  </AppText>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
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
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  webDialog: {
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButton: {
    marginVertical: 1,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
});

