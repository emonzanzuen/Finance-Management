import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Feather } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { SkeletonList } from '@/components/ui/Skeleton';
import { TextField } from '@/components/ui/TextField';
import { useToast } from '@/components/ui/Toast';
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '@/hooks/useCategories';
import { useTranslation } from '@/i18n/useTranslation';
import { categoryFormSchema, type CategoryFormValues } from '@/schemas/category';
import { useTheme } from '@/theme/useTheme';
import {
  ApiError,
  type Category,
  type CategoryInUseDetails,
  type CategoryType,
} from '@/types/api';
import { PRESET_CATEGORY_COLORS } from '@/utils/format';

function isCategoryUsed(cat: Category | null): boolean {
  if (!cat) return false;
  if (cat.isUsed) return true;
  if ((cat.usageCount ?? 0) > 0) return true;
  if ((cat.transactionCount ?? 0) + (cat.budgetCount ?? 0) > 0) return true;
  return false;
}

function formatCategoryInUseMessage(
  err: ApiError,
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  const details = err.details;
  if (typeof details === 'number' && details > 0) {
    return t('categories.in_use_detail', { count: details });
  }
  if (typeof details === 'object' && details !== null) {
    const d = details as CategoryInUseDetails;
    const txCount = d.transactionCount ?? d.transactions;
    const budCount = d.budgetCount ?? d.budgets;
    if (typeof txCount === 'number' && typeof budCount === 'number') {
      return t('categories.in_use_breakdown', {
        transactions: txCount,
        budgets: budCount,
      });
    }
    const total =
      d.usageCount ??
      d.count ??
      ((typeof txCount === 'number' ? txCount : 0) +
        (typeof budCount === 'number' ? budCount : 0));
    if (typeof total === 'number' && total > 0) {
      return t('categories.in_use_detail', { count: total });
    }
  }
  return t('errors.CATEGORY_IN_USE');
}

export default function CategoriesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<CategoryType>('expense');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [typeLockedByServer, setTypeLockedByServer] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [inUseAlertMessage, setInUseAlertMessage] = useState<string | null>(null);

  const categoriesQuery = useCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const filteredCategories = useMemo(
    () => (categoriesQuery.data ?? []).filter((cat) => cat.type === activeTab),
    [categoriesQuery.data, activeTab],
  );

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      type: 'expense',
      name: '',
      color: PRESET_CATEGORY_COLORS[0],
    },
  });

  const selectedType = useWatch({ control, name: 'type' });
  const selectedColor = useWatch({ control, name: 'color' });
  const isTypeLocked =
    Boolean(editingCategory && isCategoryUsed(editingCategory)) || typeLockedByServer;

  const openCreateModal = () => {
    setEditingCategory(null);
    setTypeLockedByServer(false);
    setFormError(null);
    reset({
      type: activeTab,
      name: '',
      color: PRESET_CATEGORY_COLORS[0],
    });
    setSheetOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setTypeLockedByServer(false);
    setFormError(null);
    reset({
      type: category.type,
      name: category.name,
      color: category.color,
    });
    setSheetOpen(true);
  };

  const onSubmit = async (values: CategoryFormValues) => {
    setFormError(null);
    try {
      if (editingCategory) {
        const payload = isTypeLocked
          ? { name: values.name.trim(), color: values.color }
          : {
              name: values.name.trim(),
              color: values.color,
              ...(values.type !== editingCategory.type ? { type: values.type } : {}),
            };
        await updateMutation.mutateAsync({
          id: editingCategory.id,
          input: payload,
        });
        showToast(t('categories.updated_toast'), 'success');
      } else {
        await createMutation.mutateAsync({
          name: values.name.trim(),
          type: values.type,
          color: values.color,
        });
        showToast(t('categories.created_toast'), 'success');
      }
      setSheetOpen(false);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'CATEGORY_TYPE_LOCKED' && editingCategory) {
          setTypeLockedByServer(true);
          setValue('type', editingCategory.type);
        }
        const key = `errors.${err.code}`;
        const translated = t(key);
        setFormError(translated !== key ? translated : err.message || t('errors.UNKNOWN'));
      } else {
        setFormError(t('errors.UNKNOWN'));
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;
    const target = deletingCategory;
    try {
      await deleteMutation.mutateAsync(target.id);
      setDeletingCategory(null);
      showToast(t('categories.deleted_toast'), 'success');
    } catch (err) {
      setDeletingCategory(null);
      if (err instanceof ApiError && err.code === 'CATEGORY_IN_USE') {
        setInUseAlertMessage(formatCategoryInUseMessage(err, t));
      } else if (err instanceof ApiError) {
        showToast(err.message || t('errors.UNKNOWN'), 'error');
      } else {
        showToast(t('errors.UNKNOWN'), 'error');
      }
    }
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <Screen style={{ flex: 1 }}>
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
          <AppText variant="title">{t('categories.title')}</AppText>
          <AppText variant="caption" muted>
            {t('categories.subtitle')}
          </AppText>
        </View>
        <Button label={t('common.add')} onPress={openCreateModal} />
      </View>

      {/* Expense / Income Segmented Filter */}
      <View
        style={[
          styles.segmented,
          {
            backgroundColor: theme.colors.surfaceAlt,
            borderRadius: theme.radius.control,
            padding: theme.spacing.xs,
            gap: theme.spacing.xs,
          },
        ]}
      >
        {(['expense', 'income'] as const).map((tab) => {
          const active = activeTab === tab;
          const activeColor = tab === 'expense' ? theme.colors.expense : theme.colors.income;
          return (
            <Pressable
              key={tab}
              accessibilityRole="button"
              onPress={() => setActiveTab(tab)}
              style={[
                styles.segmentItem,
                {
                  minHeight: 42,
                  borderRadius: theme.radius.control,
                  backgroundColor: active ? theme.colors.surface : 'transparent',
                  borderColor: active ? activeColor : 'transparent',
                },
              ]}
            >
              <AppText
                variant={active ? 'bodyStrong' : 'body'}
                color={active ? activeColor : theme.colors.textMuted}
              >
                {tab === 'expense'
                  ? t('categories.expense_categories')
                  : t('categories.income_categories')}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {/* Content */}
      {categoriesQuery.isLoading ? (
        <SkeletonList count={5} itemHeight={64} />
      ) : categoriesQuery.isError ? (
        <ErrorState
          message={categoriesQuery.error?.message}
          onRetry={() => void categoriesQuery.refetch()}
        />
      ) : (
        <FlatList
          data={filteredCategories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.xxl }}
          refreshControl={
            <RefreshControl
              refreshing={categoriesQuery.isRefetching}
              onRefresh={() => void categoriesQuery.refetch()}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="tag"
              title={
                activeTab === 'expense'
                  ? t('categories.no_expense')
                  : t('categories.no_income')
              }
              actionLabel={t('categories.add')}
              onAction={openCreateModal}
            />
          }
          renderItem={({ item }) => (
            <Card style={{ paddingVertical: theme.spacing.md }}>
              <View style={[styles.itemRow, { gap: theme.spacing.md }]}>
                <View
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: item.color, borderRadius: theme.radius.full },
                  ]}
                />
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyStrong">{item.name}</AppText>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => openEditModal(item)}
                  style={[
                    styles.iconBtn,
                    {
                      minWidth: theme.sizes.touchTarget,
                      minHeight: theme.sizes.touchTarget,
                      borderRadius: theme.radius.control,
                      backgroundColor: theme.colors.surfaceAlt,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Feather name="edit-2" size={18} color={theme.colors.text} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setDeletingCategory(item)}
                  style={[
                    styles.iconBtn,
                    {
                      minWidth: theme.sizes.touchTarget,
                      minHeight: theme.sizes.touchTarget,
                      borderRadius: theme.radius.control,
                      backgroundColor: theme.colors.surfaceAlt,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Feather name="trash-2" size={18} color={theme.colors.danger} />
                </Pressable>
              </View>
            </Card>
          )}
        />
      )}

      {/* Add / Edit BottomSheet */}
      <BottomSheet
        visible={sheetOpen}
        title={editingCategory ? t('categories.edit') : t('categories.add')}
        onClose={() => {
          if (!isMutating) setSheetOpen(false);
        }}
      >
        {formError ? (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor: theme.colors.surfaceAlt,
                borderColor: theme.colors.danger,
                borderRadius: theme.radius.control,
                padding: theme.spacing.md,
                gap: theme.spacing.sm,
              },
            ]}
          >
            <Feather name="alert-circle" size={18} color={theme.colors.danger} />
            <AppText color={theme.colors.danger} style={{ flex: 1 }}>
              {formError}
            </AppText>
          </View>
        ) : null}

        {/* Category Type selector */}
        <View style={{ gap: theme.spacing.xs }}>
          <AppText variant="bodyStrong">{t('categories.type')}</AppText>
          <View style={[styles.typeRow, { gap: theme.spacing.sm }]}>
            {(['expense', 'income'] as const).map((typeOpt) => {
              const selected = selectedType === typeOpt;
              const accent = typeOpt === 'expense' ? theme.colors.expense : theme.colors.income;
              return (
                <Pressable
                  key={typeOpt}
                  accessibilityRole="button"
                  disabled={isTypeLocked}
                  onPress={() => setValue('type', typeOpt)}
                  style={[
                    styles.typeBtn,
                    {
                      minHeight: theme.sizes.touchTarget,
                      borderRadius: theme.radius.control,
                      borderColor: selected ? accent : theme.colors.border,
                      backgroundColor: selected ? theme.colors.surfaceAlt : theme.colors.surface,
                      opacity: isTypeLocked && !selected ? 0.45 : 1,
                    },
                  ]}
                >
                  <AppText
                    variant="bodyStrong"
                    color={selected ? accent : theme.colors.textMuted}
                  >
                    {typeOpt === 'expense'
                      ? t('categories.expense_categories')
                      : t('categories.income_categories')}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
          {isTypeLocked ? (
            <AppText variant="caption" muted>
              {t('categories.type_locked_hint')}
            </AppText>
          ) : null}
        </View>

        {/* Category Name */}
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label={t('categories.name')}
              placeholder={t('categories.name_placeholder')}
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              maxLength={50}
              error={errors.name?.message ? t(errors.name.message) : undefined}
            />
          )}
        />

        {/* 12 Preset Colors */}
        <View style={{ gap: theme.spacing.xs }}>
          <AppText variant="bodyStrong">{t('categories.preset_color')}</AppText>
          <View style={[styles.colorGrid, { gap: theme.spacing.sm }]}>
            {PRESET_CATEGORY_COLORS.map((hex) => {
              const active = selectedColor.toUpperCase() === hex.toUpperCase();
              return (
                <Pressable
                  key={hex}
                  accessibilityRole="button"
                  onPress={() => setValue('color', hex)}
                  style={[
                    styles.presetCircle,
                    {
                      backgroundColor: hex,
                      borderRadius: theme.radius.full,
                      borderColor: active ? theme.colors.text : 'transparent',
                      borderWidth: active ? 3 : 0,
                    },
                  ]}
                >
                  {active ? <Feather name="check" size={18} color="#FFFFFF" /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.typeRow, { gap: theme.spacing.sm, marginTop: theme.spacing.sm }]}>
          <Button
            variant="secondary"
            label={t('common.cancel')}
            disabled={isMutating}
            onPress={() => setSheetOpen(false)}
            style={{ flex: 1 }}
          />
          <Button
            label={t('common.save')}
            loading={isMutating}
            disabled={isMutating}
            onPress={() => void handleSubmit(onSubmit)()}
            style={{ flex: 1 }}
          />
        </View>
      </BottomSheet>

      {/* Confirm Delete Category */}
      <ConfirmDialog
        visible={Boolean(deletingCategory)}
        title={t('categories.delete')}
        message={t('categories.confirm_delete', { name: deletingCategory?.name ?? '' })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        danger
        loading={deleteMutation.isPending}
        onCancel={() => setDeletingCategory(null)}
        onConfirm={() => void handleConfirmDelete()}
      />

      {/* Category In Use 409 Alert Dialog */}
      <ConfirmDialog
        visible={Boolean(inUseAlertMessage)}
        title={t('categories.delete')}
        message={inUseAlertMessage ?? ''}
        confirmLabel={t('common.ok')}
        cancelLabel={t('common.close')}
        danger={false}
        onCancel={() => setInUseAlertMessage(null)}
        onConfirm={() => setInUseAlertMessage(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  segmented: {
    flexDirection: 'row',
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorSwatch: {
    width: 20,
    height: 20,
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
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  presetCircle: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
