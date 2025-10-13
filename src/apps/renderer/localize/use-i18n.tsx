import i18next from 'i18next';
import { useEffect } from 'react';

import { isLanguage, Language } from '../../shared/Locale/Language';
import { i18nStore } from '../localize/i18n.store';
import dayjs from 'dayjs';
import DayJsLocales from '@/apps/shared/Locale/DayJsLocales';

function updateLanguage(language: string) {
  if (isLanguage(language)) {
    i18nStore.setState({ language });
    void i18next.changeLanguage(language);
    dayjs.locale(DayJsLocales[language]);
  }
}

async function refreshLanguage() {
  const language = await window.electron.getConfigKey('preferedLanguage');
  updateLanguage(language);
}

export function useI18n() {
  useEffect(() => {
    void refreshLanguage();
    return window.electron.listenToConfigKeyChange<Language>('preferedLanguage', updateLanguage);
  }, []);
}
