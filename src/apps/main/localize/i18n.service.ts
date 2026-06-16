import i18next from 'i18next';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import enTranslations from '../../renderer/localize/locales/en.json';
import esTranslations from '../../renderer/localize/locales/es.json';
import frTranslations from '../../renderer/localize/locales/fr.json';
import { DEFAULT_LANGUAGE, Language, isLanguage } from '../../shared/Locale/Language';

type TranslationOptions = {
  [key: string]: unknown;
};

type TranslateMainPops = {
  key: string;
  defaultValue: string;
  options?: TranslationOptions;
};

type SetMainI18nLanguagePops = {
  language: Language;
};

type SetupMainI18nPops = {
  language?: string;
};

const languageChangeListeners = new Set<() => void>();
let isMainI18nInitialized = false;

function notifyMainLanguageChanged() {
  for (const listener of languageChangeListeners) {
    listener();
  }
}

export async function setupMainI18n({ language }: SetupMainI18nPops = {}) {
  if (isMainI18nInitialized) return;

  const initialLanguage = language && isLanguage(language) ? language : DEFAULT_LANGUAGE;

  try {
    await i18next.init({
      resources: {
        en: {
          translation: enTranslations,
        },
        es: {
          translation: esTranslations,
        },
        fr: {
          translation: frTranslations,
        },
      },
      lng: initialLanguage,
      fallbackLng: DEFAULT_LANGUAGE,
      defaultNS: 'translation',
      ns: ['translation'],
      debug: false,
      interpolation: {
        escapeValue: false,
      },
    });

    i18next.on('languageChanged', notifyMainLanguageChanged);
    isMainI18nInitialized = true;
  } catch (exc) {
    logger.error({
      msg: 'Unable to initialize i18next for Main process',
      exc,
      language: initialLanguage,
    });
  }
}

export async function setMainI18nLanguage({ language }: SetMainI18nLanguagePops) {
  await setupMainI18n();

  if (!isMainI18nInitialized || i18next.language === language) return;

  try {
    await i18next.changeLanguage(language);
  } catch (exc) {
    logger.error({
      msg: 'Unable to change i18next language for Main process',
      exc,
      language,
    });
  }
}

export function translateMain({ key, defaultValue, options }: TranslateMainPops) {
  if (!isMainI18nInitialized) return defaultValue;

  return i18next.t(key, {
    defaultValue,
    ...(options || {}),
  });
}

export function onMainI18nLanguageChange(listener: () => void) {
  languageChangeListeners.add(listener);

  return () => {
    languageChangeListeners.delete(listener);
  };
}
