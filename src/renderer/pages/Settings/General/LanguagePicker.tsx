import dayjs from 'dayjs';
import i18next from 'i18next';
import { useEffect, useState } from 'react';
import DayJsLocales from '../../../../shared/Locale/DayJsLocales';
import { DEFAULT_LANGUAGE, Language } from '../../../../shared/Locale/Language';
import Select, { SelectOptionsType } from 'renderer/components/Select';
import { useTranslationContext } from '../../../context/LocalContext';
import useConfig from '../../../hooks/useConfig';

export default function LanguagePicker(): JSX.Element {
  const { translate } = useTranslationContext();
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(
    (useConfig('preferedLanguage') as Language) || null
  );

  const languages: SelectOptionsType[] = [
    {
      value: 'en',
      name: translate('settings.general.language.options.en'),
    },
    {
      value: 'es',
      name: translate('settings.general.language.options.es'),
    },
    {
      value: 'fr',
      name: translate('settings.general.language.options.fr'),
    },
  ];

  const refreshPreferedLanguage = async () => {
    const lang = await window.electron.getConfigKey('preferedLanguage');
    if (lang === '' || lang === null) {
      setSelectedLanguage(DEFAULT_LANGUAGE);
    } else {
      setSelectedLanguage(lang);
    }
  };

  const updatePreferedLanguage = (lang: string) => {
    i18next.changeLanguage(lang);
    dayjs.locale(DayJsLocales[lang as Language]);
    window.electron.setConfigKey('preferedLanguage', lang);
    refreshPreferedLanguage();
  };

  useEffect(() => {
    refreshPreferedLanguage();
  }, []);

  return (
    <div
      id="language-picker"
      className="flex flex-1 flex-col items-start space-y-2"
    >
      <p className="text-sm font-medium leading-4 text-gray-80">
        {translate('settings.general.language.label')}
      </p>

      {selectedLanguage && (
        <Select
          options={languages}
          value={selectedLanguage}
          onValueChange={updatePreferedLanguage}
        />
      )}
    </div>
  );
}
