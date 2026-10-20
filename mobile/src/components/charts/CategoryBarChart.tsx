import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Feather } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { useCurrencies } from '@/hooks/useCurrencies';
import { useTranslation } from '@/i18n/useTranslation';
import { useTheme } from '@/theme/useTheme';
import type { CategoryAggregateItem } from '@/types/api';

type Props = {
  items: CategoryAggregateItem[];
  emptyMessage?: string;
};

export function CategoryBarChart({ items, emptyMessage }: Props) {
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
        <Feather name="bar-chart-2" size={28} color={theme.colors.textMuted} />
        <AppText variant="caption" muted style={styles.centerText}>
          {emptyMessage ?? t('dashboard.no_chart_data')}
        </AppText>
      </View>
    );
  }

  const safeIndex = selectedIndex < sortedItems.length ? selectedIndex : 0;
  const activeItem = sortedItems[safeIndex] ?? sortedItems[0];
  const chartWidth = Math.max(220, windowWidth - theme.spacing.lg * 4 - 40);

  const barData = sortedItems.map((item, idx) => ({
    value: item.amount,
    label: item.name.length > 8 ? `${item.name.slice(0, 7)}…` : item.name,
    frontColor: item.color || theme.colors.income,
    onPress: () => setSelectedIndex(idx),
    labelTextStyle: {
      color: theme.colors.textMuted,
      fontSize: 11,
    },
  }));

  return (
    <View style={{ gap: theme.spacing.lg }}>
      <View style={styles.chartContainer}>
        <BarChart
          data={barData}
          width={chartWidth}
          height={170}
          barWidth={28}
          spacing={20}
          barBorderRadius={6}
          noOfSections={4}
          yAxisThickness={0}
          xAxisThickness={1}
          xAxisColor={theme.colors.border}
          rulesColor={theme.colors.border}
          hideYAxisText
          isAnimated
        />
      </View>

      {activeItem ? (
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
          <View style={[styles.row, { gap: theme.spacing.sm }]}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: activeItem.color || theme.colors.income,
                  borderRadius: theme.radius.full,
                },
              ]}
            />
            <AppText variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
              {activeItem.name}
            </AppText>
            <AppText variant="bodyStrong" color={theme.colors.income}>
              {formatAmount(activeItem.amount)} ({activeItem.percentage.toFixed(1)}%)
            </AppText>
          </View>
        </View>
      ) : null}

      <View style={{ gap: theme.spacing.xs }}>
        {sortedItems.map((item, idx) => (
          <Pressable
            key={item.categoryId}
            accessibilityRole="button"
            onPress={() => setSelectedIndex(idx)}
            style={[
              styles.row,
              {
                borderRadius: theme.radius.control,
                paddingHorizontal: theme.spacing.sm,
                paddingVertical: theme.spacing.xs,
                backgroundColor: idx === safeIndex ? theme.colors.surfaceAlt : 'transparent',
                gap: theme.spacing.sm,
              },
            ]}
          >
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: item.color || theme.colors.income,
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
          </Pressable>
        ))}
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
  chartContainer: {
    overflow: 'hidden',
  },
  selectedBanner: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
  },
});
