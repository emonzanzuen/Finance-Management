import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from '@/i18n/useTranslation';
import { useTheme } from '@/theme/useTheme';
import { AppText } from './AppText';
import { Button } from './Button';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!loading) onCancel();
      }}
    >
      <View
        style={[
          styles.backdrop,
          { backgroundColor: theme.colors.overlay, padding: theme.spacing.lg },
        ]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => {
            if (!loading) onCancel();
          }}
        />
        <View
          style={[
            styles.dialog,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.card,
              padding: theme.spacing.lg,
              gap: theme.spacing.md,
            },
          ]}
        >
          <AppText variant="subtitle">{title}</AppText>
          <AppText muted>{message}</AppText>
          <View style={[styles.actions, { gap: theme.spacing.sm }]}>
            <Button
              variant="secondary"
              label={cancelLabel ?? t('common.cancel')}
              disabled={loading}
              onPress={onCancel}
              style={styles.btn}
            />
            <Button
              variant={danger ? 'danger' : 'primary'}
              label={confirmLabel ?? t('common.confirm')}
              loading={loading}
              onPress={onConfirm}
              style={styles.btn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialog: {
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
  },
  actions: {
    flexDirection: 'row',
  },
  btn: {
    flex: 1,
  },
});
