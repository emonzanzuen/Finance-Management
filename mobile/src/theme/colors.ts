export type ColorTokens = {
  primary: string;
  onPrimary: string;
  income: string;
  expense: string;
  warning: string;
  info: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  tabInactive: string;
  danger: string;
  overlay: string;
};

export const lightColors: ColorTokens = {
  primary: '#4F46E5',
  onPrimary: '#FFFFFF',
  income: '#10B981',
  expense: '#EF4444',
  warning: '#F59E0B',
  info: '#0EA5E9',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9',
  border: '#E2E8F0',
  text: '#0F172A',
  textMuted: '#64748B',
  tabInactive: '#94A3B8',
  danger: '#EF4444',
  overlay: 'rgba(15, 23, 42, 0.5)',
};

export const darkColors: ColorTokens = {
  primary: '#6366F1',
  onPrimary: '#FFFFFF',
  income: '#10B981',
  expense: '#EF4444',
  warning: '#F59E0B',
  info: '#0EA5E9',
  background: '#0B1120',
  surface: '#111A2E',
  surfaceAlt: '#1A2540',
  border: '#24304D',
  text: '#F1F5F9',
  textMuted: '#94A3B8',
  tabInactive: '#64748B',
  danger: '#EF4444',
  overlay: 'rgba(0, 0, 0, 0.6)',
};
