import { TLanguage } from './language.store';

type Translations<T extends string> = Record<TLanguage, Record<T, string>>;

const formatString = (template: string, ...args: string[]) => {
  return template.replace(/{(\d+)}/g, (match, number) => {
    return typeof args[number] !== 'undefined' ? args[number] : match;
  });
};

export const globalI18n = <T extends string>(translations: Translations<T>, key: T, ...args: string[]) => {
  const language = 'en';
  const value = translations[language][key];
  if (args.length === 0) return value;
  return formatString(value, ...args);
};
