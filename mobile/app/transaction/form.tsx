import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Feather } from '@expo/vector-icons';
import { AmountField } from '@/components/ui/AmountField';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { Select, type SelectOption } from '@/components/ui/Select';
import { SkeletonList } from '@/components/ui/Skeleton';
import { TextField } from '@/components/ui/TextField';
import { useToast } from '@/components/ui/Toast';
import { usePreferences } from '@/context/PreferencesContext';
import { useCategories } from '@/hooks/useCategories';
import { useCurrencies } from '@/hooks/useCurrencies';
import {
  useCreateTransaction,
  useDeleteTransaction,
  useTransactionDetail,
  useUpdateTransaction,
} from '@/hooks/useTransactions';
import { useTranslation } from '@/i18n/useTranslation';
import {
  transactionFormSchema,
  type TransactionFormValues,
} from '@/schemas/transaction';
import { useTheme } from '@/theme/useTheme';
import { ApiError, type CategoryType } from '@/types/api';
import { formatDateDisplay, getTodayWibString } from '@/utils/format';

export default function TransactionFormScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { language } = usePreferences();
  const { rates, formatAmount } = useCurrencies();
  const params = useLocalSearchParams<{ id?: string }>();
  const transactionId = typeof params.id === 'string' && params.id.length > 0 ? params.id : undefined;
  const isEditMode = Boolean(transactionId);

  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const detailQuery = useTransactionDetail(transactionId);
  const categoriesQuery = useCategories();
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: 'expense',
      categoryId: '',
      amount: 0,
      transactionDate: getTodayWibString(),
      description: '',
    },
  });

  const selectedType = useWatch({ control, name: 'type' });
  const selectedCategoryId = useWatch({ control, name: 'categoryId' });
  const watchedAmount = useWatch({ control, name: 'amount' });
  const watchedDate = useWatch({ control, name: 'transactionDate' });

  // Populate form when editing existing transaction
  useEffect(() => {
    if (!detailQuery.data) return;
    const tx = detailQuery.data;
    reset({
      type: tx.type,
      categoryId: tx.category.id,
      amount: tx.amount,
      transactionDate: tx.transactionDate,
      description: tx.description ?? '',
    });
  }, [detailQuery.data, reset]);

  const categoriesForType = useMemo(
    () => (categoriesQuery.data ?? []).filter((c) => c.type === selectedType),
    [categoriesQuery.data, selectedType],
  );

  const categoryOptions = useMemo<SelectOption[]>(
    () =>
      categoriesForType.map((c) => ({
        value: c.id,
        label: c.name,
        color: c.color,
      })),
    [categoriesForType],
  );

  // Ensure categoryId always matches selectedType (BR-06)
  useEffect(() => {
    if (!categoriesQuery.data || categoriesForType.length === 0) return;
    const existsInType = categoriesForType.some((c) => c.id === selectedCategoryId);
    if (!existsInType) {
      setValue('categoryId', categoriesForType[0]?.id ?? '');
    }
  }, [categoriesQuery.data, categoriesForType, selectedCategoryId, setValue]);

  const handleTypeChange = (nextType: CategoryType) => {
    setValue('type', nextType, { shouldValidate: true });
    const matching = (categoriesQuery.data ?? []).filter((c) => c.type === nextType);
    setValue('categoryId', matching[0]?.id ?? '', { shouldValidate: true });
  };

  const onSubmit = async (values: TransactionFormValues) => {
    setServerError(null);
    const trimmedDesc = values.description?.trim();
    const payload = {
      type: values.type,
      categoryId: values.categoryId,
      amount: values.amount,
      transactionDate: values.transactionDate,
      ...(trimmedDesc ? { description: trimmedDesc } : {}),
    };

    try {
      if (isEditMode && transactionId) {
        await updateMutation.mutateAsync({
          id: transactionId,
          input: {
            ...payload,
            description: trimmedDesc ?? '',
          },
        });
        showToast(t('transactions.updated_toast'), 'success');
      } else {
        await createMutation.mutateAsync(payload);
        showToast(t('transactions.created_toast'), 'success');
      }
      router.back();
    } catch (err) {
      if (err instanceof ApiError) {
        const key = `errors.${err.code}`;
        const translated = t(key);
        setServerError(translated !== key ? translated : err.message || t('errors.UNKNOWN'));
      } else {
        setServerError(t('errors.UNKNOWN'));
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!transactionId) return;
    try {
      await deleteMutation.mutateAsync(transactionId);
      setConfirmDeleteOpen(false);
      showToast(t('transactions.deleted_toast'), 'success');
      router.back();
    } catch (err) {
      setConfirmDeleteOpen(false);
      if (err instanceof ApiError) {
        setServerError(err.message || t('errors.UNKNOWN'));
      } else {
        setServerError(t('errors.UNKNOWN'));
      }
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Screen scroll>
        {/* Header */}
        <View style={[styles.headerRow, { gap: theme.spacing.sm }]}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={[
              styles.iconBtn,
              {
                minWidth: theme.sizes.touchTarget,
                minHeight: theme.sizes.touchTarget,
                borderRadius: theme.radius.control,
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Feather name="arrow-left" size={20} color={theme.colors.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <AppText variant="title">
              {isEditMode ? t('transactions.edit') : t('transactions.add')}
            </AppText>
          </View>
          {isEditMode ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setConfirmDeleteOpen(true)}
              style={[
                styles.iconBtn,
                {
                  minWidth: theme.sizes.touchTarget,
                  minHeight: theme.sizes.touchTarget,
                  borderRadius: theme.radius.control,
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.danger,
                },
              ]}
            >
              <Feather name="trash-2" size={18} color={theme.colors.danger} />
            </Pressable>
          ) : null}
        </View>

        {isEditMode && detailQuery.isLoading ? (
          <SkeletonList count={4} itemHeight={56} />
        ) : isEditMode && detailQuery.isError ? (
          <ErrorState
            message={detailQuery.error?.message}
            onRetry={() => void detailQuery.refetch()}
          />
        ) : (
          <>
            {serverError ? (
              <View
                style={[
                  styles.errorBanner,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.danger,
                    borderRadius: theme.radius.control,
                    padding: theme.spacing.md,
                    gap: theme.spacing.sm,
                  },
                ]}
              >
                <Feather name="alert-circle" size={18} color={theme.colors.danger} />
                <AppText color={theme.colors.danger} style={styles.flex}>
                  {serverError}
                </AppText>
              </View>
            ) : null}

            <Card style={{ gap: theme.spacing.md }}>
              {/* Transaction Type Toggle */}
              <View style={{ gap: theme.spacing.xs }}>
                <AppText variant="bodyStrong">{t('transactions.type')}</AppText>
                <View style={[styles.typeRow, { gap: theme.spacing.sm }]}>
                  {(['expense', 'income'] as const).map((typeOpt) => {
                    const active = selectedType === typeOpt;
                    const accent =
                      typeOpt === 'expense' ? theme.colors.expense : theme.colors.income;
                    return (
                      <Pressable
                        key={typeOpt}
                        accessibilityRole="button"
                        onPress={() => handleTypeChange(typeOpt)}
                        style={[
                          styles.typeBtn,
                          {
                            minHeight: theme.sizes.touchTarget,
                            borderRadius: theme.radius.control,
                            borderColor: active ? accent : theme.colors.border,
                            backgroundColor: active
                              ? theme.colors.surfaceAlt
                              : theme.colors.surface,
                          },
                        ]}
                      >
                        <AppText
                          variant="bodyStrong"
                          color={active ? accent : theme.colors.textMuted}
                        >
                          {typeOpt === 'expense'
                            ? t('transactions.expense')
                            : t('transactions.income')}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Nominal (AmountField) */}
              <Controller
                control={control}
                name="amount"
                render={({ field: { onChange, value } }) => (
                  <AmountField
                    label={t('transactions.amount')}
                    value={value}
                    onChangeValue={onChange}
                    rates={rates}
                    error={errors.amount?.message ? t(errors.amount.message) : undefined}
                  />
                )}
              />

              {/* Category Select */}
              <Controller
                control={control}
                name="categoryId"
                render={({ field: { onChange, value } }) => (
                  <View style={{ gap: theme.spacing.xs }}>
                    <Select
                      label={t('transactions.category')}
                      value={value}
                      options={categoryOptions}
                      onChange={onChange}
                      placeholder={t('transactions.select_category')}
                      disabled={categoriesForType.length === 0}
                      error={
                        errors.categoryId?.message ? t(errors.categoryId.message) : undefined
                      }
                    />
                    {!categoriesQuery.isLoading && categoriesForType.length === 0 ? (
                      <View style={{ gap: theme.spacing.xs }}>
                        <AppText variant="caption" color={theme.colors.warning}>
                          {t('transactions.no_categories_for_type')}
                        </AppText>
                        <Button
                          variant="secondary"
                          label={t('transactions.manage_categories')}
                          onPress={() => router.push('/categories')}
                        />
                      </View>
                    ) : null}
                  </View>
                )}
              />

              {/* Transaction Date (max = today WIB) */}
              <Controller
                control={control}
                name="transactionDate"
                render={({ field: { onChange, value } }) => (
                  <DatePickerField
                    label={t('transactions.date')}
                    value={value}
                    onChange={onChange}
                    error={
                      errors.transactionDate?.message
                        ? t(errors.transactionDate.message)
                        : undefined
                    }
                  />
                )}
              />

              {/* Description (optional, max 255) */}
              <Controller
                control={control}
                name="description"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextField
                    label={t('transactions.description')}
                    placeholder={t('transactions.description_placeholder')}
                    value={value ?? ''}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    maxLength={255}
                    error={
                      errors.description?.message
                        ? t(errors.description.message)
                        : undefined
                    }
                  />
                )}
              />

              {/* Pre-Save Transaction Summary (TRX-07) */}
              <View
                style={[
                  styles.summaryBox,
                  {
                    backgroundColor: theme.colors.surfaceAlt,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.control,
                    padding: theme.spacing.md,
                    gap: theme.spacing.xs,
                  },
                ]}
              >
                <AppText variant="bodyStrong">{t('transactions.summary_before_save')}</AppText>
                <View style={styles.summaryRow}>
                  <AppText variant="caption" muted>
                    {t('transactions.type')}
                  </AppText>
                  <AppText
                    variant="bodyStrong"
                    color={
                      selectedType === 'expense' ? theme.colors.expense : theme.colors.income
                    }
                  >
                    {selectedType === 'expense'
                      ? t('transactions.expense')
                      : t('transactions.income')}
                  </AppText>
                </View>
                <View style={styles.summaryRow}>
                  <AppText variant="caption" muted>
                    {t('transactions.category')}
                  </AppText>
                  <AppText variant="bodyStrong">
                    {categoriesForType.find((c) => c.id === selectedCategoryId)?.name ?? '-'}
                  </AppText>
                </View>
                <View style={styles.summaryRow}>
                  <AppText variant="caption" muted>
                    {t('transactions.date')}
                  </AppText>
                  <AppText variant="bodyStrong">
                    {watchedDate ? formatDateDisplay(watchedDate, language) : '-'}
                  </AppText>
                </View>
                <View style={styles.summaryRow}>
                  <AppText variant="caption" muted>
                    {t('transactions.amount')}
                  </AppText>
                  <AppText
                    variant="bodyStrong"
                    color={
                      selectedType === 'expense' ? theme.colors.expense : theme.colors.income
                    }
                  >
                    {formatAmount(watchedAmount || 0)}
                  </AppText>
                </View>
              </View>

              {/* Submit / Cancel Buttons */}
              <View style={[styles.typeRow, { gap: theme.spacing.sm, marginTop: theme.spacing.xs }]}>
                <Button
                  variant="secondary"
                  label={t('transactions.cancel')}
                  disabled={isSaving}
                  onPress={() => router.back()}
                  style={styles.flex}
                />
                <Button
                  label={t('transactions.save')}
                  loading={isSaving}
                  disabled={isSaving}
                  onPress={() => void handleSubmit(onSubmit)()}
                  style={styles.flex}
                />
              </View>
            </Card>
          </>
        )}

        <ConfirmDialog
          visible={confirmDeleteOpen}
          title={t('transactions.delete')}
          message={t('transactions.confirm_delete')}
          confirmLabel={t('common.delete')}
          cancelLabel={t('common.cancel')}
          danger
          loading={deleteMutation.isPending}
          onCancel={() => setConfirmDeleteOpen(false)}
          onConfirm={() => void handleConfirmDelete()}
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  typeRow: {
    flexDirection: 'row',
  },
  typeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  summaryBox: {
    borderWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
});
