import type { ReactNode } from 'react';
import { ScrollView, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/useTheme';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
};

/** Safe-area aware screen container using theme background. */
export function Screen({ children, scroll = false, style }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const container: ViewStyle = {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: insets.top,
  };
  const content: ViewStyle = { padding: theme.spacing.lg, gap: theme.spacing.lg, ...style };

  if (scroll) {
    return (
      <View style={container}>
        <ScrollView contentContainerStyle={content} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </View>
    );
  }
  return <View style={[container, content]}>{children}</View>;
}
