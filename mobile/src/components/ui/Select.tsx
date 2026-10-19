import { useState } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/theme/useTheme';
import { AppText } from './AppText';
import { BottomSheet } from './BottomSheet';

export type SelectOption = {
  value: string;
  label: string;
  color?: string;
};

type Props = {
  label?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  containerStyle?: ViewStyle;
};

export function Select({
  label,
  value,
  options,
  onChange,
  placeholder = '-',
  error,
  disabled = false,
  containerStyle,
}: Props) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const selected = options.find((opt) => opt.value === value);

  return (
    <View style={[{ gap: theme.spacing.xs }, containerStyle]}>
      {label ? <AppText variant="bodyStrong">{label}</AppText> : null}
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[
          styles.trigger,
          {
            minHeight: theme.sizes.touchTarget,
            borderRadius: theme.radius.control,
            borderColor: error ? theme.colors.danger : theme.colors.border,
            backgroundColor: disabled ? theme.colors.surfaceAlt : theme.colors.surface,
            paddingHorizontal: theme.spacing.md,
            gap: theme.spacing.sm,
          },
        ]}
      >
        {selected?.color ? (
          <View
            style={[
              styles.colorDot,
              { backgroundColor: selected.color, borderRadius: theme.radius.full },
            ]}
          />
        ) : null}
        <AppText
          style={styles.label}
          color={selected ? theme.colors.text : theme.colors.textMuted}
        >
          {selected ? selected.label : placeholder}
        </AppText>
        <Feather name="chevron-down" size={18} color={theme.colors.textMuted} />
      </Pressable>
      {error ? (
        <AppText variant="caption" color={theme.colors.danger}>
          {error}
        </AppText>
      ) : null}

      <BottomSheet visible={open} title={label ?? placeholder} onClose={() => setOpen(false)}>
        <View style={{ gap: theme.spacing.xs }}>
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <Pressable
                key={opt.value}
                accessibilityRole="button"
                onPress={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                style={[
                  styles.optionRow,
                  {
                    minHeight: theme.sizes.touchTarget,
                    borderRadius: theme.radius.control,
                    backgroundColor: active ? theme.colors.surfaceAlt : theme.colors.surface,
                    borderColor: active ? theme.colors.primary : theme.colors.border,
                    paddingHorizontal: theme.spacing.md,
                    gap: theme.spacing.sm,
                  },
                ]}
              >
                {opt.color ? (
                  <View
                    style={[
                      styles.colorDot,
                      { backgroundColor: opt.color, borderRadius: theme.radius.full },
                    ]}
                  />
                ) : null}
                <AppText
                  variant={active ? 'bodyStrong' : 'body'}
                  color={active ? theme.colors.primary : theme.colors.text}
                  style={styles.label}
                >
                  {opt.label}
                </AppText>
                {active ? (
                  <Feather name="check" size={18} color={theme.colors.primary} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  label: {
    flex: 1,
  },
  colorDot: {
    width: 12,
    height: 12,
  },
});
