import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from '@/i18n/useTranslation';
import { useTheme } from '@/theme/useTheme';
import { AppText } from './AppText';
import { BottomSheet } from './BottomSheet';

type Props = {
  month: number; // 1-12
  year: number;
  onChange: (month: number, year: number) => void;
  hideMonth?: boolean;
};

export function MonthYearPicker({ month, year, onChange, hideMonth = false }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(year);

  const monthLabel = t(`common.months_full.${month - 1}`);
  const displayLabel = hideMonth ? `${year}` : `${monthLabel} ${year}`;

  const handlePrev = () => {
    if (hideMonth) {
      onChange(month, year - 1);
      return;
    }
    if (month === 1) {
      onChange(12, year - 1);
    } else {
      onChange(month - 1, year);
    }
  };

  const handleNext = () => {
    if (hideMonth) {
      onChange(month, year + 1);
      return;
    }
    if (month === 12) {
      onChange(1, year + 1);
    } else {
      onChange(month + 1, year);
    }
  };

  const openPicker = () => {
    setPickerYear(year);
    setSheetOpen(true);
  };

  return (
    <>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.control,
            paddingHorizontal: theme.spacing.xs,
            minHeight: theme.sizes.touchTarget,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          onPress={handlePrev}
          style={[styles.navBtn, { minWidth: theme.sizes.touchTarget, minHeight: theme.sizes.touchTarget }]}
        >
          <Feather name="chevron-left" size={20} color={theme.colors.text} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={openPicker}
          style={[
            styles.centerBtn,
            {
              minHeight: theme.sizes.touchTarget,
              gap: theme.spacing.xs,
              paddingHorizontal: theme.spacing.sm,
            },
          ]}
        >
          <Feather name="calendar" size={16} color={theme.colors.primary} />
          <AppText variant="bodyStrong">{displayLabel}</AppText>
          <Feather name="chevron-down" size={16} color={theme.colors.textMuted} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={handleNext}
          style={[styles.navBtn, { minWidth: theme.sizes.touchTarget, minHeight: theme.sizes.touchTarget }]}
        >
          <Feather name="chevron-right" size={20} color={theme.colors.text} />
        </Pressable>
      </View>

      <BottomSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={t('common.select_period')}
      >
        <View style={{ gap: theme.spacing.md }}>
          <View
            style={[
              styles.yearRow,
              {
                backgroundColor: theme.colors.surfaceAlt,
                borderRadius: theme.radius.control,
                paddingHorizontal: theme.spacing.sm,
              },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              onPress={() => setPickerYear((y) => y - 1)}
              style={[styles.navBtn, { minWidth: theme.sizes.touchTarget, minHeight: theme.sizes.touchTarget }]}
            >
              <Feather name="chevron-left" size={20} color={theme.colors.text} />
            </Pressable>
            <AppText variant="subtitle">{pickerYear}</AppText>
            <Pressable
              accessibilityRole="button"
              onPress={() => setPickerYear((y) => y + 1)}
              style={[styles.navBtn, { minWidth: theme.sizes.touchTarget, minHeight: theme.sizes.touchTarget }]}
            >
              <Feather name="chevron-right" size={20} color={theme.colors.text} />
            </Pressable>
          </View>

          <View style={[styles.monthGrid, { gap: theme.spacing.sm }]}>
            {Array.from({ length: 12 }).map((_, idx) => {
              const m = idx + 1;
              const selected = m === month && pickerYear === year;
              return (
                <Pressable
                  key={m}
                  accessibilityRole="button"
                  onPress={() => {
                    onChange(m, pickerYear);
                    setSheetOpen(false);
                  }}
                  style={[
                    styles.monthCell,
                    {
                      minHeight: theme.sizes.touchTarget,
                      borderRadius: theme.radius.control,
                      borderWidth: 1,
                      borderColor: selected ? theme.colors.primary : theme.colors.border,
                      backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
                    },
                  ]}
                >
                  <AppText
                    variant="bodyStrong"
                    color={selected ? theme.colors.onPrimary : theme.colors.text}
                  >
                    {t(`common.months.${idx}`)}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  navBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthCell: {
    width: '30.5%',
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
