import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { AppText } from './AppText';

type Props = {
  name: string;
  color: string;
  selected?: boolean;
  onPress?: () => void;
};

export function CategoryChip({ name, color, selected = false, onPress }: Props) {
  const theme = useTheme();

  const content = (
    <View
      style={[
        styles.chip,
        {
          borderRadius: theme.radius.full,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
          backgroundColor: selected ? theme.colors.surfaceAlt : theme.colors.surface,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.xs,
          gap: theme.spacing.xs,
        },
      ]}
    >
      <View
        style={[
          styles.dot,
          { backgroundColor: color, borderRadius: theme.radius.full },
        ]}
      />
      <AppText
        variant="caption"
        color={selected ? theme.colors.primary : theme.colors.text}
      >
        {name}
      </AppText>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={styles.touchWrapper}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  touchWrapper: {
    minHeight: 40,
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  dot: {
    width: 10,
    height: 10,
  },
});
