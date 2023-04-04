import { initReactI18next } from 'react-i18next';
import i18next from 'i18next';
import { getConfigKey, queryApp } from 'renderer/utils/query';
import {
  DEFAULT_LANGUAGE,
  Language,
  isLanguage,
} from '../../shared/Language/Language';

const languageDetection = (callback: (lang: Language | undefined) => void) => {
  const run = async () => {
    const stored = await getConfigKey('preferedLanguage');

    if (stored) {
      callback(stored);
      return;
    }

    const systemLangs = await queryApp('getPreferredSystemLanguages');
    const parsed = systemLangs.map((l) => l.split('-')[0]);

    const preferedLangugeAvailable = parsed.find(isLanguage);

    console.log('preferedLangugeAvailable is: ', preferedLangugeAvailable);

    callback(preferedLangugeAvailable || DEFAULT_LANGUAGE);
  };

  run();
};

i18next
  .use({
    type: 'languageDetector',
    name: 'Locale language detector',
    async: true,
    init: function () {},
    detect: languageDetection,
    cacheUserLanguage: function (lng: string) {
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