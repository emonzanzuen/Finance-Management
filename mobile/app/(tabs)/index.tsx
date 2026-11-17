import { useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { CategoryPieChart } from '@/components/charts/CategoryPieChart';
import { TrendLineChart } from '@/components/charts/TrendLineChart';
import { AppText } from '@/components/ui/AppText';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { MonthYearPicker } from '@/components/ui/MonthYearPicker';
import { Screen } from '@/components/ui/Screen';
import { SkeletonList } from '@/components/ui/Skeleton';
import { TransactionDetailSheet } from '@/components/ui/TransactionDetailSheet';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { useCurrencies } from '@/hooks/useCurrencies';
import { useDashboardSummary } from '@/hooks/useDashboard';
import { useUnreadNotificationCount } from '@/hooks/useNotifications';
import { useSavingsGoals } from '@/hooks/useSavings';
import { useTranslation } from '@/i18n/useTranslation';
import { useTheme } from '@/theme/useTheme';
import type { Transaction } from '@/types/api';
import { formatDateDisplay, getCurrentWibMonthYear } from '@/utils/format';

function getGreetingKey(): string {
  const wibHour = new Date(Date.now() + 7 * 60 * 60 * 1000).getUTCHours();
  if (wibHour >= 4 && wibHour < 11) return 'dashboard.greeting_morning';
  if (wibHour >= 11 && wibHour < 15) return 'dashboard.greeting_afternoon';
  if (wibHour >= 15 && wibHour < 19) return 'dashboard.greeting_evening';
  return 'dashboard.greeting_night';
}

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { language } = usePreferences();
  const { formatAmount } = useCurrencies();

  const initialPeriod = getCurrentWibMonthYear();
  const [month, setMonth] = useState(initialPeriod.month);
  const [year, setYear] = useState(initialPeriod.year);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [fabSheetOpen, setFabSheetOpen] = useState(false);

  const summaryQuery = useDashboardSummary(month, year);
  const savingsQuery = useSavingsGoals();
  const unreadQuery = useUnreadNotificationCount();
  const unreadCount = unreadQuery.data ?? 0;
  const data = summaryQuery.data;

  // Read total savings from savingsQuery (same source as Savings tab) with fallback to dashboard summary
  const savingsSummary = savingsQuery.data?.summary;
  const computedSavedFromItems =
    savingsQuery.data?.items?.reduce((sum, goal) => sum + Number(goal.currentAmount ?? 0), 0) ?? 0;
  const totalSavingsNominal =
    savingsSummary && savingsSummary.totalSaved > 0
      ? savingsSummary.totalSaved
      : computedSavedFromItems > 0
        ? computedSavedFromItems
        : Number(data?.totalSavings ?? 0);
  const totalSavingsTarget = savingsSummary?.totalTarget ?? 0;

  const greetingText = t(getGreetingKey());
  const userName = user?.name?.trim() || '';

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.md,
          paddingBottom: theme.spacing.xxl * 2.5,
          gap: theme.spacing.lg,
        }}
        refreshControl={
          <RefreshControl
            refreshing={summaryQuery.isRefetching && !summaryQuery.isLoading}
            onRefresh={() => {
              void summaryQuery.refetch();
              void savingsQuery.refetch();
              void unreadQuery.refetch();
            }}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Greeting & Bell Icon + Unread Badge (DASH-01, DASH-09) */}
        <View style={[styles.headerRow, { gap: theme.spacing.md }]}>
          <View style={{ flex: 1 }}>
            <AppText variant="body" muted numberOfLines={1}>
              {greetingText}
              {userName ? `, ${userName}` : ''}
            </AppText>
            <AppText variant="title">{t('nav.home')}</AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/notifications')}
            style={[
              styles.bellBtn,
              {
                minWidth: theme.sizes.touchTarget,
                minHeight: theme.sizes.touchTarget,
                borderRadius: theme.radius.full,
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Feather name="bell" size={22} color={theme.colors.text} />
            {unreadCount > 0 ? (
              <View
                style={[
                  styles.bellBadge,
                  {
                    backgroundColor: theme.colors.danger,
                    borderRadius: theme.radius.full,
                  },
                ]}
              >
                <AppText
                  variant="caption"
                  color={theme.colors.onPrimary}
                  style={styles.bellBadgeText}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </AppText>
              </View>
            ) : null}
          </Pressable>
        </View>

        {/* Period Filter (DASH-06) */}
        <MonthYearPicker
          month={month}
          year={year}
          onChange={(nextMonth, nextYear) => {
            setMonth(nextMonth);
            setYear(nextYear);
          }}
        />

        {summaryQuery.isLoading ? (
          <SkeletonList count={4} itemHeight={100} />
        ) : summaryQuery.isError ? (
          <Card>
            <ErrorState
              message={summaryQuery.error.message}
              onRetry={() => void summaryQuery.refetch()}
            />
          </Card>
        ) : data ? (
          <>
            {/* 1. Recorded Balance Card with Helper Hint (DASH-02, BR-03) */}
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/(tabs)/transactions')}
            >
              <Card
                style={{
                  backgroundColor: theme.colors.primary,
                  borderColor: theme.colors.primary,
                  padding: theme.spacing.xl,
                  gap: theme.spacing.md,
                  overflow: 'hidden',
                  shadowColor: theme.colors.primary,
                  shadowOpacity: theme.isDark ? 0 : 0.3,
                  shadowRadius: 16,
                  shadowOffset: { width: 0, height: 8 },
                  elevation: theme.isDark ? 0 : 6,
                }}
              >
                <View
                  pointerEvents="none"
                  style={[styles.heroCircleLarge, { backgroundColor: `${theme.colors.onPrimary}14` }]}
                />
                <View
                  pointerEvents="none"
                  style={[styles.heroCircleSmall, { backgroundColor: `${theme.colors.onPrimary}10` }]}
                />
                <View style={[styles.cardHeaderRow, { gap: theme.spacing.sm }]}>
                  <View
                    style={[
                      styles.heroIcon,
                      { backgroundColor: `${theme.colors.onPrimary}26`, borderRadius: theme.radius.full },
                    ]}
                  >
                    <Feather name="credit-card" size={18} color={theme.colors.onPrimary} />
                  </View>
                  <AppText variant="bodyStrong" color={theme.colors.onPrimary}>
                    {t('dashboard.balance')}
                  </AppText>
                </View>
                <AppText variant="title" color={theme.colors.onPrimary} style={styles.heroAmount}>
                  {formatAmount(data.balance)}
                </AppText>
                <AppText
                  variant="caption"
                  color={theme.colors.onPrimary}
                  style={{ opacity: 0.88 }}
                >
                  {t('dashboard.balance_hint')}
                </AppText>
              </Card>
            </Pressable>

            {/* 2 & 3. Income This Month & Expense This Month Cards (DASH-02, DASH-07) */}
            <View style={[styles.twoColRow, { gap: theme.spacing.md }]}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/(tabs)/transactions')}
                style={{ flex: 1 }}
              >
                <Card style={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
                  <View style={[styles.cardHeaderRow, { gap: theme.spacing.sm }]}>
                    <View
                      style={[
                        styles.iconCircle,
                        {
                          backgroundColor: `${theme.colors.income}15`,
                          borderRadius: theme.radius.full,
                        },
                      ]}
                    >
                      <Feather name="arrow-down-left" size={18} color={theme.colors.income} />
                    </View>
                    <AppText variant="caption" muted style={{ flex: 1 }} numberOfLines={1}>
                      {t('dashboard.income_this_month')}
                    </AppText>
                  </View>
                  <AppText variant="subtitle" color={theme.colors.income} numberOfLines={1}>
                    {formatAmount(data.income)}
                  </AppText>
                </Card>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/(tabs)/transactions')}
                style={{ flex: 1 }}
              >
                <Card style={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
                  <View style={[styles.cardHeaderRow, { gap: theme.spacing.sm }]}>
                    <View
                      style={[
                        styles.iconCircle,
                        {
                          backgroundColor: `${theme.colors.expense}15`,
                          borderRadius: theme.radius.full,
                        },
                      ]}
                    >
                      <Feather name="arrow-up-right" size={18} color={theme.colors.expense} />
                    </View>
                    <AppText variant="caption" muted style={{ flex: 1 }} numberOfLines={1}>
                      {t('dashboard.expense_this_month')}
                    </AppText>
                  </View>
                  <AppText variant="subtitle" color={theme.colors.expense} numberOfLines={1}>
                    {formatAmount(data.expense)}
                  </AppText>
                </Card>
              </Pressable>
            </View>

            {/* 4. Total Savings Card (DASH-02, DASH-07) */}
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/(tabs)/savings')}
            >
              <Card style={{ padding: theme.spacing.lg }}>
                <View style={[styles.cardHeaderRow, { justifyContent: 'space-between', gap: theme.spacing.md }]}>
                  <View style={[styles.cardHeaderRow, { gap: theme.spacing.md, flex: 1 }]}>
                    <View
                      style={[
                        styles.iconCircle,
                        {
                          backgroundColor: `${theme.colors.info}15`,
                          borderRadius: theme.radius.full,
                        },
                      ]}
                    >
                      <Feather name="award" size={18} color={theme.colors.info} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <AppText variant="caption" muted numberOfLines={1}>
                        {t('dashboard.savings')}
                      </AppText>
                      <AppText
                        variant="subtitle"
                        color={theme.colors.text}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        {formatAmount(totalSavingsNominal)}
                      </AppText>
                      {totalSavingsTarget > 0 ? (
                        <AppText variant="caption" muted numberOfLines={1}>
                          {t('savings.target')}: {formatAmount(totalSavingsTarget)}
                        </AppText>
                      ) : null}
                    </View>
                  </View>
                  <Feather name="chevron-right" size={20} color={theme.colors.textMuted} />
                </View>
              </Card>
            </Pressable>

            {/* Pie Chart Expense by Category (DASH-03) */}
            <Card style={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
              <AppText variant="subtitle">{t('dashboard.expense_by_category')}</AppText>
              <CategoryPieChart items={data.expenseByCategory} />
            </Card>

            {/* Line Chart 6-Month Trend (DASH-04) */}
            <Card style={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
              <AppText variant="subtitle">{t('dashboard.trend_last_6_months')}</AppText>
              <TrendLineChart points={data.trend} />
            </Card>

            {/* 5 Recent Transactions (DASH-05) */}
            <Card style={{ padding: theme.spacing.lg, gap: theme.spacing.sm }}>
              <View style={styles.sectionHeaderRow}>
                <AppText variant="subtitle">{t('dashboard.recent_transactions')}</AppText>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push('/(tabs)/transactions')}
                  style={{
                    minHeight: theme.sizes.touchTarget,
                    justifyContent: 'center',
                    paddingHorizontal: theme.spacing.xs,
                  }}
                >
                  <AppText variant="bodyStrong" color={theme.colors.primary}>
                    {t('dashboard.view_all')}
                  </AppText>
                </Pressable>
              </View>

              {data.recentTransactions.length === 0 ? (
                <EmptyState
                  icon="list"
                  title={t('dashboard.no_transactions')}
                  subtitle={t('dashboard.start_recording')}
                  actionLabel={t('transactions.add')}
                  onAction={() => router.push('/transaction/form')}
                />
              ) : (
                <View>
                  {data.recentTransactions.slice(0, 5).map((tx, idx, arr) => {
                    const isExpense = tx.type === 'expense';
                    const amountColor = isExpense ? theme.colors.expense : theme.colors.income;
                    const sign = isExpense ? '-' : '+';
                    return (
                      <Pressable
                        key={tx.id}
                        accessibilityRole="button"
                        onPress={() => setSelectedTx(tx)}
                        style={[
                          styles.txRow,
                          {
                            paddingVertical: theme.spacing.md,
                            gap: theme.spacing.md,
                            borderBottomWidth: idx < arr.length - 1 ? 1 : 0,
                            borderBottomColor: theme.colors.border,
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
                </View>
              )}
            </Card>

            {/* Financial Insight Cards (DASH-10, BR-23) */}
            {data.insights && data.insights.length > 0 && (
              <View style={{ gap: theme.spacing.md }}>
                {data.insights.map((insight, idx) => (
                  <Card key={idx} style={{ padding: theme.spacing.lg, gap: theme.spacing.sm }}>
                    {insight.type === 'expense_change' && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
                        <View
                          style={[
                            styles.iconCircle,
                            {
                              backgroundColor: `${insight.direction === 'up' ? theme.colors.expense : theme.colors.income}15`,
                              borderRadius: theme.radius.full,
                            },
                          ]}
                        >
                          <Feather
                            name={insight.direction === 'up' ? 'trending-up' : 'trending-down'}
                            size={18}
                            color={insight.direction === 'up' ? theme.colors.expense : theme.colors.income}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <AppText variant="bodyStrong">
                            {t('dashboard.insight_expense_change_title')}
                          </AppText>
                          <AppText variant="caption" muted>
                            {t('dashboard.insight_expense_change_desc', {
                              direction: insight.direction === 'up' ? t('dashboard.insight_up') : t('dashboard.insight_down'),
                              percent: insight.percent?.toFixed(1) ?? '0',
                            })}
                          </AppText>
                        </View>
                      </View>
                    )}
                    {insight.type === 'top_category' && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
                        <View
                          style={[
                            styles.iconCircle,
                            { backgroundColor: `${theme.colors.warning}15`, borderRadius: theme.radius.full },
                          ]}
                        >
                          <Feather name="pie-chart" size={18} color={theme.colors.warning} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <AppText variant="bodyStrong">
                            {t('dashboard.insight_top_category_title')}
                          </AppText>
                          <AppText variant="caption" muted>
                            {t('dashboard.insight_top_category_desc', {
                              category: insight.categoryName ?? '-',
                              amount: insight.amount ? formatAmount(insight.amount) : '-',
                              percent: insight.percent?.toFixed(1) ?? '0',
                            })}
                          </AppText>
                        </View>
                      </View>
                    )}
                    {insight.type === 'budgets_near_limit' && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
                        <View
                          style={[
                            styles.iconCircle,
                            { backgroundColor: `${theme.colors.warning}15`, borderRadius: theme.radius.full },
                          ]}
                        >
                          <Feather name="alert-triangle" size={18} color={theme.colors.warning} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <AppText variant="bodyStrong">
                            {t('dashboard.insight_budgets_near_limit_title')}
                          </AppText>
                          <AppText variant="caption" muted>
                            {t('dashboard.insight_budgets_near_limit_desc', {
                              count: insight.count ?? 0,
                            })}
                          </AppText>
                        </View>
                      </View>
                    )}
                  </Card>
                ))}
              </View>
            )}
          </>
        ) : null}
      </ScrollView>

      {/* Floating Action Button (+) (Section 10) */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('transactions.add')}
        onPress={() => setFabSheetOpen(true)}
        style={[
          styles.fab,
          {
            right: theme.spacing.lg,
            bottom: theme.spacing.lg,
            backgroundColor: theme.colors.primary,
            borderRadius: theme.radius.full,
            shadowColor: theme.colors.primary,
            shadowOpacity: theme.isDark ? 0 : 0.35,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
          },
        ]}
      >
        <Feather name="plus" size={26} color={theme.colors.onPrimary} />
      </Pressable>

      {/* Transaction Detail BottomSheet (TRX-08) */}
      <TransactionDetailSheet
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />

      {/* FAB Options Bottom Sheet */}
      <BottomSheet
        visible={fabSheetOpen}
        onClose={() => setFabSheetOpen(false)}
        title={t('transactions.add')}
      >
        <View style={{ gap: theme.spacing.md, paddingTop: theme.spacing.md }}>
          <Button
            icon="edit"
            label={t('transactions.add_manual')}
            onPress={() => {
              setFabSheetOpen(false);
              router.push('/transaction/form');
            }}
          />
          <Button
            variant="secondary"
            icon="camera"
            label={t('transactions.scan_receipt')}
            onPress={() => {
              setFabSheetOpen(false);
              router.push('/transaction/scan');
            }}
          />
        </View>
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bellBtn: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  bellBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  twoColRow: {
    flexDirection: 'row',
  },
  iconCircle: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAmount: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
  },
  heroCircleLarge: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -60,
    right: -50,
  },
  heroCircleSmall: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    bottom: -40,
    left: -30,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
});
