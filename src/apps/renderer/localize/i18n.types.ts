import { en } from './languages/en';

export type Language = 'es' | 'en' | 'fr';
export type Translation = typeof en;
export type Translations = Record<Language, Translation>;

/**
 * v2.6.0 Daniel Jiménez
 * This type generates all possible paths from the translations.
 * We set a maximum depth of 10 for a translation path.
 */
type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
type Paths<T, D extends number = 10> = [D] extends [never]
  ? never
  : T extends object
    ? {
        [K in keyof T]-?: K extends string | number ? (T[K] extends object ? `${K}.${Paths<T[K], Prev[D]> & string}` : `${K}`) : never;
      }[keyof T]
    : never;

export type TranslationPath = Paths<Translation>;
