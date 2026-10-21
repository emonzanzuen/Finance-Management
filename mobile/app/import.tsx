import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Feather } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { useToast } from '@/components/ui/Toast';
import { usePreferences } from '@/context/PreferencesContext';
import { useCurrencies } from '@/hooks/useCurrencies';
import {
  useCommitTransactionsImport,
  useDownloadImportTemplate,
  useImportSpec,
  usePreviewTransactionsImport,
} from '@/hooks/useImports';
import { useTranslation } from '@/i18n/useTranslation';
import { useTheme } from '@/theme/useTheme';
import {
  ApiError,
  NETWORK_ERROR_CODE,
  type ImportCommitResponse,
  type ImportHeaderMismatchDetails,
  type ImportPreviewResponse,
  type UnknownCategoryMode,
} from '@/types/api';
import { formatDateDisplay } from '@/utils/format';

type ActiveErrorState = {
  code: string;
  message: string;
  serverMessage?: string;
};

export default function ImportScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { language } = usePreferences();
  const { formatAmount } = useCurrencies();
  const { showToast } = useToast();

  const specQuery = useImportSpec();
  const downloadTemplateMutation = useDownloadImportTemplate();
  const previewMutation = usePreviewTransactionsImport();
  const commitMutation = useCommitTransactionsImport();

  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [headerMismatch, setHeaderMismatch] = useState<ImportHeaderMismatchDetails | null>(null);
  const [activeError, setActiveError] = useState<ActiveErrorState | null>(null);
  const [previewData, setPreviewData] = useState<ImportPreviewResponse | null>(null);
  const [unknownCategoryMode, setUnknownCategoryMode] = useState<UnknownCategoryMode>('create');
  const [skipDuplicates, setSkipDuplicates] = useState<boolean>(true);
  const [commitResult, setCommitResult] = useState<ImportCommitResponse | null>(null);

  const handleDownloadTemplate = async () => {
    try {
      await downloadTemplateMutation.mutateAsync();
      showToast(t('import.template_downloaded'), 'success');
    } catch (err) {
      if (err instanceof ApiError) {
        showToast(err.message, 'error');
      } else {
        showToast(t('errors.UNKNOWN'), 'error');
      }
    }
  };

  const handlePickFile = async () => {
    setHeaderMismatch(null);
    setActiveError(null);
    setPreviewData(null);
    setCommitResult(null);

    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/octet-stream',
        ],
        copyToCacheDirectory: true,
      });

      if (res.canceled || !res.assets?.[0]) {
        return;
      }

      const asset = res.assets[0];
      setSelectedFileName(asset.name);

      const preview = await previewMutation.mutateAsync({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType,
        file: asset.file,
      });

      setPreviewData(preview);
      setUnknownCategoryMode('create');
      setSkipDuplicates(true);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'IMPORT_HEADER_MISMATCH') {
          setHeaderMismatch((err.details as ImportHeaderMismatchDetails) ?? {});
          return;
        }
        const key = `errors.${err.code}`;
        const translated = t(key);
        setActiveError({
          code: err.code,
          message: translated !== key ? translated : err.message,
          serverMessage: err.serverMessage,
        });
      } else {
        setActiveError({
          code: 'UNKNOWN',
          message: t('errors.UNKNOWN'),
        });
      }
    }
  };

  const validRowsToCommit = useMemo(() => {
    if (!previewData) return [];
    return previewData.rows.filter(
      (r) =>
        r.status === 'valid' &&
        r.type &&
        r.category &&
        r.amount !== undefined &&
        r.transactionDate &&
        (!skipDuplicates || !r.duplicate),
    );
  }, [previewData, skipDuplicates]);

  const handleCommitImport = async () => {
    if (!previewData || validRowsToCommit.length === 0) return;
    setActiveError(null);

    try {
      const result = await commitMutation.mutateAsync({
        unknownCategoryMode,
        skipDuplicates,
        rows: validRowsToCommit.map((r) => ({
          type: r.type!,
          category: r.category!,
          amount: r.amount!,
          transactionDate: r.transactionDate!,
          ...(r.description ? { description: r.description } : {}),
        })),
      });

      setCommitResult(result);
      setPreviewData(null);
      showToast(t('import.commit_success_toast'), 'success');
    } catch (err) {
      if (err instanceof ApiError) {
        const key = `errors.${err.code}`;
        const translated = t(key);
        setActiveError({
          code: err.code,
          message: translated !== key ? translated : err.message,
          serverMessage: err.serverMessage,
        });
      } else {
        setActiveError({
          code: 'UNKNOWN',
          message: t('errors.UNKNOWN'),
        });
      }
    }
  };

  const spec = specQuery.data;

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing.lg,
          paddingBottom: theme.spacing.xxl * 2,
          gap: theme.spacing.md,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.headerRow, { gap: theme.spacing.sm }]}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={[
              styles.backBtn,
              {
                minWidth: theme.sizes.touchTarget,
                minHeight: theme.sizes.touchTarget,
                borderRadius: theme.radius.control,
              },
            ]}
          >
            <Feather name="arrow-left" size={22} color={theme.colors.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <AppText variant="title">{t('import.title')}</AppText>
            <AppText variant="caption" muted>
              {t('import.subtitle')}
            </AppText>
          </View>
        </View>

        {/* 1. Aturan Teknis Berkas (File Spec) */}
        <Card>
          <View style={[styles.cardTitleRow, { gap: theme.spacing.xs }]}>
            <Feather name="file-text" size={18} color={theme.colors.primary} />
            <AppText variant="subtitle">{t('import.file_spec_title')}</AppText>
          </View>

          <View style={{ gap: theme.spacing.xs }}>
            <AppText variant="caption">• {t('import.file_spec_format')}</AppText>
            <AppText variant="caption">• {t('import.file_spec_limits')}</AppText>
            <AppText variant="caption" color={theme.colors.danger}>
              • {t('import.file_spec_merged_warning')}
            </AppText>
            <AppText variant="caption" muted>
              • {t('import.file_spec_ghost_rows_tip')}
            </AppText>
            <AppText variant="caption" muted>
              • {t('import.file_spec_rate_limit')}
            </AppText>
          </View>
        </Card>

        {/* 2. Aturan Kolom & Format Data */}
        <Card>
          <View style={[styles.cardTitleRow, { gap: theme.spacing.xs }]}>
            <Feather name="grid" size={18} color={theme.colors.primary} />
            <AppText variant="subtitle">{t('import.columns_spec_title')}</AppText>
          </View>

          <AppText variant="caption" muted>
            {t('import.rules_desc')}
          </AppText>

          <View style={{ gap: theme.spacing.sm }}>
            <View
              style={[
                styles.specBox,
                {
                  backgroundColor: theme.colors.surfaceAlt,
                  borderRadius: theme.radius.control,
                  padding: theme.spacing.sm,
                  gap: 2,
                },
              ]}
            >
              <AppText variant="bodyStrong">{t('import.col_tanggal_name')}</AppText>
              <AppText variant="caption" muted>
                {t('import.col_tanggal_desc')}
              </AppText>
            </View>

            <View
              style={[
                styles.specBox,
                {
                  backgroundColor: theme.colors.surfaceAlt,
                  borderRadius: theme.radius.control,
                  padding: theme.spacing.sm,
                  gap: 2,
                },
              ]}
            >
              <AppText variant="bodyStrong">{t('import.col_tipe_name')}</AppText>
              <AppText variant="caption" muted>
                {t('import.col_tipe_desc')}
              </AppText>
            </View>

            <View
              style={[
                styles.specBox,
                {
                  backgroundColor: theme.colors.surfaceAlt,
                  borderRadius: theme.radius.control,
                  padding: theme.spacing.sm,
                  gap: 2,
                },
              ]}
            >
              <AppText variant="bodyStrong">{t('import.col_kategori_name')}</AppText>
              <AppText variant="caption" muted>
                {t('import.col_kategori_desc')}
              </AppText>
            </View>

            <View
              style={[
                styles.specBox,
                {
                  backgroundColor: theme.colors.surfaceAlt,
                  borderRadius: theme.radius.control,
                  padding: theme.spacing.sm,
                  gap: 2,
                },
              ]}
            >
              <AppText variant="bodyStrong">{t('import.col_deskripsi_name')}</AppText>
              <AppText variant="caption" muted>
                {t('import.col_deskripsi_desc')}
              </AppText>
            </View>

            <View
              style={[
                styles.specBox,
                {
                  backgroundColor: theme.colors.surfaceAlt,
                  borderRadius: theme.radius.control,
                  padding: theme.spacing.sm,
                  gap: 2,
                },
              ]}
            >
              <AppText variant="bodyStrong">{t('import.col_nominal_name')}</AppText>
              <AppText variant="caption" muted>
                {t('import.col_nominal_desc')}
              </AppText>
            </View>

            <View
              style={[
                styles.specBox,
                {
                  backgroundColor: theme.colors.surfaceAlt,
                  borderRadius: theme.radius.control,
                  padding: theme.spacing.sm,
                  gap: 2,
                },
              ]}
            >
              <AppText variant="bodyStrong">{t('import.col_ignored_name')}</AppText>
              <AppText variant="caption" muted>
                {t('import.col_ignored_desc')} (
                {(spec?.ignoredColumns ?? ['No', 'Hari']).join(', ')})
              </AppText>
            </View>
          </View>

          {/* Column Adjustment Guide Box */}
          <View
            style={[
              styles.guideBox,
              {
                backgroundColor: `${theme.colors.info}14`,
                borderColor: `${theme.colors.info}40`,
                borderRadius: theme.radius.control,
                padding: theme.spacing.md,
                gap: theme.spacing.xs,
              },
            ]}
          >
            <View style={[styles.cardTitleRow, { gap: theme.spacing.xs }]}>
              <Feather name="info" size={16} color={theme.colors.info} />
              <AppText variant="bodyStrong" color={theme.colors.info}>
                {t('import.adjustment_guide_title')}
              </AppText>
            </View>
            <AppText variant="caption">{t('import.adjustment_guide_body')}</AppText>
          </View>

          {/* Actions: Download Template & Select File */}
          <View style={[styles.actionsRow, { gap: theme.spacing.sm }]}>
            <View style={{ flex: 1 }}>
              <Button
                variant="secondary"
                label={t('import.download_template')}
                loading={downloadTemplateMutation.isPending}
                onPress={() => void handleDownloadTemplate()}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label={t('import.select_file')}
                loading={previewMutation.isPending}
                onPress={() => void handlePickFile()}
              />
            </View>
          </View>

          {selectedFileName ? (
            <AppText variant="caption" muted>
              {t('import.selected_file')}: {selectedFileName}
            </AppText>
          ) : null}
        </Card>

        {/* 3. Penanganan Masalah & Peringatan Berlapis (Tahap A) */}
        {activeError ? (
          <Card style={{ borderColor: theme.colors.danger }}>
            <View style={[styles.cardTitleRow, { gap: theme.spacing.xs }]}>
              <Feather name="alert-circle" size={18} color={theme.colors.danger} />
              <AppText variant="bodyStrong" color={theme.colors.danger}>
                {activeError.code === 'IMPORT_LIMIT_EXCEEDED'
                  ? t('import.error_stage_a_title')
                  : t('common.error')}
              </AppText>
            </View>

            <AppText variant="body" color={theme.colors.danger}>
              {activeError.message}
            </AppText>

            {activeError.serverMessage && activeError.serverMessage !== activeError.message ? (
              <AppText variant="caption" color={theme.colors.danger}>
                Pesan server: {activeError.serverMessage}
              </AppText>
            ) : null}

            {activeError.code === 'IMPORT_LIMIT_EXCEEDED' ? (
              <View
                style={[
                  styles.specBox,
                  {
                    backgroundColor: `${theme.colors.danger}10`,
                    borderRadius: theme.radius.control,
                    padding: theme.spacing.sm,
                    gap: theme.spacing.xs,
                  },
                ]}
              >
                <AppText variant="caption" color={theme.colors.danger}>
                  • {t('import.error_limit_exceeded_detail')}
                </AppText>
                <AppText variant="caption" color={theme.colors.text}>
                  • {t('import.error_ghost_rows_solution')}
                </AppText>
                <AppText variant="caption" color={theme.colors.danger}>
                  • {t('import.file_spec_merged_warning')}
                </AppText>
              </View>
            ) : null}

            {activeError.code === 'RATE_LIMITED' ? (
              <AppText variant="caption" muted>
                {t('import.error_rate_limited_detail')}
              </AppText>
            ) : null}

            {activeError.code === NETWORK_ERROR_CODE ? (
              <AppText variant="caption" muted>
                {t('import.error_network_detail')}
              </AppText>
            ) : null}

            <Button
              variant="secondary"
              label={t('import.reselect_file')}
              onPress={() => void handlePickFile()}
            />
          </Card>
        ) : null}

        {/* 3. Penanganan Masalah Header (Tahap B: IMPORT_HEADER_MISMATCH) */}
        {headerMismatch ? (
          <Card style={{ borderColor: theme.colors.danger }}>
            <View style={[styles.cardTitleRow, { gap: theme.spacing.xs }]}>
              <Feather name="alert-octagon" size={20} color={theme.colors.danger} />
              <AppText variant="subtitle" color={theme.colors.danger}>
                {t('import.header_mismatch_title')}
              </AppText>
            </View>

            <AppText variant="body">{t('import.header_mismatch_desc')}</AppText>

            {headerMismatch.unknown && headerMismatch.unknown.length > 0 ? (
              <View
                style={[
                  styles.mismatchSubBox,
                  {
                    backgroundColor: `${theme.colors.danger}15`,
                    borderRadius: theme.radius.control,
                    padding: theme.spacing.md,
                    gap: theme.spacing.xs,
                  },
                ]}
              >
                <AppText variant="bodyStrong" color={theme.colors.danger}>
                  {t('import.unknown_columns_label')}:
                </AppText>
                <AppText variant="body">
                  {headerMismatch.unknown.map((c) => `"${c}"`).join(', ')}
                </AppText>
              </View>
            ) : null}

            {headerMismatch.missing && headerMismatch.missing.length > 0 ? (
              <View
                style={[
                  styles.mismatchSubBox,
                  {
                    backgroundColor: `${theme.colors.warning}18`,
                    borderRadius: theme.radius.control,
                    padding: theme.spacing.md,
                    gap: theme.spacing.xs,
                  },
                ]}
              >
                <AppText variant="bodyStrong" color={theme.colors.warning}>
                  {t('import.missing_columns_label')}:
                </AppText>
                <AppText variant="body">
                  {headerMismatch.missing.map((c) => `"${c}"`).join(', ')}
                </AppText>
              </View>
            ) : null}

            <Button
              label={t('import.reselect_file')}
              onPress={() => void handlePickFile()}
            />
          </Card>
        ) : null}

        {/* 3. Pratinjau & Validasi Baris (Tahap C) */}
        {previewData ? (
          <>
            <Card>
              <AppText variant="subtitle">{t('import.preview_summary_title')}</AppText>

              <View style={[styles.summaryGrid, { gap: theme.spacing.sm }]}>
                <View
                  style={[
                    styles.summaryCell,
                    {
                      backgroundColor: theme.colors.surfaceAlt,
                      borderRadius: theme.radius.control,
                      padding: theme.spacing.sm,
                    },
                  ]}
                >
                  <AppText variant="caption" muted>
                    {t('import.total_rows')}
                  </AppText>
                  <AppText variant="subtitle">{previewData.totalRows}</AppText>
                </View>

                <View
                  style={[
                    styles.summaryCell,
                    {
                      backgroundColor: `${theme.colors.income}18`,
                      borderRadius: theme.radius.control,
                      padding: theme.spacing.sm,
                    },
                  ]}
                >
                  <AppText variant="caption" color={theme.colors.income}>
                    {t('import.valid_rows')}
                  </AppText>
                  <AppText variant="subtitle" color={theme.colors.income}>
                    {previewData.validCount}
                  </AppText>
                </View>

                <View
                  style={[
                    styles.summaryCell,
                    {
                      backgroundColor: `${theme.colors.danger}18`,
                      borderRadius: theme.radius.control,
                      padding: theme.spacing.sm,
                    },
                  ]}
                >
                  <AppText variant="caption" color={theme.colors.danger}>
                    {t('import.invalid_rows')}
                  </AppText>
                  <AppText variant="subtitle" color={theme.colors.danger}>
                    {previewData.invalidCount}
                  </AppText>
                </View>

                <View
                  style={[
                    styles.summaryCell,
                    {
                      backgroundColor: `${theme.colors.warning}18`,
                      borderRadius: theme.radius.control,
                      padding: theme.spacing.sm,
                    },
                  ]}
                >
                  <AppText variant="caption" color={theme.colors.warning}>
                    {t('import.duplicate_rows')}
                  </AppText>
                  <AppText variant="subtitle" color={theme.colors.warning}>
                    {previewData.duplicateCount}
                  </AppText>
                </View>
              </View>

              {/* Skip Duplicates Option */}
              {previewData.duplicateCount > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setSkipDuplicates((prev) => !prev)}
                  style={[
                    styles.radioRow,
                    {
                      borderColor: theme.colors.border,
                      borderRadius: theme.radius.control,
                      padding: theme.spacing.md,
                      gap: theme.spacing.sm,
                    },
                  ]}
                >
                  <Feather
                    name={skipDuplicates ? 'check-square' : 'square'}
                    size={20}
                    color={skipDuplicates ? theme.colors.primary : theme.colors.textMuted}
                  />
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodyStrong">{t('import.skip_duplicates_label')}</AppText>
                    <AppText variant="caption" muted>
                      {t('import.skip_duplicates_hint')}
                    </AppText>
                  </View>
                </Pressable>
              ) : null}

              {/* Unknown Categories Option */}
              {previewData.unknownCategories.length > 0 ? (
                <View style={{ gap: theme.spacing.xs }}>
                  <AppText variant="bodyStrong">{t('import.unknown_categories_title')}</AppText>
                  <AppText variant="caption" muted>
                    {previewData.unknownCategories.join(', ')}
                  </AppText>

                  {(
                    [
                      { value: 'create' as const, label: t('import.mode_create') },
                      { value: 'other' as const, label: t('import.mode_other') },
                    ] as const
                  ).map((opt) => {
                    const active = unknownCategoryMode === opt.value;
                    return (
                      <Pressable
                        key={opt.value}
                        accessibilityRole="button"
                        onPress={() => setUnknownCategoryMode(opt.value)}
                        style={[
                          styles.radioRow,
                          {
                            borderColor: active ? theme.colors.primary : theme.colors.border,
                            backgroundColor: active
                              ? `${theme.colors.primary}12`
                              : theme.colors.surface,
                            borderRadius: theme.radius.control,
                            padding: theme.spacing.md,
                            gap: theme.spacing.sm,
                          },
                        ]}
                      >
                        <Feather
                          name={active ? 'disc' : 'circle'}
                          size={18}
                          color={active ? theme.colors.primary : theme.colors.textMuted}
                        />
                        <AppText
                          variant="bodyStrong"
                          color={active ? theme.colors.primary : theme.colors.text}
                          style={{ flex: 1 }}
                        >
                          {opt.label}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}

              <Button
                label={t('import.commit_btn', { count: validRowsToCommit.length })}
                disabled={validRowsToCommit.length === 0 || commitMutation.isPending}
                loading={commitMutation.isPending}
                onPress={() => void handleCommitImport()}
              />
            </Card>

            {/* Row-by-Row Preview List */}
            <Card>
              <AppText variant="subtitle">{t('import.rows_preview_title')}</AppText>
              <View style={{ gap: theme.spacing.xs }}>
                {previewData.rows.slice(0, 60).map((r) => {
                  const isInvalid = r.status === 'invalid';
                  const isDuplicate = Boolean(r.duplicate);
                  return (
                    <View
                      key={r.row}
                      style={[
                        styles.rowCard,
                        {
                          borderColor: isInvalid
                            ? theme.colors.danger
                            : isDuplicate
                              ? theme.colors.warning
                              : theme.colors.border,
                          backgroundColor: isInvalid
                            ? `${theme.colors.danger}0D`
                            : theme.colors.surfaceAlt,
                          borderRadius: theme.radius.control,
                          padding: theme.spacing.sm,
                          gap: 4,
                        },
                      ]}
                    >
                      <View style={styles.rowHeader}>
                        <AppText variant="bodyStrong">
                          {t('import.row_number', { row: r.row })}
                        </AppText>
                        <Badge
                          label={
                            isInvalid
                              ? t('import.status_invalid')
                              : isDuplicate
                                ? t('import.status_duplicate')
                                : t('import.status_valid')
                          }
                          variant={
                            isInvalid ? 'danger' : isDuplicate ? 'warning' : 'success'
                          }
                        />
                      </View>

                      {isInvalid ? (
                        <AppText variant="caption" color={theme.colors.danger}>
                          {(r.errors ?? []).join('; ')}
                        </AppText>
                      ) : (
                        <View style={styles.rowHeader}>
                          <View style={{ flex: 1 }}>
                            <AppText variant="caption">
                              {r.category} •{' '}
                              {r.transactionDate
                                ? formatDateDisplay(r.transactionDate, language)
                                : '-'}
                            </AppText>
                            {r.description ? (
                              <AppText variant="caption" muted numberOfLines={1}>
                                {r.description}
                              </AppText>
                            ) : null}
                          </View>
                          <AppText
                            variant="bodyStrong"
                            color={
                              r.type === 'expense'
                                ? theme.colors.expense
                                : theme.colors.income
                            }
                          >
                            {r.type === 'expense' ? '-' : '+'}{' '}
                            {formatAmount(r.amount ?? 0)}
                          </AppText>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </Card>
          </>
        ) : null}

        {/* 4. Commit Result Summary Card */}
        {commitResult ? (
          <Card style={{ borderColor: theme.colors.income }}>
            <View style={[styles.cardTitleRow, { gap: theme.spacing.xs }]}>
              <Feather name="check-circle" size={20} color={theme.colors.income} />
              <AppText variant="subtitle" color={theme.colors.income}>
                {t('import.result_title')}
              </AppText>
            </View>

            <View style={styles.rowHeader}>
              <AppText variant="body">{t('import.result_imported')}:</AppText>
              <AppText variant="bodyStrong" color={theme.colors.income}>
                {commitResult.imported}
              </AppText>
            </View>

            <View style={styles.rowHeader}>
              <AppText variant="body">{t('import.result_skipped')}:</AppText>
              <AppText variant="bodyStrong">{commitResult.skipped}</AppText>
            </View>

            {commitResult.createdCategories.length > 0 ? (
              <View style={{ gap: 4 }}>
                <AppText variant="caption" muted>
                  {t('import.result_created_categories')}:
                </AppText>
                <AppText variant="bodyStrong">
                  {commitResult.createdCategories.join(', ')}
                </AppText>
              </View>
            ) : null}

            <Button
              label={t('import.go_to_transactions')}
              onPress={() => router.push('/(tabs)/transactions')}
            />
          </Card>
        ) : null}

        {/* 4. Notifikasi & Efek Pasca-Import Notice */}
        <Card>
          <View style={[styles.cardTitleRow, { gap: theme.spacing.xs }]}>
            <Feather name="bell" size={18} color={theme.colors.primary} />
            <AppText variant="subtitle">{t('import.notification_notice_title')}</AppText>
          </View>
          <AppText variant="caption" muted>
            {t('import.notification_notice_desc')}
          </AppText>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  specBox: {
    width: '100%',
  },
  guideBox: {
    width: '100%',
    borderWidth: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mismatchSubBox: {
    width: '100%',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  summaryCell: {
    flex: 1,
    minWidth: '45%',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  rowCard: {
    borderWidth: 1,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
});
