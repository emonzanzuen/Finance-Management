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

  const summaryQuery = useDashboardSummary(month, year);
  const unreadQuery = useUnreadNotificationCount();
  const unreadCount = unreadQuery.data ?? 0;
  const data = summaryQuery.data;

  const greetingText = t(getGreetingKey());
  const userName = user?.name?.trim() || '';

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing.lg,
          paddingBottom: theme.spacing.xxl * 2.5,
          gap: theme.spacing.md,
        }}
        refreshControl={
          <RefreshControl
            refreshing={summaryQuery.isRefetching && !summaryQuery.isLoading}
            onRefresh={() => {
              void summaryQuery.refetch();
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
            <AppText variant="caption" muted>
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
            <Feather name="bell" size={20} color={theme.colors.text} />
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
                }}
              >
                <View style={[styles.cardHeaderRow, { gap: theme.spacing.sm }]}>
                  <Feather name="credit-card" size={18} color={theme.colors.onPrimary} />
                  <AppText variant="bodyStrong" color={theme.colors.onPrimary}>
                    {t('dashboard.balance')}
                  </AppText>
                </View>
                <AppText variant="title" color={theme.colors.onPrimary}>
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
                <Card>
                  <View style={[styles.cardHeaderRow, { gap: theme.spacing.xs }]}>
                    <View
                      style={[
                        styles.iconCircle,
                        {
                          backgroundColor: `${theme.colors.income}1F`,
                          borderRadius: theme.radius.full,
                        },
                      ]}
                    >
                      <Feather name="arrow-down-left" size={16} color={theme.colors.income} />
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
                <Card>
                  <View style={[styles.cardHeaderRow, { gap: theme.spacing.xs }]}>
                    <View
                      style={[
                        styles.iconCircle,
                        {
                          backgroundColor: `${theme.colors.expense}1F`,
                          borderRadius: theme.radius.full,
                        },
                      ]}
                    >
                      <Feather name="arrow-up-right" size={16} color={theme.colors.expense} />
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
              <Card>
                <View style={[styles.cardHeaderRow, { justifyContent: 'space-between' }]}>
                  <View style={[styles.cardHeaderRow, { gap: theme.spacing.sm }]}>
                    <View
                      style={[
                        styles.iconCircle,
                        {
                          backgroundColor: `${theme.colors.info}1F`,
                          borderRadius: theme.radius.full,
                        },
                      ]}
                    >
                      <Feather name="award" size={16} color={theme.colors.info} />
                    </View>
                    <View>
                      <AppText variant="caption" muted>
                        {t('dashboard.savings')}
                      </AppText>
                      <AppText variant="subtitle">{formatAmount(data.totalSavings)}</AppText>
                    </View>
                  </View>
                  <Feather name="chevron-right" size={20} color={theme.colors.textMuted} />
                </View>
              </Card>
            </Pressable>

            {/* Pie Chart Expense by Category (DASH-03) */}
            <Card>
              <AppText variant="subtitle">{t('dashboard.expense_by_category')}</AppText>
              <CategoryPieChart items={data.expenseByCategory} />
            </Card>

            {/* Line Chart 6-Month Trend (DASH-04) */}
            <Card>
              <AppText variant="subtitle">{t('dashboard.trend_last_6_months')}</AppText>
              <TrendLineChart points={data.trend} />
            </Card>

            {/* 5 Recent Transactions (DASH-05) */}
            <Card>
              <View style={styles.sectionHeaderRow}>
                <AppText variant="subtitle">{t('dashboard.recent_transactions')}</AppText>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push('/(tabs)/transactions')}
                  style={{ paddingVertical: theme.spacing.xs, paddingHorizontal: theme.spacing.xs }}
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
                <View style={{ gap: theme.spacing.sm }}>
                  {data.recentTransactions.slice(0, 5).map((tx) => {
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
                </View>
              )}
            </Card>
          </>
        ) : null}
      </ScrollView>

      {/* Floating Action Button (+) (Section 10) */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('transactions.add')}
        onPress={() => router.push('/transaction/form')}
        style={[
          styles.fab,
          {
            right: theme.spacing.lg,
            bottom: theme.spacing.lg,
            backgroundColor: theme.colors.primary,
            borderRadius: theme.radius.full,
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
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
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
