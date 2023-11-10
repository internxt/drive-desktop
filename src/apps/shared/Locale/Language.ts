export const languages = ['es', 'en', 'fr'] as const;

export type Language = (typeof languages)[number];

export const DEFAULT_LANGUAGE = 'en';

export function isLanguage(maybe: string): maybe is Language {
  return languages.includes(maybe as Language);
}
