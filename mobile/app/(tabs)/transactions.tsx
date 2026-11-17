import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { Select, type SelectOption } from '@/components/ui/Select';
import { SkeletonList } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { TransactionDetailSheet } from '@/components/ui/TransactionDetailSheet';
import { usePreferences } from '@/context/PreferencesContext';
import { useCategories } from '@/hooks/useCategories';
import { useCurrencies } from '@/hooks/useCurrencies';
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
  const { rates } = useCurrencies();
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
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

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

  const totalCount = txQuery.data?.pages[0]?.meta?.total ?? items.length;

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

  const typeFilterCards: {
    key: CategoryType | undefined;
    label: string;
    icon: React.ComponentProps<typeof Feather>['name'];
    activeColor: string;
  }[] = [
    {
      key: undefined,
      label: t('common.all'),
      icon: 'layers',
      activeColor: theme.colors.primary,
    },
    {
      key: 'expense',
      label: t('transactions.expense'),
      icon: 'arrow-up-right',
      activeColor: theme.colors.expense,
    },
    {
      key: 'income',
      label: t('transactions.income'),
      icon: 'arrow-down-left',
      activeColor: theme.colors.income,
    },
  ];

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
        {/* Header (aligned consistently with Home, Budget, and Savings tabs) */}
        <View style={[styles.headerRow, { gap: theme.spacing.md }]}>
          <View style={{ flex: 1 }}>
            <AppText variant="title">{t('transactions.title')}</AppText>
            <AppText variant="caption" muted numberOfLines={1}>
              {t('transactions.subtitle')}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.add')}
            onPress={() => router.push('/transaction/form')}
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

        {/* Dedicated Filter & Search Card Container */}
        <Card
          style={{
            padding: theme.spacing.md,
            gap: theme.spacing.md,
            borderRadius: theme.radius.card + 2,
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            flexShrink: 0,
          }}
        >
          {/* Row 1: Search Input + Filter Sheet Button */}
          <View style={[styles.searchRow, { gap: theme.spacing.sm }]}>
            <View
              style={[
                styles.searchField,
                {
                  minHeight: 44,
                  borderRadius: theme.radius.control,
                  backgroundColor: theme.colors.surfaceAlt,
                  borderColor: theme.colors.border,
                  borderWidth: 1,
                  paddingHorizontal: theme.spacing.md,
                  gap: theme.spacing.sm,
                },
              ]}
            >
              <Feather name="search" size={18} color={theme.colors.textMuted} />
              <TextInput
                style={[
                  styles.searchInput,
                  { color: theme.colors.text, fontSize: theme.typography.body.fontSize },
                ]}
                placeholder={t('transactions.search')}
                placeholderTextColor={theme.colors.textMuted}
                value={searchInput}
                maxLength={50}
                onChangeText={setSearchInput}
              />
              {searchInput.length > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => setSearchInput('')}
                >
                  <Feather name="x-circle" size={16} color={theme.colors.textMuted} />
                </Pressable>
              ) : null}
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => setFilterSheetOpen(true)}
              style={[
                styles.filterBtn,
                {
                  width: 44,
                  height: 44,
                  borderRadius: theme.radius.control,
                  borderWidth: 1,
                  borderColor:
                    activeFilterCount > 0 ? theme.colors.primary : theme.colors.border,
                  backgroundColor:
                    activeFilterCount > 0 ? `${theme.colors.primary}15` : theme.colors.surfaceAlt,
                },
              ]}
            >
              <Feather
                name="sliders"
                size={18}
                color={activeFilterCount > 0 ? theme.colors.primary : theme.colors.text}
              />
              {activeFilterCount > 0 ? (
                <View
                  style={[
                    styles.filterCountBadge,
                    {
                      backgroundColor: theme.colors.primary,
                      borderRadius: theme.radius.full,
                    },
                  ]}
                >
                  <AppText
                    variant="caption"
                    color={theme.colors.onPrimary}
                    style={styles.filterCountText}
                  >
                    {activeFilterCount}
                  </AppText>
                </View>
              ) : null}
            </Pressable>
          </View>

          {/* Row 2: 3 Equal-Width Filter Cards (Never Cut Off) */}
          <View style={[styles.threeFilterRow, { gap: theme.spacing.sm }]}>
            {typeFilterCards.map((opt) => {
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
                    styles.filterTypeCard,
                    {
                      borderRadius: theme.radius.control,
                      borderWidth: 1.5,
                      borderColor: selected ? opt.activeColor : theme.colors.border,
                      backgroundColor: selected
                        ? `${opt.activeColor}15`
                        : theme.colors.surfaceAlt,
                      paddingVertical: 10,
                      paddingHorizontal: 8,
                      gap: 6,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.filterTypeIconWrap,
                      {
                        backgroundColor: selected
                          ? `${opt.activeColor}22`
                          : `${theme.colors.textMuted}14`,
                        borderRadius: theme.radius.full,
                      },
                    ]}
                  >
                    <Feather
                      name={opt.icon}
                      size={14}
                      color={selected ? opt.activeColor : theme.colors.textMuted}
                    />
                  </View>
                  <AppText
                    variant={selected ? 'bodyStrong' : 'caption'}
                    color={selected ? opt.activeColor : theme.colors.text}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                    style={styles.filterTypeLabel}
                  >
                    {opt.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* Clear Section Divider between Filter Card and Transaction Item Cards */}
        <View
          style={[
            styles.sectionDividerBar,
            {
              paddingHorizontal: 4,
              paddingBottom: 2,
            },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
            <AppText variant="bodyStrong" color={theme.colors.textMuted}>
              {t('transactions.title')}
            </AppText>
            <Badge label={String(totalCount)} variant="neutral" />
          </View>
          {activeFilterCount > 0 ? (
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={handleResetFilters}
            >
              <AppText variant="caption" color={theme.colors.primary} style={{ fontWeight: '600' }}>
                {t('transactions.reset_filter')}
              </AppText>
            </Pressable>
          ) : null}
        </View>

        {/* Transaction Item Cards List */}
        {txQuery.isLoading ? (
          <SkeletonList count={5} itemHeight={116} />
        ) : txQuery.isError ? (
          <ErrorState
            message={txQuery.error?.message}
            onRetry={() => void txQuery.refetch()}
          />
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              gap: theme.spacing.md,
              paddingBottom: 96,
            }}
            showsVerticalScrollIndicator={false}
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
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setSelectedTx(item)}
                >
                  <Card
                    style={{
                      padding: theme.spacing.lg,
                      borderRadius: theme.radius.card + 2,
                      borderColor: theme.colors.border,
                      borderLeftWidth: 4,
                      borderLeftColor: amountColor,
                      backgroundColor: theme.colors.surface,
                      shadowColor: theme.colors.text,
                      shadowOpacity: theme.isDark ? 0 : 0.03,
                      shadowRadius: 12,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: theme.isDark ? 0 : 1,
                    }}
                  >
                    <View
                      style={[styles.cardTopRow, { gap: theme.spacing.md, alignItems: 'center' }]}
                    >
                      <View
                        style={[
                          styles.txIcon,
                          {
                            backgroundColor: `${amountColor}14`,
                            borderRadius: theme.radius.control,
                          },
                        ]}
                      >
                        <Feather
                          name={isIncome ? 'arrow-down-left' : 'arrow-up-right'}
                          size={20}
                          color={amountColor}
                        />
                      </View>

                      <View style={{ flex: 1, gap: 3 }}>
                        <AppText variant="bodyStrong" muted={!item.description} numberOfLines={1}>
                          {item.description || item.category.name}
                        </AppText>
                        <View style={[styles.cardBottomRow, { gap: 6 }]}>
                          <View style={[styles.catDot, { backgroundColor: item.category.color }]} />
                          <AppText variant="caption" muted numberOfLines={1} style={{ flexShrink: 1 }}>
                            {item.category.name}
                          </AppText>
                        </View>
                      </View>

                      <AppText
                        variant="bodyStrong"
                        color={amountColor}
                        numberOfLines={1}
                        style={styles.amountText}
                      >
                        {sign} {formatCurrency(item.amount, currency, rates, language)}
                      </AppText>
                    </View>

                    <View
                      style={[
                        styles.cardFooter,
                        {
                          marginTop: theme.spacing.sm,
                          paddingTop: theme.spacing.sm,
                          borderTopColor: theme.colors.border,
                          gap: theme.spacing.sm,
                        },
                      ]}
                    >
                      <View style={[styles.cardBottomRow, { gap: 6, flex: 1 }]}>
                        <Feather name="calendar" size={13} color={theme.colors.textMuted} />
                        <AppText variant="caption" muted numberOfLines={1} style={{ flexShrink: 1 }}>
                          {formatDateDisplay(item.transactionDate, language)}
                        </AppText>
                      </View>
                      <View style={[styles.cardBottomRow, { gap: theme.spacing.sm }]}>
                        <Pressable
                          accessibilityRole="button"
                          hitSlop={8}
                          onPress={(e) => {
                            e.stopPropagation();
                            router.push({
                              pathname: '/transaction/form',
                              params: { id: item.id },
                            });
                          }}
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
                          onPress={(e) => {
                            e.stopPropagation();
                            setDeletingTx(item);
                          }}
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
                  </Card>
                </Pressable>
              );
            }}
          />
        )}
      </View>

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
            shadowColor: theme.colors.primary,
            shadowOpacity: theme.isDark ? 0 : 0.3,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
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
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterBtn: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCountBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCountText: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  threeFilterRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  filterTypeCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
  },
  filterTypeIconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTypeLabel: {
    flexShrink: 1,
    textAlign: 'center',
    fontSize: 12,
  },
  sectionDividerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  addBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0,
  },
  txIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountText: {
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 0,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
  },
  actionIconBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetActions: {
    flexDirection: 'row',
    marginTop: 8,
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
    elevation: 4,
  },
});
