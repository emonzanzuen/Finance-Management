import { useCallback } from 'react';
import { usePreferences } from '@/context/PreferencesContext';
import { translate } from './translate';

export { translate };

export function useTranslation() {
  const { language } = usePreferences();
  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(language, key, params),
    [language],
  );
  return { t, language };
}
