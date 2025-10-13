import { globalI18n } from './global.i18n';
import { Language, TranslationKey, Translations } from './i18n.types';
import { en } from './languages/en';
import { es } from './languages/es';
import { fr } from './languages/fr';

const translations: Record<Language, Translations> = {
  en,
  es,
  fr,
};

export const i18n = (key: TranslationKey, ...args: string[]) => globalI18n(translations, key, ...args);
