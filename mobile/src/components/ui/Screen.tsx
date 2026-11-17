import type { ReactNode } from 'react';
import { ScrollView, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/useTheme';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: ViewStyle;
};

/** Safe-area aware screen container using theme background. */
export function Screen({ children, scroll = false, padded = true, style }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const container: ViewStyle = {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: insets.top,
  };
  const content: ViewStyle = padded
    ? { flex: 1, padding: theme.spacing.lg, gap: theme.spacing.lg, ...style }
    : { flex: 1, ...style };

  if (scroll) {
    return (
      <View style={container}>
        <ScrollView
          contentContainerStyle={{ padding: padded ? theme.spacing.lg : 0, gap: padded ? theme.spacing.lg : 0, ...style }}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </View>
    );
  }
  return (
    <View style={container}>
      <View style={content}>{children}</View>
    </View>
  );
}
