import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Feather } from '@expo/vector-icons';
import { AmountField } from '@/components/ui/AmountField';
import { AppText } from '@/components/ui/AppText';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { MonthYearPicker } from '@/components/ui/MonthYearPicker';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { Select, type SelectOption } from '@/components/ui/Select';
import { SkeletonList } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import {
  useBudgets,
  useCreateBudget,
  useDeleteBudget,
  useTopUpBudget,
  useUpdateBudget,
} from '@/hooks/useBudgets';
import { useCategories } from '@/hooks/useCategories';
import { useCurrencies } from '@/hooks/useCurrencies';
import { useSavingsGoals } from '@/hooks/useSavings';
import { useTranslation } from '@/i18n/useTranslation';
import {
  budgetFormSchema,
  topUpBudgetFormSchema,
  type BudgetFormValues,
  type TopUpBudgetFormValues,
} from '@/schemas/budget';
import { useTheme } from '@/theme/useTheme';
import { ApiError, type BudgetItem, type BudgetStatus } from '@/types/api';
import { getCurrentWibMonthYear } from '@/utils/format';

export default function BudgetScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { formatAmount, rates } = useCurrencies();

  const initialPeriod = getCurrentWibMonthYear();
  const [month, setMonth] = useState(initialPeriod.month);
  const [year, setYear] = useState(initialPeriod.year);

  const budgetsQuery = useBudgets(month, year);
  const expenseCategoriesQuery = useCategories('expense');
  const createMutation = useCreateBudget();
  const updateMutation = useUpdateBudget();
  const deleteMutation = useDeleteBudget();
  const topUpMutation = useTopUpBudget();
  const savingsGoalsQuery = useSavingsGoals();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetItem | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingBudget, setDeletingBudget] = useState<BudgetItem | null>(null);

  // Quick Top-up state (BUD-09)
  const [topUpTarget, setTopUpTarget] = useState<BudgetItem | null>(null);
  const [topUpError, setTopUpError] = useState<string | null>(null);

  // Only goals with saved balance can fund a budget top-up (BUD-10, BR-25)
  const eligibleGoals = useMemo(
    () => (savingsGoalsQuery.data?.items ?? []).filter((g) => g.currentAmount > 0),
    [savingsGoalsQuery.data?.items],
  );
  const goalOptions = useMemo<SelectOption[]>(
    () =>
      eligibleGoals.map((g) => ({
        value: g.id,
        label: `${g.title} (${formatAmount(g.currentAmount)})`,
      })),
    [eligibleGoals, formatAmount],
  );

  const topUpForm = useForm<TopUpBudgetFormValues>({
    resolver: zodResolver(topUpBudgetFormSchema),
    defaultValues: {
      amount: 0,
      source: 'manual',
      goalId: '',
    },
  });
  const topUpSource = useWatch({ control: topUpForm.control, name: 'source' });
  const topUpGoalId = useWatch({ control: topUpForm.control, name: 'goalId' });
  const selectedGoal = eligibleGoals.find((g) => g.id === topUpGoalId);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      categoryId: '',
      budgetAmount: 0,
    },
  });

  const budgetItems = useMemo(
    () => budgetsQuery.data?.items ?? [],
    [budgetsQuery.data?.items],
  );
  const summary = budgetsQuery.data?.summary;

  // Expense categories only (BR-09)
  const categoryOptions = useMemo<SelectOption[]>(() => {
    const existingCategoryIds = new Set(budgetItems.map((b) => b.category.id));
    return (expenseCategoriesQuery.data ?? [])
      .filter((c) => c.type === 'expense')
      .filter((c) => (editingBudget ? c.id === editingBudget.category.id : !existingCategoryIds.has(c.id)))
      .map((c) => ({
        value: c.id,
        label: c.name,
        color: c.color,
      }));
  }, [expenseCategoriesQuery.data, budgetItems, editingBudget]);

  const hasCriticalOrExceeded = useMemo(
    () => budgetItems.some((b) => b.status === 'critical' || b.status === 'exceeded'),
    [budgetItems],
  );

  const getStatusColor = (status: BudgetStatus): string => {
    if (status === 'safe') return theme.colors.income;
    if (status === 'warning') return theme.colors.warning;
    return theme.colors.danger;
  };

  const getStatusBadgeVariant = (status: BudgetStatus): BadgeVariant => {
    if (status === 'safe') return 'success';
    if (status === 'warning') return 'warning';
    return 'danger';
  };

  const openCreateModal = () => {
    setEditingBudget(null);
    setFormError(null);
    reset({
      categoryId: categoryOptions[0]?.value ?? '',
      budgetAmount: 0,
    });
    setSheetOpen(true);
  };

  const openEditModal = (item: BudgetItem) => {
    setEditingBudget(item);
    setFormError(null);
    reset({
      categoryId: item.category.id,
      budgetAmount: item.budgetAmount,
    });
    setSheetOpen(true);
  };

  const openTopUpModal = (item: BudgetItem) => {
    setTopUpTarget(item);
    setTopUpError(null);
    topUpForm.reset({ amount: 0, source: 'manual', goalId: '' });
  };

  const onSubmitTopUp = async (values: TopUpBudgetFormValues) => {
    if (!topUpTarget) return;
    setTopUpError(null);

    let goalToUse: (typeof eligibleGoals)[number] | undefined;
    if (values.source === 'savings') {
      goalToUse = eligibleGoals.find((g) => g.id === values.goalId);
      if (!goalToUse) {
        setTopUpError(t('budget.validation.goal_required'));
        return;
      }
      if (values.amount > goalToUse.currentAmount) {
        setTopUpError(t('budget.exceeds_saved', { saved: formatAmount(goalToUse.currentAmount) }));
        return;
      }
    }

    try {
      await topUpMutation.mutateAsync({
        id: topUpTarget.id,
        input: goalToUse
          ? { amount: values.amount, source: 'savings', goalId: goalToUse.id }
          : { amount: values.amount, source: 'manual' },
      });
      setTopUpTarget(null);
      showToast(t('budget.top_up_toast'), 'success');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'TOPUP_EXCEEDS_SAVED' && goalToUse) {
          setTopUpError(t('budget.exceeds_saved', { saved: formatAmount(goalToUse.currentAmount) }));
          return;
        }
        const key = `errors.${err.code}`;
        const translated = t(key);
        setTopUpError(translated !== key ? translated : err.message);
      } else {
        setTopUpError(t('errors.UNKNOWN'));
      }
    }
  };

  const onSubmit = async (values: BudgetFormValues) => {
    setFormError(null);
    try {
      if (editingBudget) {
        await updateMutation.mutateAsync({
          id: editingBudget.id,
          input: { budgetAmount: values.budgetAmount },
        });
        showToast(t('budget.updated_toast'), 'success');
      } else {
        await createMutation.mutateAsync({
          categoryId: values.categoryId,
          month,
          year,
          budgetAmount: values.budgetAmount,
        });
        showToast(t('budget.created_toast'), 'success');
      }
      setSheetOpen(false);
    } catch (err) {
      if (err instanceof ApiError) {
        const translated = t(`errors.${err.code}`);
        setFormError(translated !== `errors.${err.code}` ? translated : err.message);
      } else {
        setFormError(t('errors.UNKNOWN'));
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingBudget) return;
    const target = deletingBudget;
    try {
      await deleteMutation.mutateAsync(target.id);
      setDeletingBudget(null);
      showToast(t('budget.deleted_toast'), 'success');
    } catch (err) {
      setDeletingBudget(null);
      if (err instanceof ApiError) {
        showToast(err.message, 'error');
      } else {
        showToast(t('errors.UNKNOWN'), 'error');
      }
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const summaryStatusColor = summary
    ? summary.percentage > 100 || summary.percentage >= 90
      ? theme.colors.danger
      : summary.percentage >= 70
        ? theme.colors.warning
        : theme.colors.income
    : theme.colors.primary;

  return (
    <Screen padded={false}>
      <View
        style={{
          flex: 1,
          gap: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.md,
        }}
      >
        {/* Header (aligned with Transactions & Savings screens) */}
        <View style={[styles.headerRow, { gap: theme.spacing.md }]}>
          <View style={{ flex: 1 }}>
            <AppText variant="title">{t('budget.title')}</AppText>
            <AppText variant="caption" muted numberOfLines={1}>
              {t('budget.category_breakdown')}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.add')}
            onPress={openCreateModal}
            style={({ pressed }) => [
              styles.addBtn,
              {
                borderRadius: theme.radius.control + 2,
                backgroundColor: theme.colors.primary,
                opacity: pressed ? 0.85 : 1,
                shadowColor: theme.colors.primary,
                shadowOpacity: theme.isDark ? 0 : 0.2,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
                elevation: theme.isDark ? 0 : 2,
              },
            ]}
          >
            <Feather name="plus" size={22} color={theme.colors.onPrimary} />
          </Pressable>
        </View>

        {/* Month & Year Picker (BUD-07) */}
        <MonthYearPicker
          month={month}
          year={year}
          onChange={(nextMonth, nextYear) => {
            setMonth(nextMonth);
            setYear(nextYear);
          }}
        />

        {budgetsQuery.isLoading ? (
          <SkeletonList count={4} itemHeight={116} />
        ) : budgetsQuery.isError ? (
          <ErrorState
            message={budgetsQuery.error.message}
            onRetry={() => void budgetsQuery.refetch()}
          />
        ) : (
          <FlatList
            data={budgetItems}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              gap: theme.spacing.md,
              paddingBottom: 96,
              flexGrow: 1,
            }}
            refreshControl={
              <RefreshControl
                refreshing={budgetsQuery.isRefetching && !budgetsQuery.isLoading}
                onRefresh={() => void budgetsQuery.refetch()}
                tintColor={theme.colors.primary}
              />
            }
            ListHeaderComponent={
              <View style={{ gap: theme.spacing.md }}>
                {/* Summary Card (BUD-03, BR-12) */}
                {summary ? (
                  <Card
                    style={{
                      padding: theme.spacing.lg,
                      gap: theme.spacing.md,
                      borderRadius: theme.radius.card + 2,
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      shadowColor: theme.colors.text,
                      shadowOpacity: theme.isDark ? 0 : 0.03,
                      shadowRadius: 12,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: theme.isDark ? 0 : 1,
                    }}
                  >
                    <View style={[styles.summaryTopRow, { gap: theme.spacing.sm }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, flex: 1 }}>
                        <View
                          style={[
                            styles.summaryIconBox,
                            {
                              backgroundColor: `${summaryStatusColor}15`,
                              borderRadius: theme.radius.control,
                            },
                          ]}
                        >
                          <Feather name="pie-chart" size={18} color={summaryStatusColor} />
                        </View>
                        <AppText variant="subtitle" style={{ flex: 1 }} numberOfLines={1}>
                          {t('budget.usage')}
                        </AppText>
                      </View>
                      <View
                        style={[
                          styles.percentPill,
                          {
                            backgroundColor: `${summaryStatusColor}15`,
                            borderRadius: theme.radius.full,
                            paddingHorizontal: theme.spacing.sm + 2,
                            paddingVertical: 4,
                          },
                        ]}
                      >
                        <AppText variant="caption" color={summaryStatusColor} style={{ fontWeight: '700' }}>
                          {Math.round(summary.percentage)}%
                        </AppText>
                      </View>
                    </View>

                    <ProgressBar percentage={summary.percentage} color={summaryStatusColor} />

                    {/* 3 Soft Metric Boxes (Equal Width, Never Cut Off) */}
                    <View style={[styles.summaryGrid, { gap: theme.spacing.sm }]}>
                      <View
                        style={[
                          styles.metricBox,
                          {
                            backgroundColor: theme.colors.surfaceAlt,
                            borderRadius: theme.radius.control,
                            borderColor: theme.colors.border,
                            padding: theme.spacing.sm,
                          },
                        ]}
                      >
                        <AppText variant="caption" muted numberOfLines={1}>
                          {t('budget.total_budget')}
                        </AppText>
                        <AppText
                          variant="bodyStrong"
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.75}
                        >
                          {formatAmount(summary.totalBudget)}
                        </AppText>
                      </View>

                      <View
                        style={[
                          styles.metricBox,
                          {
                            backgroundColor: theme.colors.surfaceAlt,
                            borderRadius: theme.radius.control,
                            borderColor: theme.colors.border,
                            padding: theme.spacing.sm,
                          },
                        ]}
                      >
                        <AppText variant="caption" muted numberOfLines={1}>
                          {t('budget.total_spent')}
                        </AppText>
                        <AppText
                          variant="bodyStrong"
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.75}
                        >
                          {formatAmount(summary.totalSpent)}
                        </AppText>
                      </View>

                      <View
                        style={[
                          styles.metricBox,
                          {
                            backgroundColor:
                              summary.remaining < 0
                                ? `${theme.colors.danger}10`
                                : `${theme.colors.income}10`,
                            borderRadius: theme.radius.control,
                            borderColor:
                              summary.remaining < 0
                                ? `${theme.colors.danger}30`
                                : `${theme.colors.income}30`,
                            padding: theme.spacing.sm,
                          },
                        ]}
                      >
                        <AppText variant="caption" muted numberOfLines={1}>
                          {t('budget.remaining')}
                        </AppText>
                        <AppText
                          variant="bodyStrong"
                          color={
                            summary.remaining < 0 ? theme.colors.danger : theme.colors.income
                          }
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.75}
                        >
                          {formatAmount(summary.remaining)}
                        </AppText>
                      </View>
                    </View>
                  </Card>
                ) : null}

                {/* Warning Banner when critical (>=90%) or exceeded (>100%) (BUD-06) */}
                {hasCriticalOrExceeded ? (
                  <View
                    style={[
                      styles.warningBanner,
                      {
                        backgroundColor: `${theme.colors.danger}12`,
                        borderColor: `${theme.colors.danger}40`,
                        borderRadius: theme.radius.control,
                        padding: theme.spacing.md,
                        gap: theme.spacing.sm,
                      },
                    ]}
                  >
                    <Feather name="alert-triangle" size={18} color={theme.colors.danger} />
                    <AppText variant="caption" color={theme.colors.danger} style={{ flex: 1, lineHeight: 18 }}>
                      {t('budget.almost_exceeded')}
                    </AppText>
                  </View>
                ) : null}

                {/* Section Divider Bar between Summary Card and Category Item Cards */}
                {budgetItems.length > 0 ? (
                  <View style={[styles.sectionDividerBar, { paddingHorizontal: 4 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
                      <AppText variant="bodyStrong" color={theme.colors.textMuted}>
                        {t('budget.category_breakdown')}
                      </AppText>
                      <Badge label={String(budgetItems.length)} variant="neutral" />
                    </View>
                  </View>
                ) : null}
              </View>
            }
            ListEmptyComponent={
              <EmptyState
                icon="pie-chart"
                title={t('budget.empty')}
                subtitle={t('budget.empty_subtitle')}
                actionLabel={t('budget.add_first')}
                onAction={openCreateModal}
              />
            }
            renderItem={({ item }) => {
              const statusColor = getStatusColor(item.status);
              const isNegativeRemaining = item.remaining < 0;
              return (
                <Card
                  style={{
                    padding: theme.spacing.lg,
                    gap: theme.spacing.md,
                    borderRadius: theme.radius.card + 2,
                    borderColor: theme.colors.border,
                    borderLeftWidth: 4,
                    borderLeftColor: statusColor,
                    backgroundColor: theme.colors.surface,
                    shadowColor: theme.colors.text,
                    shadowOpacity: theme.isDark ? 0 : 0.03,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: theme.isDark ? 0 : 1,
                  }}
                >
                  {/* Top Row: Category + Status Badge + Edit/Delete Icon Buttons */}
                  <View style={styles.itemHeader}>
                    <View style={{ flex: 1, paddingRight: theme.spacing.sm }}>
                      <CategoryChip name={item.category.name} color={item.category.color} />
                    </View>
                    <View style={[styles.itemActions, { gap: theme.spacing.xs }]}>
                      <Badge
                        label={t(`budget.status.${item.status}`)}
                        variant={getStatusBadgeVariant(item.status)}
                      />
                      <Pressable
                        accessibilityRole="button"
                        hitSlop={8}
                        onPress={() => openEditModal(item)}
                        style={[
                          styles.actionIconBtn,
                          {
                            borderRadius: theme.radius.control - 2,
                            backgroundColor: theme.colors.surfaceAlt,
                          },
                        ]}
                      >
                        <Feather name="edit-2" size={15} color={theme.colors.textMuted} />
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        hitSlop={8}
                        onPress={() => setDeletingBudget(item)}
                        style={[
                          styles.actionIconBtn,
                          {
                            borderRadius: theme.radius.control - 2,
                            backgroundColor: `${theme.colors.danger}14`,
                          },
                        ]}
                      >
                        <Feather name="trash-2" size={15} color={theme.colors.danger} />
                      </Pressable>
                    </View>
                  </View>

                  <ProgressBar percentage={item.percentage} color={statusColor} />

                  {/* Spent vs Budget & Remaining Row */}
                  <View style={[styles.itemNumbersRow, { gap: theme.spacing.sm }]}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <AppText variant="caption" muted>
                        {t('budget.total_spent')} / {t('budget.total_budget')}
                      </AppText>
                      <AppText variant="bodyStrong" numberOfLines={1} adjustsFontSizeToFit>
                        {formatAmount(item.spentAmount)} / {formatAmount(item.budgetAmount)} (
                        {Math.round(item.percentage)}%)
                      </AppText>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 2 }}>
                      <AppText variant="caption" muted>
                        {t('budget.remaining')}
                      </AppText>
                      <AppText
                        variant="bodyStrong"
                        color={isNegativeRemaining ? theme.colors.danger : theme.colors.income}
                      >
                        {formatAmount(item.remaining)}
                      </AppText>
                    </View>
                  </View>

                  {/* Footer Action: Quick Top-Up Button (BUD-09) */}
                  <View
                    style={[
                      styles.cardFooter,
                      {
                        paddingTop: theme.spacing.sm,
                        borderTopColor: theme.colors.border,
                      },
                    ]}
                  >
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => openTopUpModal(item)}
                      style={({ pressed }) => [
                        styles.softTopUpBtn,
                        {
                          borderRadius: theme.radius.control,
                          backgroundColor: `${theme.colors.primary}12`,
                          borderColor: `${theme.colors.primary}28`,
                          paddingVertical: 10,
                          paddingHorizontal: theme.spacing.md,
                          opacity: pressed ? 0.8 : 1,
                          gap: 6,
                        },
                      ]}
                    >
                      <Feather name="plus-circle" size={15} color={theme.colors.primary} />
                      <AppText variant="caption" color={theme.colors.primary} style={{ fontWeight: '700' }}>
                        {t('budget.top_up_btn').replace(/^\+\s*/, '')}
                      </AppText>
                    </Pressable>
                  </View>
                </Card>
              );
            }}
          />
        )}
      </View>

      {/* Add / Edit Budget Bottom Sheet (BUD-01, BUD-02, BR-09) */}
      <BottomSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={editingBudget ? t('budget.edit') : t('budget.add')}
      >
        <View style={{ gap: theme.spacing.md }}>
          {formError ? (
            <View
              style={[
                styles.errorBox,
                {
                  backgroundColor: `${theme.colors.danger}18`,
                  borderColor: theme.colors.danger,
                  borderRadius: theme.radius.control,
                  padding: theme.spacing.md,
                  gap: theme.spacing.sm,
                },
              ]}
            >
              <Feather name="alert-circle" size={18} color={theme.colors.danger} />
              <AppText variant="caption" color={theme.colors.danger} style={{ flex: 1 }}>
                {formError}
              </AppText>
            </View>
          ) : null}

          <Controller
            control={control}
            name="categoryId"
            render={({ field: { onChange, value } }) => (
              <View style={{ gap: theme.spacing.xs }}>
                <Select
                  label={t('transactions.category')}
                  placeholder={t('budget.select_expense_category')}
                  value={value}
                  options={categoryOptions}
                  onChange={onChange}
                  disabled={Boolean(editingBudget)}
                  error={errors.categoryId?.message ? t(errors.categoryId.message) : undefined}
                />
                {editingBudget ? (
                  <View
                    style={[
                      styles.infoNotice,
                      {
                        backgroundColor: `${theme.colors.info}14`,
                        borderColor: `${theme.colors.info}40`,
                        borderRadius: theme.radius.control,
                        paddingHorizontal: theme.spacing.md,
                        paddingVertical: theme.spacing.sm,
                        gap: theme.spacing.sm,
                      },
                    ]}
                  >
                    <Feather name="info" size={15} color={theme.colors.info} />
                    <AppText variant="caption" muted style={{ flex: 1 }}>
                      {t('budget.category_locked_hint')}
                    </AppText>
                  </View>
                ) : null}
              </View>
            )}
          />

          {!editingBudget && categoryOptions.length === 0 ? (
            <AppText variant="caption" color={theme.colors.warning}>
              {t('budget.all_categories_budgeted')}
            </AppText>
          ) : null}

          <Controller
            control={control}
            name="budgetAmount"
            render={({ field: { onChange, value } }) => (
              <AmountField
                label={t('budget.amount')}
                value={value}
                onChangeValue={onChange}
                rates={rates}
                error={errors.budgetAmount?.message ? t(errors.budgetAmount.message) : undefined}
              />
            )}
          />

          <View style={[styles.sheetButtons, { gap: theme.spacing.sm }]}>
            <View style={{ flex: 1 }}>
              <Button
                variant="secondary"
                label={t('common.cancel')}
                disabled={isSaving}
                onPress={() => setSheetOpen(false)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label={t('common.save')}
                loading={isSaving}
                disabled={!editingBudget && categoryOptions.length === 0}
                onPress={handleSubmit(onSubmit)}
              />
            </View>
          </View>
        </View>
      </BottomSheet>

      {/* Quick Top-Up Budget Bottom Sheet (BUD-09) */}
      <BottomSheet
        visible={Boolean(topUpTarget)}
        onClose={() => setTopUpTarget(null)}
        title={t('budget.top_up_title')}
      >
        {topUpTarget ? (
          <View style={{ gap: theme.spacing.md }}>
            <View
              style={[
                styles.infoNotice,
                {
                  backgroundColor: theme.colors.surfaceAlt,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radius.control,
                  padding: theme.spacing.md,
                  gap: theme.spacing.sm,
                  alignItems: 'center',
                },
              ]}
            >
              <CategoryChip
                name={topUpTarget.category.name}
                color={topUpTarget.category.color}
              />
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <AppText variant="caption" muted>
                  {t('budget.total_budget')}
                </AppText>
                <AppText variant="bodyStrong">{formatAmount(topUpTarget.budgetAmount)}</AppText>
              </View>
            </View>

            {topUpError ? (
              <View
                style={[
                  styles.errorBox,
                  {
                    backgroundColor: `${theme.colors.danger}18`,
                    borderColor: theme.colors.danger,
                    borderRadius: theme.radius.control,
                    padding: theme.spacing.md,
                    gap: theme.spacing.sm,
                  },
                ]}
              >
                <Feather name="alert-circle" size={18} color={theme.colors.danger} />
                <AppText variant="caption" color={theme.colors.danger} style={{ flex: 1 }}>
                  {topUpError}
                </AppText>
              </View>
            ) : null}

            {/* Funding source (BUD-10, BR-25) */}
            <View style={{ gap: theme.spacing.xs }}>
              <AppText variant="bodyStrong">{t('budget.top_up_source')}</AppText>
              <View style={[styles.sheetButtons, { gap: theme.spacing.sm }]}>
                <View style={{ flex: 1 }}>
                  <Button
                    variant={topUpSource === 'manual' ? 'primary' : 'secondary'}
                    label={t('budget.source_manual')}
                    onPress={() => topUpForm.setValue('source', 'manual')}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    variant={topUpSource === 'savings' ? 'primary' : 'secondary'}
                    label={t('budget.source_savings')}
                    disabled={eligibleGoals.length === 0}
                    onPress={() => {
                      topUpForm.setValue('source', 'savings');
                      if (!topUpForm.getValues('goalId') && eligibleGoals[0]) {
                        topUpForm.setValue('goalId', eligibleGoals[0].id);
                      }
                    }}
                  />
                </View>
              </View>
              {eligibleGoals.length === 0 ? (
                <AppText variant="caption" muted>
                  {t('budget.no_savings_with_balance')}
                </AppText>
              ) : null}
            </View>

            {topUpSource === 'savings' && eligibleGoals.length > 0 ? (
              <View style={{ gap: theme.spacing.xs }}>
                <Controller
                  control={topUpForm.control}
                  name="goalId"
                  render={({ field: { onChange, value } }) => (
                    <Select
                      label={t('budget.savings_goal_label')}
                      placeholder={t('budget.select_savings_goal')}
                      value={value}
                      options={goalOptions}
                      onChange={onChange}
                      error={
                        topUpForm.formState.errors.goalId?.message
                          ? t(topUpForm.formState.errors.goalId.message)
                          : undefined
                      }
                    />
                  )}
                />
                {selectedGoal ? (
                  <AppText variant="caption" muted>
                    {t('budget.available_balance', { amount: formatAmount(selectedGoal.currentAmount) })}
                  </AppText>
                ) : null}
              </View>
            ) : null}

            <Controller
              control={topUpForm.control}
              name="amount"
              render={({ field: { onChange, value } }) => (
                <AmountField
                  label={t('budget.top_up_amount')}
                  value={value}
                  onChangeValue={onChange}
                  rates={rates}
                  error={
                    topUpForm.formState.errors.amount?.message
                      ? t(topUpForm.formState.errors.amount.message)
                      : undefined
                  }
                />
              )}
            />

            <View style={[styles.sheetButtons, { gap: theme.spacing.sm }]}>
              <View style={{ flex: 1 }}>
                <Button
                  variant="secondary"
                  label={t('common.cancel')}
                  disabled={topUpMutation.isPending}
                  onPress={() => setTopUpTarget(null)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label={t('common.save')}
                  loading={topUpMutation.isPending}
                  onPress={topUpForm.handleSubmit(onSubmitTopUp)}
                />
              </View>
            </View>
          </View>
        ) : null}
      </BottomSheet>

      {/* Delete Confirmation */}
      <ConfirmDialog
        visible={Boolean(deletingBudget)}
        title={t('budget.delete')}
        message={t('budget.confirm_delete', { name: deletingBudget?.category.name ?? '' })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        danger
        loading={deleteMutation.isPending}
        onCancel={() => setDeletingBudget(null)}
        onConfirm={() => void handleConfirmDelete()}
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
  addBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryIconBox: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentPill: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  metricBox: {
    flex: 1,
    borderWidth: 1,
    gap: 2,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  sectionDividerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemNumbersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardFooter: {
    borderTopWidth: 1,
  },
  softTopUpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  infoNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
  },
  sheetButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
