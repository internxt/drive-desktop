import { useCallback } from 'react';
import { i18nStore } from './i18n.store';
import { Language, TranslationPath, Translations } from './i18n.types';
import { en } from './languages/en';
import { es } from './languages/es';
import { fr } from './languages/fr';

const translations: Translations = { en, es, fr };

export function getI18nValue(language: Language, path: TranslationPath, ...args: string[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const translation = translations[language] as any;

  let value = path.split('.').reduce((current, key) => current?.[key], translation);

  if (typeof value !== 'string') return path;

  for (const [index, arg] of args.entries()) {
    value = value.replace(`{${index}}`, arg);
  }

  return value;
}

export function useI18n() {
  const language = i18nStore((s) => s.language);

  const t = useCallback(
    (path: TranslationPath, ...args: string[]) => {
      return getI18nValue(language, path, ...args);
    },
    [language],
  );

  return { t, language };
}
