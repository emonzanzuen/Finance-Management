import { StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/theme/useTheme';
import { AppText } from './AppText';
import { Button } from './Button';
import { Card } from './Card';

type Props = {
  icon?: React.ComponentProps<typeof Feather>['name'];
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  icon = 'inbox',
  title,
  subtitle,
  actionLabel,
  onAction,
}: Props) {
  const theme = useTheme();

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
        <Feather name={icon} size={28} color={theme.colors.textMuted} />
      </View>
      <AppText variant="bodyStrong" style={styles.center}>
        {title}
      </AppText>
      {subtitle ? (
        <AppText variant="caption" muted style={styles.center}>
          {subtitle}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
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
