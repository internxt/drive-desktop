import dayjs from 'dayjs';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import DayJsLocales from '../../shared/Locale/DayJsLocales';
import {
  DEFAULT_LANGUAGE,
  Language,
  isLanguage,
} from '../../shared/Locale/Language';
import { getConfigKey } from '../utils/query';

const languageDetection = (callback: (lang: Language | undefined) => void) => {
  const run = async () => {
    const stored = await getConfigKey('preferedLanguage');

    if (stored) {
      callback(stored);

      return;
    }

    const systemLangs = await window.electron.getPreferredAppLanguage();
    const parsed = systemLangs.map((l: string) => l.split('-')[0]);

    const preferedLanguageAvailable =
      (parsed.find(isLanguage) as Language) || undefined;

    const language = preferedLanguageAvailable || DEFAULT_LANGUAGE;

    window.electron.setConfigKey('preferedLanguage', language);

    dayjs.locale(DayJsLocales[language]);
    callback(language);
  };

  run();
};

i18next
  .use({
    type: 'languageDetector',
    name: 'Locale language detector',
    async: true,
    init() {
      //no op
    },
    detect: languageDetection,
    cacheUserLanguage(lng: string) {
      return lng;
    },
  })
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources: {
      en: {
        translation: require('./locales/en.json'),
      },
      es: {
        translation: require('./locales/es.json'),
      },
      fr: {
        translation: require('./locales/fr.json'),
      },
    },
    debug: true,
    fallbackLng: DEFAULT_LANGUAGE,
    defaultNS: 'translation',
    ns: ['translation'],
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    react: { useSuspense: true },
  });
