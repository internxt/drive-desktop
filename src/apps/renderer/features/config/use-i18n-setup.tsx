import { useEffect } from 'react';

import dayjs from 'dayjs';
import DayJsLocales from '@/apps/shared/Locale/DayJsLocales';
import { Language } from '@internxt/drive-desktop-core/build/frontend/core/i18n';
import { configStore } from './config.store';

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
