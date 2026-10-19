import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { Select, type SelectOption } from '@/components/ui/Select';
import { SkeletonList } from '@/components/ui/Skeleton';
import { TextField } from '@/components/ui/TextField';
import { useToast } from '@/components/ui/Toast';
import { usePreferences } from '@/context/PreferencesContext';
import { useCategories } from '@/hooks/useCategories';
import {
  useDeleteTransaction,
  useTransactionsInfinite,
  type TransactionFilters,
} from '@/hooks/useTransactions';
import { useTranslation } from '@/i18n/useTranslation';
import { useTheme } from '@/theme/useTheme';
import {
  ApiError,
  type CategoryType,
  type SortOrder,
  type Transaction,
  type TransactionSortBy,
} from '@/types/api';
import { formatCurrency, formatDateDisplay } from '@/utils/format';

type SortPreset = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';

function parseSortPreset(preset: SortPreset): { sortBy: TransactionSortBy; sortOrder: SortOrder } {
  switch (preset) {
    case 'date_asc':
      return { sortBy: 'transactionDate', sortOrder: 'asc' };
    case 'amount_desc':
      return { sortBy: 'amount', sortOrder: 'desc' };
    case 'amount_asc':
      return { sortBy: 'amount', sortOrder: 'asc' };
    case 'date_desc':
    default:
      return { sortBy: 'transactionDate', sortOrder: 'desc' };
  }
}

export default function TransactionsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { currency, language } = usePreferences();
  const { showToast } = useToast();

  // Search input with debounce
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Applied filters
  const [typeFilter, setTypeFilter] = useState<CategoryType | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [sortPreset, setSortPreset] = useState<SortPreset>('date_desc');

  // Filter sheet state
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const filters = useMemo<TransactionFilters>(() => {
    const { sortBy, sortOrder } = parseSortPreset(sortPreset);
    return {
      ...(typeFilter ? { type: typeFilter } : {}),
      ...(categoryFilter ? { categoryId: categoryFilter } : {}),
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
      sortBy,
      sortOrder,
    };
  }, [typeFilter, categoryFilter, debouncedSearch, dateFrom, dateTo, sortPreset]);

  const txQuery = useTransactionsInfinite(filters);
  const categoriesQuery = useCategories(typeFilter);
  const deleteMutation = useDeleteTransaction();

  const items = useMemo(
    () => txQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [txQuery.data],
  );

  const categoryOptions = useMemo<SelectOption[]>(() => {
    const list = categoriesQuery.data ?? [];
    return [
      { value: '', label: t('transactions.filter_category') },
      ...list.map((c) => ({ value: c.id, label: c.name, color: c.color })),
    ];
  }, [categoriesQuery.data, t]);

  const sortOptions = useMemo<SelectOption[]>(
    () => [
      { value: 'date_desc', label: t('transactions.sort_date_desc') },
      { value: 'date_asc', label: t('transactions.sort_date_asc') },
      { value: 'amount_desc', label: t('transactions.sort_amount_desc') },
      { value: 'amount_asc', label: t('transactions.sort_amount_asc') },
    ],
    [t],
  );

  const activeFilterCount =
    (typeFilter ? 1 : 0) +
    (categoryFilter ? 1 : 0) +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0) +
    (sortPreset !== 'date_desc' ? 1 : 0);

  const handleResetFilters = () => {
    setTypeFilter(undefined);
    setCategoryFilter('');
    setDateFrom('');
    setDateTo('');
    setSortPreset('date_desc');
  };

  const handleConfirmDelete = async () => {
    if (!deletingTx) return;
    try {
      await deleteMutation.mutateAsync(deletingTx.id);
      setDeletingTx(null);
      showToast(t('transactions.deleted_toast'), 'success');
    } catch (err) {
      setDeletingTx(null);
      if (err instanceof ApiError) {
        showToast(err.message || t('errors.UNKNOWN'), 'error');
      } else {
        showToast(t('errors.UNKNOWN'), 'error');
      }
    }
  };

  return (
    <Screen style={{ flex: 1 }}>
      {/* Header */}
      <View style={[styles.headerRow, { gap: theme.spacing.sm }]}>
        <View style={{ flex: 1 }}>
          <AppText variant="title">{t('transactions.title')}</AppText>
          <AppText variant="caption" muted>
            {t('transactions.subtitle')}
          </AppText>
        </View>
        <Button
          label={t('common.add')}
          onPress={() => router.push('/transaction/form')}
        />
      </View>

      {/* Search & Filter trigger */}
      <View style={[styles.searchRow, { gap: theme.spacing.sm }]}>
        <TextField
          placeholder={t('transactions.search')}
          leftIcon="search"
          value={searchInput}
          maxLength={50}
          onChangeText={setSearchInput}
          containerStyle={{ flex: 1 }}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => setFilterSheetOpen(true)}
          style={[
            styles.filterBtn,
            {
              minWidth: theme.sizes.touchTarget,
              minHeight: theme.sizes.touchTarget,
              borderRadius: theme.radius.control,
              backgroundColor:
                activeFilterCount > 0 ? theme.colors.primary : theme.colors.surface,
              borderColor:
                activeFilterCount > 0 ? theme.colors.primary : theme.colors.border,
            },
          ]}
        >
          <Feather
            name="sliders"
            size={18}
            color={activeFilterCount > 0 ? theme.colors.onPrimary : theme.colors.text}
          />
        </Pressable>
      </View>

      {/* Quick Type Chips */}
      <View style={[styles.typeChipsRow, { gap: theme.spacing.xs }]}>
        {(
          [
            { key: undefined, label: t('transactions.filter_type') },
            { key: 'expense' as const, label: t('transactions.expense') },
            { key: 'income' as const, label: t('transactions.income') },
          ] as const
        ).map((opt) => {
          const selected = typeFilter === opt.key;
          return (
            <Pressable
              key={opt.key ?? 'all'}
              accessibilityRole="button"
              onPress={() => {
                setTypeFilter(opt.key);
                setCategoryFilter('');
              }}
              style={[
                styles.quickChip,
                {
                  borderRadius: theme.radius.full,
                  borderColor: selected ? theme.colors.primary : theme.colors.border,
                  backgroundColor: selected ? theme.colors.surfaceAlt : theme.colors.surface,
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.xs,
                },
              ]}
            >
              <AppText
                variant="caption"
                color={selected ? theme.colors.primary : theme.colors.textMuted}
              >
                {opt.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {/* List */}
      {txQuery.isLoading ? (
        <SkeletonList count={5} itemHeight={84} />
      ) : txQuery.isError ? (
        <ErrorState
          message={txQuery.error?.message}
          onRetry={() => void txQuery.refetch()}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: 88 }}
          refreshControl={
            <RefreshControl
              refreshing={txQuery.isRefetching && !txQuery.isFetchingNextPage}
              onRefresh={() => void txQuery.refetch()}
              tintColor={theme.colors.primary}
            />
          }
          onEndReachedThreshold={0.3}
          onEndReached={() => {
            if (txQuery.hasNextPage && !txQuery.isFetchingNextPage) {
              void txQuery.fetchNextPage();
            }
          }}
          ListEmptyComponent={
            <EmptyState
              icon="file-text"
              title={t('transactions.empty')}
              actionLabel={t('transactions.add_first')}
              onAction={() => router.push('/transaction/form')}
            />
          }
          ListFooterComponent={
            txQuery.isFetchingNextPage ? (
              <View style={[styles.footerLoader, { paddingVertical: theme.spacing.md }]}>
                <ActivityIndicator color={theme.colors.primary} />
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const isIncome = item.type === 'income';
            const amountColor = isIncome ? theme.colors.income : theme.colors.expense;
            const sign = isIncome ? '+' : '-';

            return (
              <Card style={{ gap: theme.spacing.xs }}>
                <View style={[styles.cardTopRow, { gap: theme.spacing.sm }]}>
                  <CategoryChip name={item.category.name} color={item.category.color} />
                  <AppText variant="caption" muted style={{ flex: 1 }}>
                    {formatDateDisplay(item.transactionDate, language)}
                  </AppText>
                  <AppText variant="bodyStrong" color={amountColor}>
                    {sign} {formatCurrency(item.amount, currency, undefined, language)}
                  </AppText>
                </View>

                <View style={[styles.cardBottomRow, { gap: theme.spacing.sm }]}>
                  <AppText
                    muted={!item.description}
                    numberOfLines={2}
                    style={{ flex: 1 }}
                  >
                    {item.description || item.category.name}
                  </AppText>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      router.push({
                        pathname: '/transaction/form',
                        params: { id: item.id },
                      })
                    }
                    style={[
                      styles.actionIconBtn,
                      {
                        borderRadius: theme.radius.control,
                        backgroundColor: theme.colors.surfaceAlt,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <Feather name="edit-2" size={16} color={theme.colors.text} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setDeletingTx(item)}
                    style={[
                      styles.actionIconBtn,
                      {
                        borderRadius: theme.radius.control,
                        backgroundColor: theme.colors.surfaceAlt,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <Feather name="trash-2" size={16} color={theme.colors.danger} />
                  </Pressable>
                </View>
              </Card>
            );
          }}
        />
      )}

      {/* Floating + Action Button */}
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/transaction/form')}
        style={({ pressed }) => [
          styles.fab,
          {
            right: theme.spacing.lg,
            bottom: theme.spacing.lg,
            backgroundColor: theme.colors.primary,
            borderRadius: theme.radius.full,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Feather name="plus" size={24} color={theme.colors.onPrimary} />
      </Pressable>

      {/* Filter & Sort Bottom Sheet */}
      <BottomSheet
        visible={filterSheetOpen}
        title={t('transactions.filter_title')}
        onClose={() => setFilterSheetOpen(false)}
      >
        <Select
          label={t('transactions.sort_by')}
          value={sortPreset}
          options={sortOptions}
          onChange={(val) => setSortPreset(val as SortPreset)}
        />

        <Select
          label={t('transactions.category')}
          value={categoryFilter}
          options={categoryOptions}
          onChange={setCategoryFilter}
          placeholder={t('transactions.filter_category')}
        />

        <DatePickerField
          label={t('transactions.date_from')}
          value={dateFrom}
          onChange={setDateFrom}
          allowClear
        />

        <DatePickerField
          label={t('transactions.date_to')}
          value={dateTo}
          onChange={setDateTo}
          allowClear
        />

        <View style={[styles.sheetActions, { gap: theme.spacing.sm }]}>
          <Button
            variant="secondary"
            label={t('transactions.reset_filter')}
            onPress={handleResetFilters}
            style={{ flex: 1 }}
          />
          <Button
            label={t('transactions.apply_filter')}
            onPress={() => setFilterSheetOpen(false)}
            style={{ flex: 1 }}
          />
        </View>
      </BottomSheet>

      {/* Confirm Delete Transaction */}
      <ConfirmDialog
        visible={Boolean(deletingTx)}
        title={t('transactions.delete')}
        message={t('transactions.confirm_delete')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        danger
        loading={deleteMutation.isPending}
        onCancel={() => setDeletingTx(null)}
        onConfirm={() => void handleConfirmDelete()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  typeChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quickChip: {
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  footerLoader: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  sheetActions: {
    flexDirection: 'row',
  },
});
