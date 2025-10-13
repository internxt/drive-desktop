import { Translations } from './i18n.types';
import { languageStore } from './language.store';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getNestedValue(obj: any, path: string) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

export const globalI18n = (translations: Translations, key: string, ...args: string[]) => {
  const language = languageStore((s) => s.language);
  const translation = translations[language];

  let value = getNestedValue(translation, key);

  if (value === undefined || value === null || typeof value !== 'string') {
    return key;
  }

  for (const [index, arg] of args.entries()) {
    value = value.replace(`{${index}}`, arg);
  }

  return value;
};
