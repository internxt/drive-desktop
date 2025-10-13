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
        [K in keyof T]-?: K extends string | number
          ? `${K}` | (Paths<T[K], Prev[D]> extends never ? never : `${K}.${Paths<T[K], Prev[D]>}`)
          : never;
      }[keyof T]
    : never;

// eslint-disable-next-line sonarjs/redundant-type-aliases
export type TranslationKey = Paths<Translation>;
