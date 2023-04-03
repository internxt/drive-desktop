export const languages = ['es', 'en', 'fr'] as const;

export type Language = typeof languages[number];

export const DEFAULT_LANGUAGE: Language = 'en';

export function isLanguage(maybe: string): maybe is Language {
  return languages.includes(maybe as Language);
}
