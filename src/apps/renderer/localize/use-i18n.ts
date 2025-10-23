import { useCallback } from 'react';
import { Language, TranslationArgs, TranslationPath } from '@internxt/drive-desktop-core/build/frontend/core/i18n';
import { I18nModule } from '@internxt/drive-desktop-core/build/frontend/core/i18n';
import { configStore } from '../features/config/config.store';

const translations = {
  en: I18nModule.en,
  es: I18nModule.es,
  fr: I18nModule.fr,
};

export function getI18nValue(language: Language, path: TranslationPath, args?: TranslationArgs) {
  const translation = translations[language];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value = path.split('.').reduce((current: any, key) => current?.[key], translation);

  if (typeof value !== 'string') return path;

  if (args) {
    for (const [key, arg] of Object.entries(args)) {
      value = value.replace(`{{${key}}}`, arg);
    }
  }

  return value;
}

export function useI18n() {
  const language = configStore((s) => s.language);

  const t = useCallback(
    (path: TranslationPath, args?: TranslationArgs) => {
      return getI18nValue(language, path, args);
    },
    [language],
  );

  return { t, translate: t, language };
}

// export function t(path: TranslationPath, ...args: string[]) {
//   const language = i18nStore.getState().language;
//   return getI18nValue(language, path, ...args);
// }
