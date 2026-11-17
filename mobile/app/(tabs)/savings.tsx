import { useState } from 'react';
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
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { SkeletonList } from '@/components/ui/Skeleton';
import { TextField } from '@/components/ui/TextField';
import { useToast } from '@/components/ui/Toast';
import { usePreferences } from '@/context/PreferencesContext';
import { useCurrencies } from '@/hooks/useCurrencies';
import {
  useCreateSavingsDeposit,
  useCreateSavingsGoal,
  useCreateSavingsWithdrawal,
  useDeleteSavingsDeposit,
  useDeleteSavingsGoal,
  useSavingsGoalDetail,
  useSavingsGoals,
  useUpdateSavingsGoal,
} from '@/hooks/useSavings';
import { useTranslation } from '@/i18n/useTranslation';
import {
  savingsDepositFormSchema,
  savingsGoalFormSchema,
  savingsWithdrawalFormSchema,
  type SavingsDepositFormValues,
  type SavingsGoalFormValues,
  type SavingsWithdrawalFormValues,
} from '@/schemas/savings';
import { useTheme } from '@/theme/useTheme';
import {
  ApiError,
  type DepositExceedsTargetDetails,
  type SavingsEntry,
  type SavingsGoal,
  type SavingsGoalStatus,
} from '@/types/api';
import {
  formatDateDisplay,
  getMaxWibDateForPicker,
  getTodayWibString,
} from '@/utils/format';

export default function SavingsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { language } = usePreferences();
  const { formatAmount, rates } = useCurrencies();
  const { showToast } = useToast();

  const savingsQuery = useSavingsGoals();
  const createGoalMutation = useCreateSavingsGoal();
  const updateGoalMutation = useUpdateSavingsGoal();
  const deleteGoalMutation = useDeleteSavingsGoal();
  const depositMutation = useCreateSavingsDeposit();
  const deleteDepositMutation = useDeleteSavingsDeposit();
  const withdrawMutation = useCreateSavingsWithdrawal();

  // Goal Create/Edit modal state
  const [goalSheetOpen, setGoalSheetOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [goalFormError, setGoalFormError] = useState<string | null>(null);

  // Deposit modal state
  const [depositGoal, setDepositGoal] = useState<SavingsGoal | null>(null);
  const [depositFormError, setDepositFormError] = useState<string | null>(null);

  // Withdraw modal state (SAV-08, BR-13)
  const [withdrawGoal, setWithdrawGoal] = useState<SavingsGoal | null>(null);
  const [withdrawFormError, setWithdrawFormError] = useState<string | null>(null);

  // Delete confirmation state
  const [deletingGoal, setDeletingGoal] = useState<SavingsGoal | null>(null);

  // Goal Detail & Deposit History BottomSheet state (SAV-03, SAV-07)
  const [detailGoalId, setDetailGoalId] = useState<string | undefined>(undefined);
  const [deletingEntry, setDeletingEntry] = useState<SavingsEntry | null>(null);
  const goalDetailQuery = useSavingsGoalDetail(detailGoalId);

  const goalForm = useForm<SavingsGoalFormValues>({
    resolver: zodResolver(savingsGoalFormSchema),
    defaultValues: {
      title: '',
      targetAmount: 0,
      deadline: '',
    },
  });

  const watchedDeadline = useWatch({ control: goalForm.control, name: 'deadline' });

  const depositForm = useForm<SavingsDepositFormValues>({
    resolver: zodResolver(savingsDepositFormSchema),
    defaultValues: {
      amount: 0,
      depositDate: getTodayWibString(),
      note: '',
    },
  });

  const withdrawForm = useForm<SavingsWithdrawalFormValues>({
    resolver: zodResolver(savingsWithdrawalFormSchema),
    defaultValues: {
      amount: 0,
      depositDate: getTodayWibString(),
      note: '',
    },
  });

  const goals = savingsQuery.data?.items ?? [];
  const summary = savingsQuery.data?.summary;

  const getStatusBadgeVariant = (status: SavingsGoalStatus): BadgeVariant => {
    if (status === 'completed') return 'success';
    if (status === 'almost_done') return 'warning';
    return 'primary';
  };

  const getStatusColor = (status: SavingsGoalStatus): string => {
    if (status === 'completed') return theme.colors.income;
    if (status === 'almost_done') return theme.colors.warning;
    return theme.colors.primary;
  };

  const getStatusLabel = (status: SavingsGoalStatus): string => {
    if (status === 'completed') return t('savings.completed');
    if (status === 'almost_done') return t('savings.almost_done');
    return t('savings.in_progress');
  };

  const openCreateGoalModal = () => {
    setEditingGoal(null);
    setGoalFormError(null);
    goalForm.reset({
      title: '',
      targetAmount: 0,
      deadline: '',
    });
    setGoalSheetOpen(true);
  };

  const openEditGoalModal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setGoalFormError(null);
    goalForm.reset({
      title: goal.title,
      targetAmount: goal.targetAmount,
      deadline: goal.deadline ? goal.deadline.slice(0, 10) : '',
    });
    setGoalSheetOpen(true);
  };

  const openDepositModal = (goal: SavingsGoal) => {
    setDepositGoal(goal);
    setDepositFormError(null);
    depositForm.reset({
      amount: 0,
      depositDate: getTodayWibString(),
      note: '',
    });
  };

  const openWithdrawModal = (goal: SavingsGoal) => {
    setWithdrawGoal(goal);
    setWithdrawFormError(null);
    withdrawForm.reset({
      amount: 0,
      depositDate: getTodayWibString(),
      note: '',
    });
  };

  const onSubmitGoal = async (values: SavingsGoalFormValues) => {
    setGoalFormError(null);
    if (editingGoal && values.targetAmount < editingGoal.currentAmount) {
      setGoalFormError(t('errors.TARGET_BELOW_SAVED'));
      return;
    }

    const cleanDeadline = values.deadline && values.deadline.trim() !== '' ? values.deadline.trim() : null;

    try {
      if (editingGoal) {
        await updateGoalMutation.mutateAsync({
          id: editingGoal.id,
          input: {
            title: values.title.trim(),
            targetAmount: values.targetAmount,
            deadline: cleanDeadline,
          },
        });
        showToast(t('savings.updated_toast'), 'success');
      } else {
        await createGoalMutation.mutateAsync({
          title: values.title.trim(),
          targetAmount: values.targetAmount,
          deadline: cleanDeadline ?? undefined,
        });
        showToast(t('savings.created_toast'), 'success');
      }
      setGoalSheetOpen(false);
    } catch (err) {
      if (err instanceof ApiError) {
        const translated = t(`errors.${err.code}`);
        setGoalFormError(translated !== `errors.${err.code}` ? translated : err.message);
      } else {
        setGoalFormError(t('errors.UNKNOWN'));
      }
    }
  };

  const onSubmitDeposit = async (values: SavingsDepositFormValues) => {
    if (!depositGoal) return;
    setDepositFormError(null);

    if (values.amount > depositGoal.remaining) {
      setDepositFormError(
        t('savings.exceeds_remaining', { remaining: formatAmount(depositGoal.remaining) }),
      );
      return;
    }

    const cleanNote = values.note && values.note.trim() !== '' ? values.note.trim() : undefined;

    try {
      await depositMutation.mutateAsync({
        goalId: depositGoal.id,
        input: {
          amount: values.amount,
          depositDate: values.depositDate,
          note: cleanNote,
        },
      });
      setDepositGoal(null);
      showToast(t('savings.deposit_toast'), 'success');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'DEPOSIT_EXCEEDS_TARGET') {
          const details = err.details as DepositExceedsTargetDetails | undefined;
          const remainingVal =
            typeof details?.remaining === 'number' ? details.remaining : depositGoal.remaining;
          setDepositFormError(
            t('savings.exceeds_remaining', { remaining: formatAmount(remainingVal) }),
          );
          return;
        }
        const translated = t(`errors.${err.code}`);
        setDepositFormError(translated !== `errors.${err.code}` ? translated : err.message);
      } else {
        setDepositFormError(t('errors.UNKNOWN'));
      }
    }
  };

  const onSubmitWithdraw = async (values: SavingsWithdrawalFormValues) => {
    if (!withdrawGoal) return;
    setWithdrawFormError(null);

    if (values.amount > withdrawGoal.currentAmount) {
      setWithdrawFormError(
        t('savings.exceeds_saved', { saved: formatAmount(withdrawGoal.currentAmount) }),
      );
      return;
    }

    const cleanNote = values.note && values.note.trim() !== '' ? values.note.trim() : undefined;

    try {
      await withdrawMutation.mutateAsync({
        goalId: withdrawGoal.id,
        input: {
          amount: values.amount,
          depositDate: values.depositDate,
          note: cleanNote,
        },
      });
      setWithdrawGoal(null);
      showToast(t('savings.withdraw_toast'), 'success');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'WITHDRAWAL_EXCEEDS_SAVED') {
          setWithdrawFormError(
            t('savings.exceeds_saved', { saved: formatAmount(withdrawGoal.currentAmount) }),
          );
          return;
        }
        const translated = t(`errors.${err.code}`);
        setWithdrawFormError(translated !== `errors.${err.code}` ? translated : err.message);
      } else {
        setWithdrawFormError(t('errors.UNKNOWN'));
      }
    }
  };

  const handleConfirmDeleteGoal = async () => {
    if (!deletingGoal) return;
    const target = deletingGoal;
    try {
      await deleteGoalMutation.mutateAsync(target.id);
      setDeletingGoal(null);
      if (detailGoalId === target.id) {
        setDetailGoalId(undefined);
      }
      showToast(t('savings.deleted_toast'), 'success');
    } catch (err) {
      setDeletingGoal(null);
      if (err instanceof ApiError) {
        showToast(err.message, 'error');
      } else {
        showToast(t('errors.UNKNOWN'), 'error');
      }
    }
  };

  const handleConfirmDeleteDeposit = async () => {
    if (!detailGoalId || !deletingEntry) return;
    try {
      await deleteDepositMutation.mutateAsync({
        goalId: detailGoalId,
        entryId: deletingEntry.id,
      });
      setDeletingEntry(null);
      showToast(t('savings.deposit_deleted_toast'), 'success');
    } catch (err) {
      setDeletingEntry(null);
      if (err instanceof ApiError) {
        showToast(err.message, 'error');
      } else {
        showToast(t('errors.UNKNOWN'), 'error');
      }
    }
  };

  const isGoalSaving = createGoalMutation.isPending || updateGoalMutation.isPending;

  const summaryProgressColor = summary
    ? summary.percentage >= 100
      ? theme.colors.income
      : summary.percentage >= 80
        ? theme.colors.warning
        : theme.colors.primary
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
        {/* Header (aligned consistently with Transactions & Budget screens) */}
        <View style={[styles.headerRow, { gap: theme.spacing.md }]}>
          <View style={{ flex: 1 }}>
            <AppText variant="title">{t('savings.title')}</AppText>
            <AppText variant="caption" muted numberOfLines={1}>
              {t('savings.subtitle')}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.add')}
            onPress={openCreateGoalModal}
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

        {savingsQuery.isLoading ? (
          <SkeletonList count={4} itemHeight={130} />
        ) : savingsQuery.isError ? (
          <ErrorState
            message={savingsQuery.error.message}
            onRetry={() => void savingsQuery.refetch()}
          />
        ) : (
          <FlatList
            data={goals}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              gap: theme.spacing.md,
              paddingBottom: 96,
              flexGrow: 1,
            }}
            refreshControl={
              <RefreshControl
                refreshing={savingsQuery.isRefetching && !savingsQuery.isLoading}
                onRefresh={() => void savingsQuery.refetch()}
                tintColor={theme.colors.primary}
              />
            }
            ListHeaderComponent={
              summary ? (
                <View style={{ gap: theme.spacing.md }}>
                  {/* Total Savings Progress Summary Card (SAV-04, BR-15) */}
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
                              backgroundColor: `${summaryProgressColor}15`,
                              borderRadius: theme.radius.control,
                            },
                          ]}
                        >
                          <Feather name="award" size={18} color={summaryProgressColor} />
                        </View>
                        <AppText variant="subtitle" style={{ flex: 1 }} numberOfLines={1}>
                          {t('savings.progress')}
                        </AppText>
                      </View>
                      <View
                        style={[
                          styles.percentPill,
                          {
                            backgroundColor: `${summaryProgressColor}15`,
                            borderRadius: theme.radius.full,
                            paddingHorizontal: theme.spacing.sm + 2,
                            paddingVertical: 4,
                          },
                        ]}
                      >
                        <AppText variant="caption" color={summaryProgressColor} style={{ fontWeight: '700' }}>
                          {Math.round(summary.percentage)}%
                        </AppText>
                      </View>
                    </View>

                    <ProgressBar percentage={summary.percentage} color={summaryProgressColor} />

                    {/* 2 Soft Metric Boxes: Total Saved & Total Target */}
                    <View style={[styles.summaryGrid, { gap: theme.spacing.sm }]}>
                      <View
                        style={[
                          styles.metricBox,
                          {
                            backgroundColor: `${theme.colors.income}10`,
                            borderColor: `${theme.colors.income}30`,
                            borderRadius: theme.radius.control,
                            padding: theme.spacing.sm + 2,
                          },
                        ]}
                      >
                        <AppText variant="caption" muted numberOfLines={1}>
                          {t('savings.total_saved')}
                        </AppText>
                        <AppText
                          variant="bodyStrong"
                          color={theme.colors.income}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                        >
                          {formatAmount(summary.totalSaved)}
                        </AppText>
                      </View>

                      <View
                        style={[
                          styles.metricBox,
                          {
                            backgroundColor: theme.colors.surfaceAlt,
                            borderColor: theme.colors.border,
                            borderRadius: theme.radius.control,
                            padding: theme.spacing.sm + 2,
                          },
                        ]}
                      >
                        <AppText variant="caption" muted numberOfLines={1}>
                          {t('savings.total_target')}
                        </AppText>
                        <AppText
                          variant="bodyStrong"
                          numberOfLines={1}
                          adjustsFontSizeToFit
                        >
                          {formatAmount(summary.totalTarget)}
                        </AppText>
                      </View>
                    </View>
                  </Card>

                  {/* Section Divider Bar between Summary Card and Goal Item Cards */}
                  {goals.length > 0 ? (
                    <View style={[styles.sectionDividerBar, { paddingHorizontal: 4 }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
                        <AppText variant="bodyStrong" color={theme.colors.textMuted}>
                          {t('savings.title')}
                        </AppText>
                        <Badge label={String(goals.length)} variant="neutral" />
                      </View>
                    </View>
                  ) : null}
                </View>
              ) : null
            }
            ListEmptyComponent={
              <EmptyState
                icon="award"
                title={t('savings.no_goals')}
                subtitle={t('savings.no_goals_subtitle')}
                actionLabel={t('savings.add_first')}
                onAction={openCreateGoalModal}
              />
            }
            renderItem={({ item }) => {
              const isCompleted = item.status === 'completed' || item.percentage >= 100;
              const statusColor = getStatusColor(item.status);
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
                  {/* Goal Header Row */}
                  <View style={[styles.goalHeaderRow, { gap: theme.spacing.sm }]}>
                    <View
                      style={[
                        styles.goalIconBox,
                        {
                          backgroundColor: `${statusColor}14`,
                          borderRadius: theme.radius.control,
                        },
                      ]}
                    >
                      <Feather
                        name={isCompleted ? 'check-circle' : 'target'}
                        size={19}
                        color={statusColor}
                      />
                    </View>

                    <View style={{ flex: 1, gap: 3 }}>
                      <AppText variant="subtitle" numberOfLines={1}>
                        {item.title}
                      </AppText>
                      {item.deadline ? (
                        <View style={[styles.deadlineRow, { gap: 5 }]}>
                          <Feather name="calendar" size={12} color={theme.colors.textMuted} />
                          <AppText variant="caption" muted numberOfLines={1}>
                            {t('savings.deadline_label')}:{' '}
                            {formatDateDisplay(item.deadline, language)}
                          </AppText>
                        </View>
                      ) : null}
                    </View>

                    <View style={[styles.actionsRow, { gap: theme.spacing.xs }]}>
                      <Badge
                        label={getStatusLabel(item.status)}
                        variant={getStatusBadgeVariant(item.status)}
                      />
                      <Pressable
                        accessibilityRole="button"
                        hitSlop={8}
                        onPress={() => openEditGoalModal(item)}
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
                        onPress={() => setDeletingGoal(item)}
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

                  {/* Saved / Target & Remaining Row */}
                  <View style={[styles.summaryNumbersRow, { gap: theme.spacing.sm }]}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <AppText variant="caption" muted>
                        {t('savings.current')} / {t('savings.target')}
                      </AppText>
                      <AppText variant="bodyStrong" numberOfLines={1} adjustsFontSizeToFit>
                        {formatAmount(item.currentAmount)} / {formatAmount(item.targetAmount)} (
                        {Math.round(item.percentage)}%)
                      </AppText>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 2 }}>
                      <AppText variant="caption" muted>
                        {t('savings.remaining')}
                      </AppText>
                      <AppText
                        variant="bodyStrong"
                        color={isCompleted ? theme.colors.income : theme.colors.text}
                      >
                        {formatAmount(item.remaining)}
                      </AppText>
                    </View>
                  </View>

                  {/* Footer Actions: History, Withdraw & Deposit Buttons (BR-13, SAV-07, SAV-08) */}
                  <View
                    style={[
                      styles.cardFooter,
                      {
                        paddingTop: theme.spacing.sm,
                        borderTopColor: theme.colors.border,
                        gap: theme.spacing.sm,
                      },
                    ]}
                  >
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setDetailGoalId(item.id)}
                      style={({ pressed }) => [
                        styles.softActionBtn,
                        {
                          borderRadius: theme.radius.control,
                          backgroundColor: theme.colors.surfaceAlt,
                          borderColor: theme.colors.border,
                          opacity: pressed ? 0.8 : 1,
                          gap: 5,
                        },
                      ]}
                    >
                      <Feather name="clock" size={14} color={theme.colors.textMuted} />
                      <AppText variant="caption" color={theme.colors.text} style={{ fontWeight: '600' }}>
                        {t('savings.history')}
                      </AppText>
                    </Pressable>

                    {item.currentAmount > 0 ? (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => openWithdrawModal(item)}
                        style={({ pressed }) => [
                          styles.softActionBtn,
                          {
                            borderRadius: theme.radius.control,
                            backgroundColor: `${theme.colors.warning}12`,
                            borderColor: `${theme.colors.warning}30`,
                            opacity: pressed ? 0.8 : 1,
                            gap: 5,
                          },
                        ]}
                      >
                        <Feather name="arrow-up-right" size={14} color={theme.colors.warning} />
                        <AppText variant="caption" color={theme.colors.warning} style={{ fontWeight: '700' }}>
                          {t('savings.withdraw')}
                        </AppText>
                      </Pressable>
                    ) : null}

                    <Pressable
                      accessibilityRole="button"
                      disabled={isCompleted}
                      onPress={() => openDepositModal(item)}
                      style={({ pressed }) => [
                        styles.softActionBtn,
                        {
                          borderRadius: theme.radius.control,
                          backgroundColor: isCompleted
                            ? `${theme.colors.income}14`
                            : `${theme.colors.primary}14`,
                          borderColor: isCompleted
                            ? `${theme.colors.income}30`
                            : `${theme.colors.primary}30`,
                          opacity: isCompleted ? 0.75 : pressed ? 0.8 : 1,
                          gap: 5,
                        },
                      ]}
                    >
                      <Feather
                        name={isCompleted ? 'check' : 'plus-circle'}
                        size={14}
                        color={isCompleted ? theme.colors.income : theme.colors.primary}
                      />
                      <AppText
                        variant="caption"
                        color={isCompleted ? theme.colors.income : theme.colors.primary}
                        style={{ fontWeight: '700' }}
                      >
                        {isCompleted ? t('savings.completed') : t('savings.deposit')}
                      </AppText>
                    </Pressable>
                  </View>
                </Card>
              );
            }}
          />
        )}
      </View>

      {/* Add / Edit Savings Goal Bottom Sheet (SAV-01, BR-13) */}
      <BottomSheet
        visible={goalSheetOpen}
        onClose={() => setGoalSheetOpen(false)}
        title={editingGoal ? t('savings.edit') : t('savings.add')}
      >
        <View style={{ gap: theme.spacing.md }}>
          {goalFormError ? (
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
                {goalFormError}
              </AppText>
            </View>
          ) : null}

          <Controller
            control={goalForm.control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label={t('savings.goal_title')}
                placeholder={t('savings.goal_title_placeholder')}
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={
                  goalForm.formState.errors.title?.message
                    ? t(goalForm.formState.errors.title.message)
                    : undefined
                }
              />
            )}
          />

          <Controller
            control={goalForm.control}
            name="targetAmount"
            render={({ field: { onChange, value } }) => (
              <AmountField
                label={t('savings.target_amount')}
                value={value}
                onChangeValue={onChange}
                rates={rates}
                error={
                  goalForm.formState.errors.targetAmount?.message
                    ? t(goalForm.formState.errors.targetAmount.message)
                    : undefined
                }
              />
            )}
          />

          <Controller
            control={goalForm.control}
            name="deadline"
            render={({ field: { onChange, value } }) => (
              <View style={{ gap: theme.spacing.xs }}>
                <DatePickerField
                  label={t('savings.deadline')}
                  value={value ?? ''}
                  onChange={onChange}
                  disableMaxDate
                  allowClear
                  error={
                    goalForm.formState.errors.deadline?.message
                      ? t(goalForm.formState.errors.deadline.message)
                      : undefined
                  }
                />
                {watchedDeadline ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => goalForm.setValue('deadline', '')}
                    style={{ alignSelf: 'flex-end', paddingVertical: theme.spacing.xs }}
                  >
                    <AppText variant="caption" color={theme.colors.primary}>
                      {t('savings.clear_deadline')}
                    </AppText>
                  </Pressable>
                ) : null}
              </View>
            )}
          />

          <View style={[styles.sheetButtons, { gap: theme.spacing.sm }]}>
            <View style={{ flex: 1 }}>
              <Button
                variant="secondary"
                label={t('common.cancel')}
                disabled={isGoalSaving}
                onPress={() => setGoalSheetOpen(false)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label={t('common.save')}
                loading={isGoalSaving}
                onPress={goalForm.handleSubmit(onSubmitGoal)}
              />
            </View>
          </View>
        </View>
      </BottomSheet>

      {/* Deposit Bottom Sheet (SAV-02, SAV-06, BR-13) */}
      <BottomSheet
        visible={Boolean(depositGoal)}
        onClose={() => setDepositGoal(null)}
        title={t('savings.deposit_title')}
      >
        {depositGoal ? (
          <View style={{ gap: theme.spacing.md }}>
            {/* Remaining Target Info Box */}
            <View
              style={[
                styles.remainingBox,
                {
                  backgroundColor: theme.colors.surfaceAlt,
                  borderRadius: theme.radius.control,
                  padding: theme.spacing.md,
                  gap: theme.spacing.xs,
                },
              ]}
            >
              <AppText variant="bodyStrong">{depositGoal.title}</AppText>
              <View style={styles.summaryNumbersRow}>
                <AppText variant="caption" muted>
                  {t('savings.remaining')}:
                </AppText>
                <AppText variant="bodyStrong" color={theme.colors.primary}>
                  {formatAmount(depositGoal.remaining)}
                </AppText>
              </View>
            </View>

            {depositFormError ? (
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
                  {depositFormError}
                </AppText>
              </View>
            ) : null}

            <Controller
              control={depositForm.control}
              name="amount"
              render={({ field: { onChange, value } }) => (
                <AmountField
                  label={t('savings.deposit_amount')}
                  value={value}
                  onChangeValue={onChange}
                  rates={rates}
                  error={
                    depositForm.formState.errors.amount?.message
                      ? t(depositForm.formState.errors.amount.message)
                      : undefined
                  }
                />
              )}
            />

            <Controller
              control={depositForm.control}
              name="depositDate"
              render={({ field: { onChange, value } }) => (
                <DatePickerField
                  label={t('savings.deposit_date')}
                  value={value}
                  onChange={onChange}
                  maximumDate={getMaxWibDateForPicker()}
                  error={
                    depositForm.formState.errors.depositDate?.message
                      ? t(depositForm.formState.errors.depositDate.message)
                      : undefined
                  }
                />
              )}
            />

            <Controller
              control={depositForm.control}
              name="note"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label={t('savings.deposit_note')}
                  placeholder={t('savings.deposit_note_placeholder')}
                  value={value ?? ''}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={
                    depositForm.formState.errors.note?.message
                      ? t(depositForm.formState.errors.note.message)
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
                  disabled={depositMutation.isPending}
                  onPress={() => setDepositGoal(null)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label={t('savings.deposit')}
                  loading={depositMutation.isPending}
                  onPress={depositForm.handleSubmit(onSubmitDeposit)}
                />
              </View>
            </View>
          </View>
        ) : null}
      </BottomSheet>

      {/* Withdraw Bottom Sheet (SAV-08, BR-13) */}
      <BottomSheet
        visible={Boolean(withdrawGoal)}
        onClose={() => setWithdrawGoal(null)}
        title={t('savings.withdraw_title')}
      >
        {withdrawGoal ? (
          <View style={{ gap: theme.spacing.md }}>
            <View
              style={[
                styles.remainingBox,
                {
                  backgroundColor: theme.colors.surfaceAlt,
                  borderRadius: theme.radius.control,
                  padding: theme.spacing.md,
                  gap: theme.spacing.xs,
                },
              ]}
            >
              <AppText variant="bodyStrong">{withdrawGoal.title}</AppText>
              <View style={styles.summaryNumbersRow}>
                <AppText variant="caption" muted>
                  {t('savings.current_saved')}:
                </AppText>
                <AppText variant="bodyStrong" color={theme.colors.income}>
                  {formatAmount(withdrawGoal.currentAmount)}
                </AppText>
              </View>
              <AppText variant="caption" muted>
                {t('savings.withdraw_notice')}
              </AppText>
            </View>

            {withdrawFormError ? (
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
                  {withdrawFormError}
                </AppText>
              </View>
            ) : null}

            <Controller
              control={withdrawForm.control}
              name="amount"
              render={({ field: { onChange, value } }) => (
                <AmountField
                  label={t('savings.withdraw_amount')}
                  value={value}
                  onChangeValue={onChange}
                  rates={rates}
                  error={
                    withdrawForm.formState.errors.amount?.message
                      ? t(withdrawForm.formState.errors.amount.message)
                      : undefined
                  }
                />
              )}
            />

            <Controller
              control={withdrawForm.control}
              name="depositDate"
              render={({ field: { onChange, value } }) => (
                <DatePickerField
                  label={t('savings.withdraw_date')}
                  value={value}
                  onChange={onChange}
                  maximumDate={getMaxWibDateForPicker()}
                  error={
                    withdrawForm.formState.errors.depositDate?.message
                      ? t(withdrawForm.formState.errors.depositDate.message)
                      : undefined
                  }
                />
              )}
            />

            <Controller
              control={withdrawForm.control}
              name="note"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label={t('savings.deposit_note')}
                  placeholder={t('savings.withdraw_note_placeholder')}
                  value={value ?? ''}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={
                    withdrawForm.formState.errors.note?.message
                      ? t(withdrawForm.formState.errors.note.message)
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
                  disabled={withdrawMutation.isPending}
                  onPress={() => setWithdrawGoal(null)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label={t('savings.withdraw')}
                  loading={withdrawMutation.isPending}
                  onPress={withdrawForm.handleSubmit(onSubmitWithdraw)}
                />
              </View>
            </View>
          </View>
        ) : null}
      </BottomSheet>

      {/* Goal Detail & Deposit History BottomSheet (SAV-03, SAV-07) */}
      <BottomSheet
        visible={Boolean(detailGoalId)}
        onClose={() => setDetailGoalId(undefined)}
        title={goalDetailQuery.data?.title ?? t('savings.history')}
      >
        {goalDetailQuery.isLoading ? (
          <SkeletonList count={3} itemHeight={64} />
        ) : goalDetailQuery.isError ? (
          <ErrorState
            message={goalDetailQuery.error.message}
            onRetry={() => void goalDetailQuery.refetch()}
          />
        ) : goalDetailQuery.data ? (
          <View style={{ gap: theme.spacing.md }}>
            <View
              style={[
                styles.remainingBox,
                {
                  backgroundColor: theme.colors.surfaceAlt,
                  borderRadius: theme.radius.control,
                  padding: theme.spacing.md,
                  gap: theme.spacing.xs,
                },
              ]}
            >
              <View style={styles.summaryNumbersRow}>
                <AppText variant="caption" muted>
                  {t('savings.current')} / {t('savings.target')}
                </AppText>
                <AppText variant="bodyStrong">
                  {Math.round(goalDetailQuery.data.percentage)}%
                </AppText>
              </View>
              <ProgressBar
                percentage={goalDetailQuery.data.percentage}
                color={getStatusColor(goalDetailQuery.data.status)}
              />
              <AppText variant="bodyStrong">
                {formatAmount(goalDetailQuery.data.currentAmount)} /{' '}
                {formatAmount(goalDetailQuery.data.targetAmount)}
              </AppText>
            </View>

            <AppText variant="bodyStrong">{t('savings.history')}</AppText>

            {goalDetailQuery.data.entries.length === 0 ? (
              <EmptyState icon="inbox" title={t('savings.no_deposits')} />
            ) : (
              <View style={{ gap: theme.spacing.xs }}>
                {goalDetailQuery.data.entries.map((entry) => {
                  const isWithdrawal = entry.entryType === 'withdrawal';
                  return (
                    <View
                      key={entry.id}
                      style={[
                        styles.entryRow,
                        {
                          borderColor: theme.colors.border,
                          backgroundColor: theme.colors.surface,
                          borderRadius: theme.radius.control,
                          padding: theme.spacing.md,
                          gap: theme.spacing.sm,
                        },
                      ]}
                    >
                      <View style={{ flex: 1, gap: 2 }}>
                        <AppText
                          variant="bodyStrong"
                          color={isWithdrawal ? theme.colors.danger : theme.colors.income}
                        >
                          {isWithdrawal ? '-' : '+'} {formatAmount(entry.amount)}
                        </AppText>
                        <AppText variant="caption" muted>
                          {formatDateDisplay(entry.depositDate, language)}
                        </AppText>
                        {entry.note ? (
                          <AppText variant="caption">{entry.note}</AppText>
                        ) : null}
                      </View>
                      {!isWithdrawal ? (
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => setDeletingEntry(entry)}
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
                      ) : null}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ) : null}
      </BottomSheet>

      {/* Delete Deposit Confirmation (SAV-03) */}
      <ConfirmDialog
        visible={Boolean(deletingEntry)}
        title={t('savings.delete_deposit_title')}
        message={t('savings.delete_deposit_confirm')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        danger
        loading={deleteDepositMutation.isPending}
        onCancel={() => setDeletingEntry(null)}
        onConfirm={() => void handleConfirmDeleteDeposit()}
      />

      {/* Delete Goal Confirmation */}
      <ConfirmDialog
        visible={Boolean(deletingGoal)}
        title={t('savings.delete')}
        message={t('savings.confirm_delete', { title: deletingGoal?.title ?? '' })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        danger
        loading={deleteGoalMutation.isPending}
        onCancel={() => setDeletingGoal(null)}
        onConfirm={() => void handleConfirmDeleteGoal()}
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
  sectionDividerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryNumbersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalIconBox: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  softActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 8,
    borderWidth: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  remainingBox: {
    width: '100%',
  },
  sheetButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
});
