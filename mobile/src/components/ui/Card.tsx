import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/useTheme';

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.isDark ? theme.colors.border : `${theme.colors.border}B8`,
          borderWidth: 1,
          borderRadius: theme.radius.card,
          padding: theme.spacing.lg,
          gap: theme.spacing.sm,
          shadowColor: '#0F172A',
          shadowOpacity: theme.isDark ? 0 : 0.03,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: theme.isDark ? 0 : 1,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
