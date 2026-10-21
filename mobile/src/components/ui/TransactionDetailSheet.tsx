import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { usePreferences } from '@/context/PreferencesContext';
import { useCurrencies } from '@/hooks/useCurrencies';
import { useDeleteTransaction, useTransactionDetail } from '@/hooks/useTransactions';
import { useTranslation } from '@/i18n/useTranslation';
import { useTheme } from '@/theme/useTheme';
import { ApiError, type Transaction } from '@/types/api';
import {
  formatCurrency,
  formatDateDisplay,
  formatDateTimeDisplay,
} from '@/utils/format';
import { AppText } from './AppText';
import { Badge } from './Badge';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { CategoryChip } from './CategoryChip';
import { ConfirmDialog } from './ConfirmDialog';
import { useToast } from './Toast';

type Props = {
  transaction: Transaction | null;
  onClose: () => void;
};

export function TransactionDetailSheet({ transaction, onClose }: Props) {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { currency, language } = usePreferences();
  const { rates, formatAmount } = useCurrencies();
  const { showToast } = useToast();

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const detailQuery = useTransactionDetail(transaction?.id);
  const deleteMutation = useDeleteTransaction();

  const tx = detailQuery.data ?? transaction;

  const handleEdit = () => {
    if (!tx) return;
    const targetId = tx.id;
    onClose();
    router.push({ pathname: '/transaction/form', params: { id: targetId } });
  };

  const handleConfirmDelete = async () => {
    if (!tx) return;
    try {
      await deleteMutation.mutateAsync(tx.id);
      setConfirmDeleteOpen(false);
      onClose();
      showToast(t('transactions.deleted_toast'), 'success');
    } catch (err) {
      setConfirmDeleteOpen(false);
      if (err instanceof ApiError) {
        showToast(err.message || t('errors.UNKNOWN'), 'error');
      } else {
        showToast(t('errors.UNKNOWN'), 'error');
      }
    }
  };

  const isExpense = tx?.type === 'expense';
  const amountColor = isExpense ? theme.colors.expense : theme.colors.income;
  const sign = isExpense ? '-' : '+';

  const getSourceLabel = (source?: string): string => {
    if (source === 'import') return t('transactions.source_import');
    if (source === 'scan') return t('transactions.source_scan');
    return t('transactions.source_manual');
  };

  return (
    <>
      <BottomSheet
        visible={Boolean(transaction)}
        onClose={onClose}
        title={t('transactions.detail_title')}
      >
        {tx ? (
          <View style={{ gap: theme.spacing.md }}>
            {/* Amount Box */}
            <View
              style={[
                styles.amountBox,
                {
                  backgroundColor: theme.colors.surfaceAlt,
                  borderRadius: theme.radius.control,
                  padding: theme.spacing.md,
                  gap: theme.spacing.xs,
                },
              ]}
            >
              <Badge
                label={isExpense ? t('transactions.expense') : t('transactions.income')}
                variant={isExpense ? 'danger' : 'success'}
              />
              <AppText variant="title" color={amountColor}>
                {sign} {formatAmount(tx.amount)}
              </AppText>
              {currency !== 'IDR' ? (
                <AppText variant="caption" muted>
                  {t('transactions.original_idr')}: {formatCurrency(tx.amount, 'IDR', rates, language)}
                </AppText>
              ) : null}
            </View>

            {/* Detail Rows */}
            <View
              style={[
                styles.detailsCard,
                {
                  borderColor: theme.colors.border,
                  borderRadius: theme.radius.control,
                  padding: theme.spacing.md,
                  gap: theme.spacing.sm,
                },
              ]}
            >
              <View style={styles.detailRow}>
                <AppText variant="caption" muted>
                  {t('transactions.category')}
                </AppText>
                <CategoryChip name={tx.category.name} color={tx.category.color} />
              </View>

              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

              <View style={styles.detailRow}>
                <AppText variant="caption" muted>
                  {t('transactions.date')}
                </AppText>
                <AppText variant="bodyStrong">
                  {formatDateDisplay(tx.transactionDate, language)}
                </AppText>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

              <View style={styles.detailRow}>
                <AppText variant="caption" muted>
                  {t('transactions.source')}
                </AppText>
                <Badge label={getSourceLabel(tx.source)} variant="info" />
              </View>

              {tx.createdAt ? (
                <>
                  <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                  <View style={styles.detailRow}>
                    <AppText variant="caption" muted>
                      {t('transactions.created_at')}
                    </AppText>
                    <AppText variant="caption">
                      {formatDateTimeDisplay(tx.createdAt, language)}
                    </AppText>
                  </View>
                </>
              ) : null}

              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

              <View style={{ gap: theme.spacing.xs }}>
                <AppText variant="caption" muted>
                  {t('transactions.description')}
                </AppText>
                <AppText variant="body" muted={!tx.description}>
                  {tx.description || '-'}
                </AppText>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={[styles.actionsRow, { gap: theme.spacing.sm }]}>
              <View style={{ flex: 1 }}>
                <Button
                  variant="danger"
                  label={t('common.delete')}
                  onPress={() => setConfirmDeleteOpen(true)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label={t('common.edit')}
                  onPress={handleEdit}
                />
              </View>
            </View>
          </View>
        ) : null}
      </BottomSheet>

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
    </>
  );
}

const styles = StyleSheet.create({
  amountBox: {
    alignItems: 'flex-start',
  },
  detailsCard: {
    borderWidth: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
