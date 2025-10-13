import { Translations } from './i18n.types';
import { Language, languageStore } from './language.store';

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

export const globalI18n = <T extends string>(translations: Record<Language, Translations>, key: T, ...args: string[]) => {
  const language = languageStore((s) => s.language);
  const translation = translations[language];

  window.electron.logger.debug({ msg: 'HEREEEEEEEEEEEEEEEEEEEE', language, translation });

  let value = getNestedValue(translation, key);

  // If value not found, return the key itself
  if (value === undefined || value === null) {
    return key;
  }

  // If it's not a string (still an object), return the key
  if (typeof value !== 'string') {
    return key;
  }

  args.forEach((arg, index) => {
    value = value.replace(`{${index}}`, arg);
  });

  return value;
};
