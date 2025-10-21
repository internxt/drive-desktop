import { Language } from '@internxt/drive-desktop-core/build/frontend/core/i18n';
import en from 'dayjs/locale/en';
import es from 'dayjs/locale/es';
import fr from 'dayjs/locale/fr';

const DayJsLocales: Record<Language, ILocale> = {
  en,
  es,
  fr,
} as const;

export default DayJsLocales;
