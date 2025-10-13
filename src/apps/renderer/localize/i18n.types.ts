import { en } from './languages/en';

export const languages = ['es', 'en', 'fr'] as const;
export type Language = (typeof languages)[number];
export type Translation = typeof en;
export type Translations = Record<Language, Translation>;

type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

type Paths<T, D extends number = 10> = [D] extends [never]
  ? never
  : T extends object
    ? {
        [K in keyof T]-?: K extends string | number ? (T[K] extends object ? `${K}.${Paths<T[K], Prev[D]> & string}` : `${K}`) : never;
      }[keyof T]
    : never;

export type TranslationKey = Paths<Translation>;
