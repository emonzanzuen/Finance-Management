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
import { useToast } from '@/components/ui/Toast';
import { TransactionDetailSheet } from '@/components/ui/TransactionDetailSheet';
import { usePreferences } from '@/context/PreferencesContext';
import { useCurrencies } from '@/hooks/useCurrencies';
import { useExportReport, useMonthlyReport, useYearlyTrend } from '@/hooks/useReports';
import { useTransactionsInfinite } from '@/hooks/useTransactions';
import { useTranslation } from '@/i18n/useTranslation';
import { useTheme } from '@/theme/useTheme';
import { ApiError, type ReportExportFormat, type Transaction } from '@/types/api';
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
  const { showToast } = useToast();

  const initialPeriod = getCurrentWibMonthYear();
  const [month, setMonth] = useState(initialPeriod.month);
  const [year, setYear] = useState(initialPeriod.year);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const softBorderColor = theme.isDark ? theme.colors.border : `${theme.colors.border}B8`;
  const surfaceSubtle = theme.isDark ? theme.colors.surfaceAlt : `${theme.colors.surfaceAlt}90`;

  const dateRange = useMemo(() => getMonthDateRange(month, year), [month, year]);

  const monthlyQuery = useMonthlyReport(month, year);
  const trendQuery = useYearlyTrend(year);
  const exportMutation = useExportReport();
  const txQuery = useTransactionsInfinite({
    dateFrom: dateRange.dateFrom,
    dateTo: dateRange.dateTo,
    sortBy: 'transactionDate',
    sortOrder: 'desc',
  });

  const handleExport = async (format: ReportExportFormat) => {
    try {
      await exportMutation.mutateAsync({ format, month, year });
      showToast(t('reports.export_success', { format: format.toUpperCase() }), 'success');
    } catch (err) {
      if (err instanceof ApiError) {
        const key = `errors.${err.code}`;
        const translated = t(key);
        showToast(translated !== key ? translated : err.message, 'error');
      } else {
        showToast(t('errors.UNKNOWN'), 'error');
      }
    }
  };

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
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.md,
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
        <View style={[styles.headerRow, { gap: theme.spacing.md }]}>
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
            <AppText variant="title">{t('reports.title')}</AppText>
            <AppText variant="caption" muted numberOfLines={1}>
              {t('reports.subtitle')}
            </AppText>
          </View>
        </View>

        {/* Month & Year Filter + Export Actions Card (REP-01, EXP-01..05) */}
        <Card
          style={{
            padding: theme.spacing.md,
            gap: theme.spacing.sm + 2,
            borderRadius: theme.radius.card + 2,
            borderColor: softBorderColor,
          }}
        >
          <MonthYearPicker
            month={month}
            year={year}
            onChange={(nextMonth, nextYear) => {
              setMonth(nextMonth);
              setYear(nextYear);
            }}
          />

          <View
            style={{
              height: 1,
              backgroundColor: softBorderColor,
              opacity: 0.65,
            }}
          />

          <View style={[styles.exportRow, { gap: theme.spacing.sm }]}>
            <Pressable
              accessibilityRole="button"
              disabled={exportMutation.isPending}
              onPress={() => void handleExport('pdf')}
              style={({ pressed }) => [
                styles.exportBtn,
                {
                  flex: 1,
                  minHeight: 44,
                  paddingHorizontal: theme.spacing.md,
                  borderRadius: 12,
                  borderColor: `${theme.colors.danger}30`,
                  backgroundColor: `${theme.colors.danger}12`,
                  gap: 8,
                  opacity: exportMutation.isPending ? 0.6 : pressed ? 0.8 : 1,
                },
              ]}
            >
              <Feather name="file-text" size={16} color={theme.colors.danger} />
              <AppText
                variant="bodyStrong"
                color={theme.colors.danger}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {t('reports.export_pdf')}
              </AppText>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={exportMutation.isPending}
              onPress={() => void handleExport('xlsx')}
              style={({ pressed }) => [
                styles.exportBtn,
                {
                  flex: 1,
                  minHeight: 44,
                  paddingHorizontal: theme.spacing.md,
                  borderRadius: 12,
                  borderColor: `${theme.colors.income}30`,
                  backgroundColor: `${theme.colors.income}12`,
                  gap: 8,
                  opacity: exportMutation.isPending ? 0.6 : pressed ? 0.8 : 1,
                },
              ]}
            >
              <Feather name="download" size={16} color={theme.colors.income} />
              <AppText
                variant="bodyStrong"
                color={theme.colors.income}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {t('reports.export_excel')}
              </AppText>
            </Pressable>
          </View>
        </Card>

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
            {/* Summary Card: Income, Expense, Net Difference (REP-02) — 3 Equal Soft Metric Boxes */}
            <Card
              style={{
                padding: theme.spacing.lg,
                borderRadius: theme.radius.card + 2,
                borderColor: softBorderColor,
              }}
            >
              <View style={[styles.summaryGrid, { gap: theme.spacing.sm }]}>
                <View
                  style={[
                    styles.summaryCol,
                    {
                      backgroundColor: surfaceSubtle,
                      borderColor: softBorderColor,
                      borderRadius: 12,
                      padding: theme.spacing.sm + 2,
                      gap: 4,
                    },
                  ]}
                >
                  <AppText variant="caption" muted numberOfLines={1}>
                    {t('reports.income')}
                  </AppText>
                  <AppText
                    variant="bodyStrong"
                    color={theme.colors.income}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                  >
                    {formatAmount(report.income)}
                  </AppText>
                </View>

                <View
                  style={[
                    styles.summaryCol,
                    {
                      backgroundColor: surfaceSubtle,
                      borderColor: softBorderColor,
                      borderRadius: 12,
                      padding: theme.spacing.sm + 2,
                      gap: 4,
                    },
                  ]}
                >
                  <AppText variant="caption" muted numberOfLines={1}>
                    {t('reports.expense')}
                  </AppText>
                  <AppText
                    variant="bodyStrong"
                    color={theme.colors.expense}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                  >
                    {formatAmount(report.expense)}
                  </AppText>
                </View>

                <View
                  style={[
                    styles.summaryCol,
                    {
                      backgroundColor: surfaceSubtle,
                      borderColor: softBorderColor,
                      borderRadius: 12,
                      padding: theme.spacing.sm + 2,
                      gap: 4,
                    },
                  ]}
                >
                  <AppText variant="caption" muted numberOfLines={1}>
                    {t('reports.difference')}
                  </AppText>
                  <AppText
                    variant="bodyStrong"
                    color={report.difference < 0 ? theme.colors.danger : theme.colors.income}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                  >
                    {formatAmount(report.difference)}
                  </AppText>
                </View>
              </View>
            </Card>

            {/* Pie Chart Expense by Category (REP-03) */}
            <Card
              style={{
                padding: theme.spacing.lg,
                gap: theme.spacing.md,
                borderRadius: theme.radius.card + 2,
                borderColor: softBorderColor,
              }}
            >
              <View style={[styles.cardHeader, { gap: theme.spacing.sm }]}>
                <View
                  style={[
                    styles.chartIconBadge,
                    { backgroundColor: `${theme.colors.expense}14`, borderRadius: 10 },
                  ]}
                >
                  <Feather name="pie-chart" size={16} color={theme.colors.expense} />
                </View>
                <AppText variant="subtitle">{t('reports.expense_by_category')}</AppText>
              </View>
              <CategoryPieChart
                items={report.expenseByCategory}
                emptyMessage={t('reports.no_expense_data')}
              />
            </Card>

            {/* Bar Chart Income by Category (REP-04) */}
            <Card
              style={{
                padding: theme.spacing.lg,
                gap: theme.spacing.md,
                borderRadius: theme.radius.card + 2,
                borderColor: softBorderColor,
              }}
            >
              <View style={[styles.cardHeader, { gap: theme.spacing.sm }]}>
                <View
                  style={[
                    styles.chartIconBadge,
                    { backgroundColor: `${theme.colors.income}14`, borderRadius: 10 },
                  ]}
                >
                  <Feather name="bar-chart-2" size={16} color={theme.colors.income} />
                </View>
                <AppText variant="subtitle">{t('reports.income_by_category')}</AppText>
              </View>
              <CategoryBarChart
                items={report.incomeByCategory}
                emptyMessage={t('reports.no_income_data')}
              />
            </Card>

            {/* Line Chart 12-Month Trend (REP-05) */}
            <Card
              style={{
                padding: theme.spacing.lg,
                gap: theme.spacing.md,
                borderRadius: theme.radius.card + 2,
                borderColor: softBorderColor,
              }}
            >
              <View style={[styles.cardHeader, { gap: theme.spacing.sm }]}>
                <View
                  style={[
                    styles.chartIconBadge,
                    { backgroundColor: `${theme.colors.primary}14`, borderRadius: 10 },
                  ]}
                >
                  <Feather name="trending-up" size={16} color={theme.colors.primary} />
                </View>
                <AppText variant="subtitle">
                  {t('reports.monthly_trend', { year })}
                </AppText>
              </View>
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
            <Card
              style={{
                padding: theme.spacing.lg,
                gap: theme.spacing.md,
                borderRadius: theme.radius.card + 2,
                borderColor: softBorderColor,
              }}
            >
              <View style={[styles.cardHeader, { gap: theme.spacing.sm }]}>
                <View
                  style={[
                    styles.chartIconBadge,
                    { backgroundColor: `${theme.colors.info}14`, borderRadius: 10 },
                  ]}
                >
                  <Feather name="list" size={16} color={theme.colors.info} />
                </View>
                <AppText variant="subtitle">{t('reports.transaction_details')}</AppText>
              </View>
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
                        onPress={() => setSelectedTx(tx)}
                        style={({ pressed }) => [
                          styles.txRow,
                          {
                            borderRadius: 12,
                            backgroundColor: surfaceSubtle,
                            borderColor: softBorderColor,
                            borderLeftWidth: 4,
                            borderLeftColor: amountColor,
                            padding: theme.spacing.md,
                            gap: theme.spacing.sm,
                            opacity: pressed ? 0.85 : 1,
                          },
                        ]}
                      >
                        <View style={{ flex: 1, gap: 4 }}>
                          <CategoryChip name={tx.category.name} color={tx.category.color} />
                          {tx.description ? (
                            <AppText variant="bodyStrong" numberOfLines={1}>
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

      <TransactionDetailSheet
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />
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
    borderWidth: 1,
  },
  exportRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCol: {
    flex: 1,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartIconBadge: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
});
