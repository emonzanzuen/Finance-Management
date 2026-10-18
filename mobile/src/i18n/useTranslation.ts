import { useCallback } from 'react';
import { usePreferences, type Language } from '@/context/PreferencesContext';
import en from './en.json';
import id from './id.json';

type Dict = { [key: string]: string | Dict };

const dictionaries: Record<Language, Dict> = { id: id as Dict, en: en as Dict };

function lookup(dict: Dict, key: string): string | undefined {
  let node: string | Dict | undefined = dict;
  for (const part of key.split('.')) {
    if (node === undefined || typeof node === 'string') return undefined;
    node = node[part];
  }
  return typeof node === 'string' ? node : undefined;
}

/** Pure translate function with {name} interpolation. Falls back to Indonesian, then to the key. */
export function translate(
  language: Language,
  key: string,
  params?: Record<string, string | number>,
): string {
  const template = lookup(dictionaries[language], key) ?? lookup(dictionaries.id, key) ?? key;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

export function useTranslation() {
  const { language } = usePreferences();
  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(language, key, params),
    [language],
  );
  return { t, language };
}
