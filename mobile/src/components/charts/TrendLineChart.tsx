import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Feather } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { useCurrencies } from '@/hooks/useCurrencies';
import { useTranslation } from '@/i18n/useTranslation';
import { useTheme } from '@/theme/useTheme';

export type TrendPoint = {
  month: number; // 1-12
  year?: number;
  income: number;
  expense: number;
};

type Props = {
  points: TrendPoint[];
  emptyMessage?: string;
};

export function TrendLineChart({ points, emptyMessage }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { formatAmount } = useCurrencies();
  const { width: windowWidth } = useWindowDimensions();

  const nonZeroMonthsCount = useMemo(
    () => points.filter((p) => p.income > 0 || p.expense > 0).length,
    [points],
  );

  const defaultSelectedIdx = useMemo(() => {
    for (let i = points.length - 1; i >= 0; i -= 1) {
      if (points[i].income > 0 || points[i].expense > 0) return i;
    }
    return Math.max(0, points.length - 1);
  }, [points]);

  const [selectedIndex, setSelectedIndex] = useState<number>(defaultSelectedIdx);

  // M2-mobile.md 2.2: Line Chart requires at least 2 months containing data
  if (points.length === 0 || nonZeroMonthsCount < 2) {
    const singleMonth = points.find((p) => p.income > 0 || p.expense > 0);
    return (
      <View
        style={[
          styles.emptyBox,
          {
            paddingVertical: theme.spacing.lg,
            gap: theme.spacing.sm,
          },
        ]}
      >
        <Feather name="trending-up" size={28} color={theme.colors.textMuted} />
        <AppText variant="caption" muted style={styles.centerText}>
          {emptyMessage ?? t('dashboard.insufficient_trend_data')}
        </AppText>
        {singleMonth ? (
          <View
            style={[
              styles.singleSummaryBox,
              {
                backgroundColor: theme.colors.surfaceAlt,
                borderRadius: theme.radius.control,
                padding: theme.spacing.md,
                gap: theme.spacing.xs,
                marginTop: theme.spacing.xs,
              },
            ]}
          >
            <AppText variant="bodyStrong">
              {t(`common.months_full.${singleMonth.month - 1}`)}{' '}
              {singleMonth.year ? singleMonth.year : ''}
            </AppText>
            <View style={styles.summaryRow}>
              <AppText variant="caption" muted>
                {t('dashboard.income')}:
              </AppText>
              <AppText variant="bodyStrong" color={theme.colors.income}>
                {formatAmount(singleMonth.income)}
              </AppText>
            </View>
            <View style={styles.summaryRow}>
              <AppText variant="caption" muted>
                {t('dashboard.expense')}:
              </AppText>
              <AppText variant="bodyStrong" color={theme.colors.expense}>
                {formatAmount(singleMonth.expense)}
              </AppText>
            </View>
          </View>
        ) : null}
      </View>
    );
  }

  const safeIdx = selectedIndex < points.length ? selectedIndex : defaultSelectedIdx;
  const activePoint = points[safeIdx] ?? points[points.length - 1];
  const chartWidth = Math.max(220, windowWidth - theme.spacing.lg * 4 - 36);
  const spacing = Math.max(34, Math.floor(chartWidth / Math.max(points.length, 2)));

  const incomeData = points.map((pt, idx) => ({
    value: pt.income,
    label: t(`common.months.${pt.month - 1}`),
    onPress: () => setSelectedIndex(idx),
    labelTextStyle: {
      color: theme.colors.textMuted,
      fontSize: 11,
    },
  }));

  const expenseData = points.map((pt, idx) => ({
    value: pt.expense,
    onPress: () => setSelectedIndex(idx),
  }));

  return (
    <View style={{ gap: theme.spacing.md }}>
      <View style={styles.chartContainer}>
        <LineChart
          data={incomeData}
          data2={expenseData}
          width={chartWidth}
          height={175}
          spacing={spacing}
          initialSpacing={14}
          color1={theme.colors.income}
          color2={theme.colors.expense}
          dataPointsColor1={theme.colors.income}
          dataPointsColor2={theme.colors.expense}
          dataPointsRadius={5}
          thickness={2.5}
          noOfSections={4}
          yAxisThickness={0}
          xAxisThickness={1}
          xAxisColor={theme.colors.border}
          rulesColor={theme.colors.border}
          hideYAxisText
          curved
        />
      </View>

      {/* Legend below chart (M2-mobile.md 2.2) */}
      <View style={[styles.legendBar, { gap: theme.spacing.lg }]}>
        <View style={[styles.legendItem, { gap: theme.spacing.xs }]}>
          <View
            style={[
              styles.dot,
              { backgroundColor: theme.colors.income, borderRadius: theme.radius.full },
            ]}
          />
          <AppText variant="caption">{t('dashboard.income')}</AppText>
        </View>
        <View style={[styles.legendItem, { gap: theme.spacing.xs }]}>
          <View
            style={[
              styles.dot,
              { backgroundColor: theme.colors.expense, borderRadius: theme.radius.full },
            ]}
          />
          <AppText variant="caption">{t('dashboard.expense')}</AppText>
        </View>
      </View>

      {/* Tap selector pills for months so user can easily inspect any month's values */}
      <View style={[styles.monthSelectorRow, { gap: theme.spacing.xs }]}>
        {points.map((pt, idx) => {
          const active = idx === safeIdx;
          return (
            <Pressable
              key={`${pt.year ?? ''}-${pt.month}`}
              accessibilityRole="button"
              onPress={() => setSelectedIndex(idx)}
              style={[
                styles.monthChip,
                {
                  borderRadius: theme.radius.full,
                  paddingHorizontal: theme.spacing.sm,
                  paddingVertical: theme.spacing.xs,
                  backgroundColor: active ? theme.colors.primary : theme.colors.surfaceAlt,
                },
              ]}
            >
              <AppText
                variant="caption"
                color={active ? theme.colors.onPrimary : theme.colors.textMuted}
              >
                {t(`common.months.${pt.month - 1}`)}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {activePoint ? (
        <View
          style={[
            styles.selectedDetail,
            {
              backgroundColor: theme.colors.surfaceAlt,
              borderRadius: theme.radius.control,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.sm,
              gap: theme.spacing.xs,
            },
          ]}
        >
          <AppText variant="bodyStrong">
            {t(`common.months_full.${activePoint.month - 1}`)}{' '}
            {activePoint.year ? activePoint.year : ''}
          </AppText>
          <View style={styles.summaryRow}>
            <AppText variant="caption" muted>
              {t('dashboard.income')}
            </AppText>
            <AppText variant="bodyStrong" color={theme.colors.income}>
              {formatAmount(activePoint.income)}
            </AppText>
          </View>
          <View style={styles.summaryRow}>
            <AppText variant="caption" muted>
              {t('dashboard.expense')}
            </AppText>
            <AppText variant="bodyStrong" color={theme.colors.expense}>
              {formatAmount(activePoint.expense)}
            </AppText>
          </View>
        </View>
      ) : null}
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
  singleSummaryBox: {
    width: '100%',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chartContainer: {
    overflow: 'hidden',
  },
  legendBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
  },
  monthSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  monthChip: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDetail: {
    width: '100%',
  },
});
