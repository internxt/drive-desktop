import { i18nStore } from './i18n.store';
import { TranslationKey, Translations } from './i18n.types';
import { en } from './languages/en';
import { es } from './languages/es';
import { fr } from './languages/fr';

const translations: Translations = { en, es, fr };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getNestedValue(obj: any, path: string) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function globalI18n(translations: Translations, key: string, ...args: string[]) {
  const language = i18nStore((s) => s.language);
  const translation = translations[language];

  let value = getNestedValue(translation, key);

  if (typeof value !== 'string') return key;

  for (const [index, arg] of args.entries()) {
    value = value.replace(`{${index}}`, arg);
  }

  return value;
}

export function i18n(key: TranslationKey, ...args: string[]) {
  return globalI18n(translations, key, ...args);
}
