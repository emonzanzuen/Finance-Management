import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Feather } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { useToast } from '@/components/ui/Toast';
import { usePostReceiptConsent, useScanReceipt } from '@/hooks/useReceipts';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/i18n/useTranslation';
import { useTheme } from '@/theme/useTheme';
import { ApiError, REQUEST_TIMEOUT_CODE, type ReceiptScanResponse } from '@/types/api';

const MAX_LONGEST_SIDE = 1280;
const JPEG_QUALITY = 0.7;

type ScreenStep = 'consent' | 'picker' | 'analyzing' | 'result';

export default function ScanReceiptScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { showToast } = useToast();

  const { profile, refreshProfile } = useAuth();

  // Consent screen only appears until the user has agreed (SCN-08, 16.10)
  const [step, setStep] = useState<ScreenStep>(profile?.receiptScanConsent ? 'picker' : 'consent');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ReceiptScanResponse | null>(null);
  const [isPicking, setIsPicking] = useState(false);

  const consentMutation = usePostReceiptConsent();
  const scanMutation = useScanReceipt();

  useEffect(() => {
    if (profile?.receiptScanConsent && step === 'consent') {
      setStep('picker');
    }
  }, [profile?.receiptScanConsent, step]);

  const handleConsent = useCallback(async () => {
    try {
      await consentMutation.mutateAsync();
      await refreshProfile();
      setStep('picker');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'CONSENT_REQUIRED') {
        showToast(t('transactions.scan.consent_required'), 'error');
      } else if (err instanceof ApiError) {
        showToast(err.message, 'error');
      } else {
        showToast(t('errors.UNKNOWN'), 'error');
      }
    }
  }, [consentMutation, refreshProfile, showToast, t]);

  const runScan = useCallback(
    async function runScan(imageUri: string) {
      setSelectedImage(imageUri);
      setStep('analyzing');

      const showFillOrRetry = (title: string, message: string) => {
        Alert.alert(title, message, [
          { text: t('transactions.scan.fill_manual'), onPress: () => router.replace('/transaction/form') },
          { text: t('transactions.scan.try_again'), onPress: () => void runScan(imageUri) },
        ]);
      };

      try {
        const result = await scanMutation.mutateAsync(imageUri);
        setScanResult(result);
        setStep('result');
      } catch (err) {
        setStep('picker');

        if (!(err instanceof ApiError)) {
          showFillOrRetry(
            t('transactions.scan.network_error_title'),
            t('transactions.scan.network_error_message'),
          );
          return;
        }

        switch (err.code) {
          case 'SCAN_QUOTA_EXCEEDED':
            Alert.alert(
              t('transactions.scan.quota_exceeded_title'),
              t('transactions.scan.quota_exceeded_message'),
              [
                { text: t('transactions.scan.fill_manual'), onPress: () => router.replace('/transaction/form') },
                { text: t('common.cancel'), style: 'cancel' },
              ],
            );
            break;
          case 'SCAN_FAILED':
            showFillOrRetry(
              t('transactions.scan.failed_title'),
              t('transactions.scan.failed_message'),
            );
            break;
          case 'CONSENT_REQUIRED':
            setStep('consent');
            showToast(t('transactions.scan.consent_required'), 'error');
            break;
          case REQUEST_TIMEOUT_CODE:
            showFillOrRetry(
              t('transactions.scan.timeout_title'),
              t('transactions.scan.timeout_message'),
            );
            break;
          case 'SERVICE_UNAVAILABLE':
            showFillOrRetry(
              t('transactions.scan.service_unavailable_title'),
              t('transactions.scan.service_unavailable_message'),
            );
            break;
          case 'FILE_TOO_LARGE':
            showFillOrRetry(
              t('transactions.scan.failed_title'),
              t('errors.FILE_TOO_LARGE'),
            );
            break;
          case 'UNSUPPORTED_FILE':
            showFillOrRetry(
              t('transactions.scan.failed_title'),
              t('errors.UNSUPPORTED_FILE'),
            );
            break;
          case 'RATE_LIMITED':
            showFillOrRetry(
              t('transactions.scan.failed_title'),
              t('errors.RATE_LIMITED'),
            );
            break;
          default:
            if (err.status === 503) {
              showFillOrRetry(
                t('transactions.scan.service_unavailable_title'),
                t('transactions.scan.service_unavailable_message'),
              );
            } else if (err.status > 0) {
              showFillOrRetry(
                t('transactions.scan.failed_title'),
                err.message || t('transactions.scan.failed_message'),
              );
            } else {
              showFillOrRetry(
                t('transactions.scan.network_error_title'),
                t('transactions.scan.network_error_message'),
              );
            }
        }
      }
    },
    [router, scanMutation, showToast, t],
  );

  const pickImage = useCallback(async (source: 'camera' | 'library') => {
    setIsPicking(true);
    try {
      const permission = await (source === 'camera'
        ? ImagePicker.requestCameraPermissionsAsync()
        : ImagePicker.requestMediaLibraryPermissionsAsync());

      if (!permission.granted) {
        showToast(
          source === 'camera'
            ? t('transactions.scan.camera_permission_denied')
            : t('transactions.scan.gallery_permission_denied'),
          'error'
        );
        return;
      }

      // Do NOT force aspect: [4, 3] because retail receipts (e.g. Indomaret) are long vertical strips.
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: false,
            quality: 0.85,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: false,
            quality: 0.85,
          });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const originalWidth = asset.width ?? 0;
      const originalHeight = asset.height ?? 0;
      const longestSide = Math.max(originalWidth, originalHeight);

      // Resize only along the longest axis to preserve exact aspect ratio of tall thermal receipts
      const resizeActions =
        longestSide > MAX_LONGEST_SIDE && originalWidth > 0 && originalHeight > 0
          ? [
              originalWidth >= originalHeight
                ? { resize: { width: MAX_LONGEST_SIDE } }
                : { resize: { height: MAX_LONGEST_SIDE } },
            ]
          : [];

      const manipulated = await manipulateAsync(
        asset.uri,
        resizeActions,
        { compress: JPEG_QUALITY, format: SaveFormat.JPEG }
      );

      await runScan(manipulated.uri);
    } catch {
      setStep('picker');
      Alert.alert(
        t('transactions.scan.failed_title'),
        t('transactions.scan.failed_message'),
        [
          { text: t('transactions.scan.fill_manual'), onPress: () => router.replace('/transaction/form') },
          { text: t('transactions.scan.try_again'), onPress: () => setStep('picker') },
        ]
      );
    } finally {
      setIsPicking(false);
    }
  }, [runScan, showToast, t, router]);

  const handleRetry = useCallback(() => {
    setSelectedImage(null);
    setScanResult(null);
    setStep('picker');
  }, []);

  const handleFillManual = useCallback(() => {
    router.replace('/transaction/form');
  }, [router]);

  const handleSaveResult = useCallback(() => {
    if (!scanResult) return;
    router.replace(`/transaction/form?scanData=${encodeURIComponent(JSON.stringify(scanResult))}`);
  }, [scanResult, router]);

  const confidenceLabel = (confidence: string) => {
    switch (confidence) {
      case 'high': return t('transactions.scan.confidence_high');
      case 'medium': return t('transactions.scan.confidence_medium');
      default: return t('transactions.scan.confidence_low');
    }
  };

  const renderHeader = () => (
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
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Feather name="arrow-left" size={20} color={theme.colors.text} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <AppText variant="title">{t('transactions.scan.add')}</AppText>
      </View>
    </View>
  );

  if (step === 'consent') {
    return (
      <Screen scroll>
        {renderHeader()}
        <View style={[styles.consentContainer, { gap: theme.spacing.xl }]}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: `${theme.colors.primary}15` },
            ]}
          >
            <Feather name="camera" size={44} color={theme.colors.primary} />
          </View>

          <View style={{ gap: theme.spacing.md }}>
            <AppText variant="title" style={{ textAlign: 'center' }}>
              {t('transactions.scan.consent_title')}
            </AppText>
            <AppText variant="body" style={{ textAlign: 'center', lineHeight: 24 }}>
              {t('transactions.scan.consent_description')}
            </AppText>
          </View>

          <Card style={{ backgroundColor: `${theme.colors.info}10`, borderColor: theme.colors.info, width: '100%' }}>
            <View style={{ gap: theme.spacing.sm }}>
              <AppText variant="bodyStrong" color={theme.colors.info}>
                {t('transactions.scan.consent_points_title')}
              </AppText>
              <AppText variant="caption" style={{ lineHeight: 20 }}>
                • {t('transactions.scan.consent_point_1')}
              </AppText>
              <AppText variant="caption" style={{ lineHeight: 20 }}>
                • {t('transactions.scan.consent_point_2')}
              </AppText>
              <AppText variant="caption" style={{ lineHeight: 20 }}>
                • {t('transactions.scan.consent_point_3')}
              </AppText>
            </View>
          </Card>

          <Button
            label={t('transactions.scan.consent_agree')}
            loading={consentMutation.isPending}
            disabled={consentMutation.isPending}
            onPress={handleConsent}
            style={{ marginTop: theme.spacing.sm, width: '100%' }}
          />
        </View>
      </Screen>
    );
  }

  if (step === 'picker') {
    return (
      <Screen scroll>
        {renderHeader()}
        <View style={[styles.pickerContainer, { gap: theme.spacing.xl }]}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: `${theme.colors.primary}15` },
            ]}
          >
            <Feather name="image" size={44} color={theme.colors.primary} />
          </View>

          <View style={{ gap: theme.spacing.md }}>
            <AppText variant="title" style={{ textAlign: 'center' }}>
              {t('transactions.scan.picker_title')}
            </AppText>
            <AppText variant="body" muted style={{ textAlign: 'center', lineHeight: 24 }}>
              {t('transactions.scan.picker_subtitle')}
            </AppText>
          </View>

          <View style={{ gap: theme.spacing.md, width: '100%' }}>
            <Button
              variant="primary"
              icon="camera"
              label={t('transactions.scan.take_photo')}
              disabled={isPicking || scanMutation.isPending}
              onPress={() => void pickImage('camera')}
            />
            <Button
              variant="secondary"
              icon="image"
              label={t('transactions.scan.choose_gallery')}
              disabled={isPicking || scanMutation.isPending}
              onPress={() => void pickImage('library')}
            />
          </View>

          <AppText variant="caption" muted style={{ textAlign: 'center' }}>
            {t('transactions.scan.picker_hint')}
          </AppText>
        </View>
      </Screen>
    );
  }

  if (step === 'analyzing') {
    return (
      <Screen>
        <View style={[styles.analyzingContainer, { gap: theme.spacing.xl }]}>
          <View style={styles.spinnerContainer}>
            <Feather name="loader" size={48} color={theme.colors.primary} style={styles.spin} />
          </View>
          <AppText variant="title" style={{ textAlign: 'center' }}>
            {t('transactions.scan.analyzing')}
          </AppText>
          <AppText variant="body" muted style={{ textAlign: 'center', lineHeight: 24 }}>
            {t('transactions.scan.analyzing_subtitle')}
          </AppText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      {renderHeader()}
      <View style={[styles.resultContainer, { gap: theme.spacing.lg }]}>
        {selectedImage && (
          <View
            style={[
              styles.imagePreview,
              { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border },
            ]}
          >
            <Image
              source={{ uri: selectedImage }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          </View>
        )}

        <Card style={{ gap: theme.spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <AppText variant="subtitle">{t('transactions.scan.result_title')}</AppText>
            <Badge
              label={confidenceLabel(scanResult?.confidence ?? 'low')}
              variant={
                scanResult?.confidence === 'high' ? 'success' :
                scanResult?.confidence === 'medium' ? 'warning' : 'danger'
              }
            />
          </View>

          <View style={{ gap: theme.spacing.sm }}>
            <View style={styles.resultRow}>
              <AppText variant="caption" muted style={{ width: 110 }}>
                {t('transactions.type')}
              </AppText>
              <AppText
                variant="bodyStrong"
                color={scanResult?.type === 'expense' ? theme.colors.expense : theme.colors.income}
              >
                {scanResult?.type === 'expense' ? t('transactions.expense') : t('transactions.income')}
              </AppText>
            </View>

            <View style={styles.resultRow}>
              <AppText variant="caption" muted style={{ width: 110 }}>
                {t('transactions.amount')}
              </AppText>
              {typeof scanResult?.amount === 'number' && scanResult.amount > 0 ? (
                <AppText
                  variant="title"
                  color={scanResult?.type === 'expense' ? theme.colors.expense : theme.colors.income}
                >
                  Rp {scanResult.amount.toLocaleString('id-ID')}
                </AppText>
              ) : (
                <AppText variant="bodyStrong" color={theme.colors.warning}>
                  {t('transactions.scan.not_detected')}
                </AppText>
              )}
            </View>

            <View style={styles.resultRow}>
              <AppText variant="caption" muted style={{ width: 110 }}>
                {t('transactions.date')}
              </AppText>
              <AppText
                variant="bodyStrong"
                color={scanResult?.transactionDate ? theme.colors.text : theme.colors.warning}
              >
                {scanResult?.transactionDate ?? t('transactions.scan.not_detected')}
              </AppText>
            </View>

            <View style={styles.resultRow}>
              <AppText variant="caption" muted style={{ width: 110 }}>
                {t('transactions.description')}
              </AppText>
              <AppText
                variant="bodyStrong"
                numberOfLines={2}
                style={{ flex: 1 }}
                color={scanResult?.description ? theme.colors.text : theme.colors.warning}
              >
                {scanResult?.description ?? t('transactions.scan.not_detected')}
              </AppText>
            </View>

            <View style={styles.resultRow}>
              <AppText variant="caption" muted style={{ width: 110 }}>
                {t('transactions.scan.suggested_category')}
              </AppText>
              <AppText variant="bodyStrong" style={{ flex: 1 }}>
                {scanResult?.suggestedCategoryId
                  ? t('transactions.scan.category_found')
                  : t('transactions.scan.category_not_found')}
              </AppText>
            </View>
          </View>

          {(scanResult?.warnings?.length ?? 0) > 0 && (
            <View style={{ gap: theme.spacing.xs, marginTop: theme.spacing.xs }}>
              <AppText variant="caption" color={theme.colors.warning}>
                {t('transactions.scan.warnings_title')}
              </AppText>
              {scanResult?.warnings?.map((w, i) => (
                <AppText key={i} variant="caption" color={theme.colors.warning} style={{ marginLeft: 8 }}>
                  • {w}
                </AppText>
              ))}
            </View>
          )}
        </Card>

        <View style={{ gap: theme.spacing.md, marginTop: theme.spacing.xs }}>
          <Button
            label={t('transactions.scan.save_and_continue')}
            loading={scanMutation.isPending}
            onPress={handleSaveResult}
          />
          <Button
            variant="secondary"
            label={t('transactions.scan.try_again')}
            onPress={handleRetry}
          />
          <Button
            variant="outline"
            label={t('transactions.scan.fill_manual')}
            onPress={handleFillManual}
          />
        </View>
      </View>
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
    borderWidth: 1,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  consentContainer: {
    paddingHorizontal: 12,
    paddingTop: 16,
    alignItems: 'center',
  },
  pickerContainer: {
    paddingHorizontal: 12,
    paddingTop: 16,
    alignItems: 'center',
  },
  analyzingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  spinnerContainer: {
    marginBottom: 16,
  },
  spin: {},
  resultContainer: {
    paddingTop: 8,
  },
  imagePreview: {
    width: '100%',
    height: 240,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
