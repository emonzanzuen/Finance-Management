import { useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { CategoryBarChart } from '@/components/charts/CategoryBarChart';
import { CategoryPieChart } from '@/components/charts/CategoryPieChart';
import { TrendLineChart } from '@/components/charts/TrendLineChart';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { MonthYearPicker } from '@/components/ui/MonthYearPicker';
import { Screen } from '@/components/ui/Screen';
import { SkeletonList } from '@/components/ui/Skeleton';
import { usePreferences } from '@/context/PreferencesContext';
import { useCurrencies } from '@/hooks/useCurrencies';
import { useMonthlyReport, useYearlyTrend } from '@/hooks/useReports';
import { useTransactionsInfinite } from '@/hooks/useTransactions';
import { useTranslation } from '@/i18n/useTranslation';
import { useTheme } from '@/theme/useTheme';
import {
  formatDateDisplay,
  getCurrentWibMonthYear,
  getMonthDateRange,
} from '@/utils/format';

export default function ReportsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { language } = usePreferences();
  const { formatAmount } = useCurrencies();

  const initialPeriod = getCurrentWibMonthYear();
  const [month, setMonth] = useState(initialPeriod.month);
  const [year, setYear] = useState(initialPeriod.year);

  const dateRange = useMemo(() => getMonthDateRange(month, year), [month, year]);

  const monthlyQuery = useMonthlyReport(month, year);
  const trendQuery = useYearlyTrend(year);
  const txQuery = useTransactionsInfinite({
    dateFrom: dateRange.dateFrom,
    dateTo: dateRange.dateTo,
    sortBy: 'transactionDate',
    sortOrder: 'desc',
  });

  const transactions = useMemo(
    () => txQuery.data?.pages.flatMap((p) => p.data) ?? [],
    [txQuery.data],
  );

  const isLoading = monthlyQuery.isLoading || trendQuery.isLoading || txQuery.isLoading;
  const isError = monthlyQuery.isError || trendQuery.isError;
  const isRefreshing =
    (monthlyQuery.isRefetching || trendQuery.isRefetching || txQuery.isRefetching) && !isLoading;

  const handleRefresh = () => {
    void monthlyQuery.refetch();
    void trendQuery.refetch();
    void txQuery.refetch();
  };

  const report = monthlyQuery.data;
  const trend = trendQuery.data;

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing.lg,
          paddingBottom: theme.spacing.xxl * 2,
          gap: theme.spacing.md,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.headerRow, { gap: theme.spacing.sm }]}>
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
            <AppText variant="title">{t('reports.title')}</AppText>
            <AppText variant="caption" muted>
              {t('reports.subtitle')}
            </AppText>
          </View>
        </View>

        {/* Month & Year Filter (REP-01) */}
        <MonthYearPicker
          month={month}
          year={year}
          onChange={(nextMonth, nextYear) => {
            setMonth(nextMonth);
            setYear(nextYear);
          }}
        />

        {isLoading ? (
          <SkeletonList count={4} itemHeight={120} />
        ) : isError ? (
          <Card>
            <ErrorState
              message={(monthlyQuery.error ?? trendQuery.error)?.message}
              onRetry={handleRefresh}
            />
          </Card>
        ) : report ? (
          <>
            {/* Summary Card: Income, Expense, Net Difference (REP-02) */}
            <Card>
              <View style={[styles.summaryGrid, { gap: theme.spacing.sm }]}>
                <View style={styles.summaryCol}>
                  <AppText variant="caption" muted>
                    {t('reports.income')}
                  </AppText>
                  <AppText variant="bodyStrong" color={theme.colors.income}>
                    {formatAmount(report.income)}
                  </AppText>
                </View>
                <View style={styles.summaryCol}>
                  <AppText variant="caption" muted>
                    {t('reports.expense')}
                  </AppText>
                  <AppText variant="bodyStrong" color={theme.colors.expense}>
                    {formatAmount(report.expense)}
                  </AppText>
                </View>
                <View style={styles.summaryCol}>
                  <AppText variant="caption" muted>
                    {t('reports.difference')}
                  </AppText>
                  <AppText
                    variant="bodyStrong"
                    color={
                      report.difference < 0 ? theme.colors.danger : theme.colors.income
                    }
                  >
                    {formatAmount(report.difference)}
                  </AppText>
                </View>
              </View>
            </Card>

            {/* Pie Chart Expense by Category (REP-03) */}
            <Card>
              <AppText variant="subtitle">{t('reports.expense_by_category')}</AppText>
              <CategoryPieChart
                items={report.expenseByCategory}
                emptyMessage={t('reports.no_expense_data')}
              />
            </Card>

            {/* Bar Chart Income by Category (REP-04) */}
            <Card>
              <AppText variant="subtitle">{t('reports.income_by_category')}</AppText>
              <CategoryBarChart
                items={report.incomeByCategory}
                emptyMessage={t('reports.no_income_data')}
              />
            </Card>

            {/* Line Chart 12-Month Trend (REP-05) */}
            <Card>
              <AppText variant="subtitle">
                {t('reports.monthly_trend', { year })}
              </AppText>
              <TrendLineChart
                points={(trend?.months ?? []).map((m) => ({
                  month: m.month,
                  year,
                  income: m.income,
                  expense: m.expense,
                }))}
              />
            </Card>

            {/* Transactions of Selected Month (REP-06) */}
            <Card>
              <AppText variant="subtitle">{t('reports.transaction_details')}</AppText>
              {transactions.length === 0 ? (
                <EmptyState icon="list" title={t('reports.no_data')} />
              ) : (
                <View style={{ gap: theme.spacing.sm }}>
                  {transactions.map((tx) => {
                    const isExpense = tx.type === 'expense';
                    const amountColor = isExpense ? theme.colors.expense : theme.colors.income;
                    const sign = isExpense ? '-' : '+';
                    return (
                      <Pressable
                        key={tx.id}
                        accessibilityRole="button"
                        onPress={() =>
                          router.push({ pathname: '/transaction/form', params: { id: tx.id } })
                        }
                        style={[
                          styles.txRow,
                          {
                            borderRadius: theme.radius.control,
                            backgroundColor: theme.colors.surfaceAlt,
                            padding: theme.spacing.md,
                            gap: theme.spacing.sm,
                          },
                        ]}
                      >
                        <View style={{ flex: 1, gap: theme.spacing.xs }}>
                          <CategoryChip name={tx.category.name} color={tx.category.color} />
                          {tx.description ? (
                            <AppText variant="body" numberOfLines={1}>
                              {tx.description}
                            </AppText>
                          ) : null}
                          <AppText variant="caption" muted>
                            {formatDateDisplay(tx.transactionDate, language)}
                          </AppText>
                        </View>
                        <AppText variant="bodyStrong" color={amountColor}>
                          {sign} {formatAmount(tx.amount)}
                        </AppText>
                      </Pressable>
                    );
                  })}

                  {txQuery.hasNextPage ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => void txQuery.fetchNextPage()}
                      style={{
                        alignItems: 'center',
                        paddingVertical: theme.spacing.sm,
                      }}
                    >
                      <AppText variant="bodyStrong" color={theme.colors.primary}>
                        {txQuery.isFetchingNextPage
                          ? t('transactions.loading_more')
                          : t('dashboard.view_all')}
                      </AppText>
                    </Pressable>
                  ) : null}
                </View>
              )}
            </Card>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCol: {
    flex: 1,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
