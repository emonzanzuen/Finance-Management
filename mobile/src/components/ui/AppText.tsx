import { Text, type TextProps } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import type { TypographyVariant } from '@/theme/typography';

type Props = TextProps & {
  variant?: TypographyVariant;
  muted?: boolean;
  color?: string;
};

export function AppText({ variant = 'body', muted = false, color, style, ...rest }: Props) {
  const theme = useTheme();
  return (
    <Text
      {...rest}
      style={[theme.typography[variant], { color: color ?? (muted ? theme.colors.textMuted : theme.colors.text) }, style]}
    />
  );
}
