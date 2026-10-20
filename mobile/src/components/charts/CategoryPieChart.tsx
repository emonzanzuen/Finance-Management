import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { Feather } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useCurrencies } from '@/hooks/useCurrencies';
import { useTranslation } from '@/i18n/useTranslation';
import { useTheme } from '@/theme/useTheme';
import type { CategoryAggregateItem } from '@/types/api';

type Props = {
  items: CategoryAggregateItem[];
  emptyMessage?: string;
};

export function CategoryPieChart({ items, emptyMessage }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { formatAmount } = useCurrencies();
  const { width: windowWidth } = useWindowDimensions();
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const sortedItems = useMemo(
    () => [...items].filter((i) => i.amount > 0).sort((a, b) => b.amount - a.amount),
    [items],
  );

  const totalAmount = useMemo(
    () => sortedItems.reduce((sum, item) => sum + item.amount, 0),
    [sortedItems],
  );

  // Group into top 5 + "Others" if > 6 categories (M2-mobile.md 2.2)
  const displaySlices = useMemo<CategoryAggregateItem[]>(() => {
    if (sortedItems.length <= 6) return sortedItems;
    const topFive = sortedItems.slice(0, 5);
    const rest = sortedItems.slice(5);
    const restAmount = rest.reduce((sum, item) => sum + item.amount, 0);
    const restPercent = totalAmount > 0 ? Number(((restAmount / totalAmount) * 100).toFixed(1)) : 0;
    return [
      ...topFive,
      {
        categoryId: '__others__',
        name: t('common.others'),
        color: theme.colors.textMuted,
        amount: restAmount,
        percentage: restPercent,
      },
    ];
  }, [sortedItems, totalAmount, t, theme.colors.textMuted]);

  if (sortedItems.length === 0 || totalAmount <= 0) {
    return (
      <View
        style={[
          styles.emptyBox,
          {
            paddingVertical: theme.spacing.xl,
            gap: theme.spacing.sm,
          },
        ]}
      >
        <Feather name="pie-chart" size={28} color={theme.colors.textMuted} />
        <AppText variant="caption" muted style={styles.centerText}>
          {emptyMessage ?? t('dashboard.no_chart_data')}
        </AppText>
      </View>
    );
  }

  const safeIndex = selectedIndex < displaySlices.length ? selectedIndex : 0;
  const activeSlice = displaySlices[safeIndex] ?? displaySlices[0];
  const radius = Math.min(92, Math.max(72, Math.floor((windowWidth - 140) / 2.6)));
  const innerRadius = Math.floor(radius * 0.62);

  const pieData = displaySlices.map((item, idx) => ({
    value: item.amount,
    color: item.color || theme.colors.primary,
    focused: idx === safeIndex,
    onPress: () => setSelectedIndex(idx),
  }));

  return (
    <View style={{ gap: theme.spacing.lg }}>
      <View style={styles.chartWrapper}>
        <PieChart
          data={pieData}
          donut
          radius={radius}
          innerRadius={innerRadius}
          innerCircleColor={theme.colors.surface}
          focusOnPress
          sectionAutoFocus
          centerLabelComponent={() => (
            <View style={styles.centerLabel}>
              <AppText variant="caption" muted numberOfLines={1}>
                {activeSlice?.name}
              </AppText>
              <AppText variant="bodyStrong">
                { `${Math.round(activeSlice?.percentage ?? 0)}%` }
              </AppText>
            </View>
          )}
        />
      </View>

      {activeSlice ? (
        <View
          style={[
            styles.selectedBanner,
            {
              backgroundColor: theme.colors.surfaceAlt,
              borderRadius: theme.radius.control,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.sm,
            },
          ]}
        >
          <View style={[styles.legendRow, { gap: theme.spacing.sm }]}>
            <View
              style={[
                styles.colorDot,
                {
                  backgroundColor: activeSlice.color || theme.colors.primary,
                  borderRadius: theme.radius.full,
                },
              ]}
            />
            <AppText variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
              {activeSlice.name}
            </AppText>
            <AppText variant="bodyStrong">
              {formatAmount(activeSlice.amount)} ({activeSlice.percentage.toFixed(1)}%)
            </AppText>
          </View>
        </View>
      ) : null}

      <View style={{ gap: theme.spacing.sm }}>
        {sortedItems.map((item, idx) => {
          const isHighlighted =
            item.categoryId === activeSlice?.categoryId ||
            (activeSlice?.categoryId === '__others__' && idx >= 5);
          return (
            <Pressable
              key={item.categoryId}
              accessibilityRole="button"
              onPress={() => {
                const sliceIdx = idx < 5 || sortedItems.length <= 6 ? idx : 5;
                setSelectedIndex(sliceIdx);
              }}
              style={[
                styles.legendItem,
                {
                  borderRadius: theme.radius.control,
                  paddingHorizontal: theme.spacing.sm,
                  paddingVertical: theme.spacing.xs,
                  backgroundColor: isHighlighted ? theme.colors.surfaceAlt : 'transparent',
                  gap: theme.spacing.xs,
                },
              ]}
            >
              <View style={[styles.legendRow, { gap: theme.spacing.sm }]}>
                <View
                  style={[
                    styles.colorDot,
                    {
                      backgroundColor: item.color || theme.colors.primary,
                      borderRadius: theme.radius.full,
                    },
                  ]}
                />
                <AppText variant="body" style={{ flex: 1 }} numberOfLines={1}>
                  {item.name}
                </AppText>
                <AppText variant="caption" muted>
                  {item.percentage.toFixed(1)}%
                </AppText>
                <AppText variant="bodyStrong">{formatAmount(item.amount)}</AppText>
              </View>
              {sortedItems.length > 6 ? (
                <ProgressBar
                  percentage={item.percentage}
                  color={item.color || theme.colors.primary}
                  height={6}
                />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  selectedBanner: {
    width: '100%',
  },
  legendItem: {
    width: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 12,
    height: 12,
  },
});
