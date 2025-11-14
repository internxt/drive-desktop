import { Language, TranslationFn } from './core/i18n/i18n.types';

export type LocalContextProps = {
  translate: TranslationFn;
  language: Language;
};
