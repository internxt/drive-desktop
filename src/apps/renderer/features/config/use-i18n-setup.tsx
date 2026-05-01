import { Language } from '@internxt/drive-desktop-core/build/frontend/core/i18n';
import dayjs from 'dayjs';
import de from 'dayjs/locale/de';
import en from 'dayjs/locale/en';
import es from 'dayjs/locale/es';
import fr from 'dayjs/locale/fr';
import { useEffect } from 'react';
import { configStore } from './config.store';

const DayJsLocales: Record<Language, ILocale> = {
  en,
  es,
  fr,
  de,
};

function updateLanguage(language: Language) {
  configStore.setState({ language });
  dayjs.locale(DayJsLocales[language]);
}

export function useI18nSetup() {
  useEffect(() => {
    void globalThis.window.electron.getLanguage().then(updateLanguage);
    return globalThis.window.electron.listenToConfigKeyChange<Language>('preferedLanguage', updateLanguage);
  }, []);
}
