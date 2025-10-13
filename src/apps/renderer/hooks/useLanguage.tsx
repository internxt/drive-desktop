import i18next from 'i18next';
import { useEffect } from 'react';

import { isLanguage, Language } from '../../shared/Locale/Language';
import { setLanguage } from '../localize/language.store';
import dayjs from 'dayjs';
import DayJsLocales from '@/apps/shared/Locale/DayJsLocales';

export function useLanguage() {
  function updateLanguage(language: Language) {
    if (isLanguage(language)) {
      setLanguage({ language });
      void i18next.changeLanguage(language);
      dayjs.locale(DayJsLocales[language]);
    }
  }

  async function refreshLanguage() {
    const language = await window.electron.getConfigKey('preferedLanguage');
    setLanguage({ language });
  }

  useEffect(() => {
    void refreshLanguage();
    return window.electron.listenToConfigKeyChange<Language>('preferedLanguage', updateLanguage);
  }, []);
}
