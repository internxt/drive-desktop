import { useEffect } from 'react';

import { i18nStore } from '../localize/i18n.store';
import dayjs from 'dayjs';
import DayJsLocales from '@/apps/shared/Locale/DayJsLocales';
import { Language } from '@internxt/drive-desktop-core/build/frontend/core/i18n';

function updateLanguage(language: Language) {
  i18nStore.setState({ language });
  dayjs.locale(DayJsLocales[language]);
}

async function refreshLanguage() {
  const language = await globalThis.window.electron.getConfigKey('preferedLanguage');
  updateLanguage(language as Language);
}

export function useI18nSetup() {
  useEffect(() => {
    void refreshLanguage();
    return globalThis.window.electron.listenToConfigKeyChange<Language>('preferedLanguage', updateLanguage);
  }, []);
}
