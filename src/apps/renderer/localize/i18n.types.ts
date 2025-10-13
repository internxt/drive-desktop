import { en } from './languages/en';

export type Language = 'en' | 'es' | 'fr';
export type Translations = typeof en;

// Helper type to create dot notation paths
type Join<K, P> = K extends string | number ? (P extends string | number ? `${K}${'' extends P ? '' : '.'}${P}` : never) : never;

// Depth counter to prevent infinite recursion
type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Recursive type to generate all possible paths through the object
type Paths<T, D extends number = 10> = [D] extends [never]
  ? never
  : T extends object
    ? {
        [K in keyof T]-?: K extends string | number ? `${K}` | Join<K, Paths<T[K], Prev[D]>> : never;
      }[keyof T]
    : '';

export type TranslationKey = Paths<Translations>;
