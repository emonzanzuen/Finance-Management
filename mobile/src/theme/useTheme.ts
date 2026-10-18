import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { usePreferences } from '@/context/PreferencesContext';
import { darkColors, lightColors, type ColorTokens } from './colors';
import { radius, sizes, spacing } from './spacing';
import { typography } from './typography';

export type Theme = {
  isDark: boolean;
  colors: ColorTokens;
  spacing: typeof spacing;
  radius: typeof radius;
  sizes: typeof sizes;
  typography: typeof typography;
};

export function useTheme(): Theme {
  const system = useColorScheme();
  const { theme } = usePreferences();
  const isDark = theme === 'system' ? system === 'dark' : theme === 'dark';
  return useMemo(
    () => ({ isDark, colors: isDark ? darkColors : lightColors, spacing, radius, sizes, typography }),
    [isDark],
  );
}
