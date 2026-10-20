import { useEffect, useState } from 'react';
import { Animated, Platform, View, type DimensionValue, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/useTheme';

type Props = {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
};

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

export function Skeleton({
  width = '100%',
  height = 18,
  borderRadius,
  style,
}: Props) {
  const theme = useTheme();
  const [opacity] = useState(() => new Animated.Value(0.45));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 650,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 650,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: borderRadius ?? theme.radius.control,
          backgroundColor: theme.colors.surfaceAlt,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonList({ count = 4, itemHeight = 72 }: { count?: number; itemHeight?: number }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.sm }}>
      {Array.from({ length: count }).map((_, idx) => (
        <Skeleton key={idx} height={itemHeight} borderRadius={theme.radius.card} />
      ))}
    </View>
  );
}
