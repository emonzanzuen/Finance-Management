import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/theme/useTheme';
import { AppText } from './AppText';

type Props = Omit<TextInputProps, 'style'> & {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ComponentProps<typeof Feather>['name'];
  secureToggle?: boolean;
  containerStyle?: ViewStyle;
};

export function TextField({
  label,
  error,
  hint,
  leftIcon,
  secureToggle = false,
  secureTextEntry,
  containerStyle,
  editable = true,
  ...rest
}: Props) {
  const theme = useTheme();
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));
  const [focused, setFocused] = useState(false);

  const isSecure = secureToggle ? hidden : secureTextEntry;
  const borderColor = error
    ? theme.colors.danger
    : focused
      ? theme.colors.primary
      : theme.colors.border;

  return (
    <View style={[{ gap: theme.spacing.xs }, containerStyle]}>
      {label ? <AppText variant="bodyStrong">{label}</AppText> : null}
      <View
        style={[
          styles.inputWrapper,
          {
            minHeight: theme.sizes.touchTarget,
            borderRadius: theme.radius.control,
            borderColor,
            backgroundColor: editable ? theme.colors.surface : theme.colors.surfaceAlt,
            paddingHorizontal: theme.spacing.md,
            gap: theme.spacing.sm,
          },
        ]}
      >
        {leftIcon ? (
          <Feather name={leftIcon} size={18} color={theme.colors.textMuted} />
        ) : null}
        <TextInput
          {...rest}
          editable={editable}
          secureTextEntry={isSecure}
          placeholderTextColor={theme.colors.textMuted}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          style={[
            theme.typography.body,
            styles.input,
            {
              color: editable ? theme.colors.text : theme.colors.textMuted,
              paddingVertical: theme.spacing.sm,
            },
          ]}
        />
        {secureToggle ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={12}
            onPress={() => setHidden((prev) => !prev)}
            style={styles.iconButton}
          >
            <Feather
              name={hidden ? 'eye' : 'eye-off'}
              size={18}
              color={theme.colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <AppText variant="caption" color={theme.colors.danger}>
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" muted>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  input: {
    flex: 1,
  },
  iconButton: {
    minWidth: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
