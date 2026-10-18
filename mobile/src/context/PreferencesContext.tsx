import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePreference = 'system' | 'light' | 'dark';
export type Language = 'id' | 'en';

export const CURRENCY_CODES = [
  'IDR', 'USD', 'EUR', 'SGD', 'MYR', 'JPY', 'GBP', 'AUD', 'SAR', 'CNY', 'KRW', 'THB',
] as const;
export type CurrencyCode = (typeof CURRENCY_CODES)[number];

const KEYS = {
  theme: 'finmanage.theme',
  language: 'finmanage.language',
  currency: 'finmanage.currency',
} as const;

type PreferencesValue = {
  ready: boolean;
  theme: ThemePreference;
  language: Language;
  currency: CurrencyCode;
  setTheme: (value: ThemePreference) => void;
  setLanguage: (value: Language) => void;
  setCurrency: (value: CurrencyCode) => void;
};

const PreferencesContext = createContext<PreferencesValue | null>(null);

function isTheme(v: string | null): v is ThemePreference {
  return v === 'system' || v === 'light' || v === 'dark';
}
function isLanguage(v: string | null): v is Language {
  return v === 'id' || v === 'en';
}
function isCurrency(v: string | null): v is CurrencyCode {
  return v !== null && (CURRENCY_CODES as readonly string[]).includes(v);
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [theme, setThemeState] = useState<ThemePreference>('system');
  const [language, setLanguageState] = useState<Language>('id');
  const [currency, setCurrencyState] = useState<CurrencyCode>('IDR');

  useEffect(() => {
    let active = true;
    AsyncStorage.multiGet([KEYS.theme, KEYS.language, KEYS.currency])
      .then((entries) => {
        if (!active) return;
        const map = Object.fromEntries(entries);
        if (isTheme(map[KEYS.theme] ?? null)) setThemeState(map[KEYS.theme] as ThemePreference);
        if (isLanguage(map[KEYS.language] ?? null)) setLanguageState(map[KEYS.language] as Language);
        if (isCurrency(map[KEYS.currency] ?? null)) setCurrencyState(map[KEYS.currency] as CurrencyCode);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<PreferencesValue>(
    () => ({
      ready,
      theme,
      language,
      currency,
      setTheme: (v) => {
        setThemeState(v);
        void AsyncStorage.setItem(KEYS.theme, v);
      },
      setLanguage: (v) => {
        setLanguageState(v);
        void AsyncStorage.setItem(KEYS.language, v);
      },
      setCurrency: (v) => {
        setCurrencyState(v);
        void AsyncStorage.setItem(KEYS.currency, v);
      },
    }),
    [ready, theme, language, currency],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider');
  return ctx;
}
