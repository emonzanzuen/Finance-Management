import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/useTheme';

type Props = {
  percentage: number;
  color?: string;
  height?: number;
  style?: ViewStyle;
};

export function ProgressBar({ percentage, color, height = 10, style }: Props) {
  const theme = useTheme();
  const clamped = Math.max(0, Math.min(100, Number.isFinite(percentage) ? percentage : 0));
  const fillColor = color ?? theme.colors.primary;

  return (
    <View
      style={[
        styles.track,
        {
          height,
          borderRadius: theme.radius.full,
          backgroundColor: theme.colors.surfaceAlt,
        },
        style,
      ]}
    >
      <View
        style={{
          width: `${clamped}%`,
          height: '100%',
          borderRadius: theme.radius.full,
          backgroundColor: fillColor,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
});
