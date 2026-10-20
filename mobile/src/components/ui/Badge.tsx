import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { AppText } from './AppText';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'neutral';

type Props = {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
};

export function Badge({ label, variant = 'neutral', style }: Props) {
  const theme = useTheme();

  const colorMap: Record<BadgeVariant, { fg: string; bg: string }> = {
    success: { fg: theme.colors.income, bg: `${theme.colors.income}1F` },
    warning: { fg: theme.colors.warning, bg: `${theme.colors.warning}1F` },
    danger: { fg: theme.colors.danger, bg: `${theme.colors.danger}1F` },
    info: { fg: theme.colors.info, bg: `${theme.colors.info}1F` },
    primary: { fg: theme.colors.primary, bg: `${theme.colors.primary}1F` },
    neutral: { fg: theme.colors.textMuted, bg: theme.colors.surfaceAlt },
  };

  const { fg, bg } = colorMap[variant];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          borderRadius: theme.radius.full,
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xs,
        },
        style,
      ]}
    >
      <AppText variant="caption" color={fg} style={styles.text}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
  },
});
