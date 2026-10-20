import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';
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
  useUpdateBudget,
} from '@/hooks/useBudgets';
import { useCategories } from '@/hooks/useCategories';
import { useCurrencies } from '@/hooks/useCurrencies';
import { useTranslation } from '@/i18n/useTranslation';
import { budgetFormSchema, type BudgetFormValues } from '@/schemas/budget';
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

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetItem | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingBudget, setDeletingBudget] = useState<BudgetItem | null>(null);

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
    if (status === 'safe') return theme.colors.income; // #10B981
    if (status === 'warning') return theme.colors.warning; // #F59E0B
    return theme.colors.danger; // #EF4444 for critical & exceeded
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

  return (
    <Screen padded={false}>
      <View
        style={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.lg,
          gap: theme.spacing.md,
        }}
      >
        {/* Title & Add Button */}
        <View style={styles.headerRow}>
          <AppText variant="title">{t('budget.title')}</AppText>
          <Pressable
            accessibilityRole="button"
            onPress={openCreateModal}
            style={[
              styles.addBtn,
              {
                minHeight: theme.sizes.touchTarget,
                paddingHorizontal: theme.spacing.md,
                borderRadius: theme.radius.control,
                backgroundColor: theme.colors.primary,
                gap: theme.spacing.xs,
              },
            ]}
          >
            <Feather name="plus" size={18} color={theme.colors.onPrimary} />
            <AppText variant="bodyStrong" color={theme.colors.onPrimary}>
              {t('common.add')}
            </AppText>
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
      </View>

      <View style={{ flex: 1, paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md }}>
        {budgetsQuery.isLoading ? (
          <SkeletonList count={4} itemHeight={110} />
        ) : budgetsQuery.isError ? (
          <ErrorState
            message={budgetsQuery.error.message}
            onRetry={() => void budgetsQuery.refetch()}
          />
        ) : (
          <FlatList
            data={budgetItems}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              gap: theme.spacing.md,
              paddingBottom: theme.spacing.xxl * 2,
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
                  <Card>
                    <View style={styles.summaryTopRow}>
                      <AppText variant="subtitle">{t('budget.usage')}</AppText>
                      <AppText variant="bodyStrong">{Math.round(summary.percentage)}%</AppText>
                    </View>
                    <ProgressBar
                      percentage={summary.percentage}
                      color={
                        summary.percentage > 100 || summary.percentage >= 90
                          ? theme.colors.danger
                          : summary.percentage >= 70
                            ? theme.colors.warning
                            : theme.colors.income
                      }
                    />
                    <View style={[styles.summaryGrid, { gap: theme.spacing.sm }]}>
                      <View style={styles.summaryCol}>
                        <AppText variant="caption" muted>
                          {t('budget.total_budget')}
                        </AppText>
                        <AppText variant="bodyStrong">
                          {formatAmount(summary.totalBudget)}
                        </AppText>
                      </View>
                      <View style={styles.summaryCol}>
                        <AppText variant="caption" muted>
                          {t('budget.total_spent')}
                        </AppText>
                        <AppText variant="bodyStrong">
                          {formatAmount(summary.totalSpent)}
                        </AppText>
                      </View>
                      <View style={styles.summaryCol}>
                        <AppText variant="caption" muted>
                          {t('budget.remaining')}
                        </AppText>
                        <AppText
                          variant="bodyStrong"
                          color={
                            summary.remaining < 0 ? theme.colors.danger : theme.colors.income
                          }
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
                        backgroundColor: `${theme.colors.danger}18`,
                        borderColor: theme.colors.danger,
                        borderRadius: theme.radius.control,
                        padding: theme.spacing.md,
                        gap: theme.spacing.sm,
                      },
                    ]}
                  >
                    <Feather name="alert-triangle" size={18} color={theme.colors.danger} />
                    <AppText variant="caption" color={theme.colors.danger} style={{ flex: 1 }}>
                      {t('budget.almost_exceeded')}
                    </AppText>
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
                <Card>
                  <View style={styles.itemHeader}>
                    <CategoryChip name={item.category.name} color={item.category.color} />
                    <View style={[styles.itemActions, { gap: theme.spacing.xs }]}>
                      <Badge
                        label={t(`budget.status.${item.status}`)}
                        variant={getStatusBadgeVariant(item.status)}
                      />
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => openEditModal(item)}
                        style={[
                          styles.iconBtn,
                          {
                            minWidth: theme.sizes.touchTarget,
                            minHeight: theme.sizes.touchTarget,
                          },
                        ]}
                      >
                        <Feather name="edit-2" size={17} color={theme.colors.textMuted} />
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => setDeletingBudget(item)}
                        style={[
                          styles.iconBtn,
                          {
                            minWidth: theme.sizes.touchTarget,
                            minHeight: theme.sizes.touchTarget,
                          },
                        ]}
                      >
                        <Feather name="trash-2" size={17} color={theme.colors.danger} />
                      </Pressable>
                    </View>
                  </View>

                  <ProgressBar percentage={item.percentage} color={statusColor} />

                  <View style={styles.itemNumbersRow}>
                    <View>
                      <AppText variant="caption" muted>
                        {t('budget.total_spent')} / {t('budget.total_budget')}
                      </AppText>
                      <AppText variant="bodyStrong">
                        {formatAmount(item.spentAmount)} / {formatAmount(item.budgetAmount)} (
                        {Math.round(item.percentage)}%)
                      </AppText>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <AppText variant="caption" muted>
                        {t('budget.remaining')}
                      </AppText>
                      <AppText
                        variant="bodyStrong"
                        color={isNegativeRemaining ? theme.colors.danger : theme.colors.text}
                      >
                        {formatAmount(item.remaining)}
                      </AppText>
                    </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCol: {
    flex: 1,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
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
  iconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemNumbersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
