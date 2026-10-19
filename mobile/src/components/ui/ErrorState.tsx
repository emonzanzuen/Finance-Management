import { StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from '@/i18n/useTranslation';
import { useTheme } from '@/theme/useTheme';
import { AppText } from './AppText';
import { Button } from './Button';
import { Card } from './Card';

type Props = {
  message?: string;
  onRetry?: () => void;
};

export function ErrorState({ message, onRetry }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Card style={styles.card}>
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: theme.colors.surfaceAlt,
            borderRadius: theme.radius.full,
          },
        ]}
      >
        <Feather name="alert-circle" size={28} color={theme.colors.danger} />
      </View>
      <AppText variant="bodyStrong" style={styles.center}>
        {t('common.error')}
      </AppText>
      {message ? (
        <AppText variant="caption" muted style={styles.center}>
          {message}
        </AppText>
      ) : null}
      {onRetry ? (
        <Button
          variant="secondary"
          label={t('common.retry')}
          onPress={onRetry}
          style={{ marginTop: theme.spacing.xs }}
        />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  iconCircle: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    textAlign: 'center',
  },
});
