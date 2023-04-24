import es from 'dayjs/locale/es';
import fr from 'dayjs/locale/fr';
import en from 'dayjs/locale/en';
import { Language } from './Language';

const DayJsLocales: Record<Language, ILocale> = {
  en,
  es,
  fr,
} as const;

export default DayJsLocales;
