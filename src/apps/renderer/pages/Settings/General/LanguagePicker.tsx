import dayjs from 'dayjs';
import i18next from 'i18next';
import { useEffect, useState } from 'react';
import DayJsLocales from '../../../../shared/Locale/DayJsLocales';
import { DEFAULT_LANGUAGE, Language } from '../../../../shared/Locale/Language';
import Select, { SelectOptionsType } from '../../../components/Select';
import useConfig from '../../../hooks/useConfig';
import { setLanguage } from '@/apps/renderer/localize/language.store';
import { i18n } from '@/apps/renderer/localize/i18n';

export default function LanguagePicker(): JSX.Element {
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>((useConfig('preferedLanguage') as Language) || null);

  const languages: SelectOptionsType[] = [
    {
      value: 'en',
      name: i18n('settings.general.language.options.en'),
    },
    {
      value: 'es',
      name: i18n('settings.general.language.options.es'),
    },
    {
      value: 'fr',
      name: i18n('settings.general.language.options.fr'),
    },
  ];

  const refreshPreferedLanguage = async () => {
    const lang = await window.electron.getConfigKey('preferedLanguage');
    setLanguage({ language: lang });
    if (lang === '' || lang === null) {
      setSelectedLanguage(DEFAULT_LANGUAGE);
    } else {
      setSelectedLanguage(lang);
    }
  };

  const updatePreferedLanguage = (lang: string) => {
    setLanguage({ language: lang });
    i18next.changeLanguage(lang);
    dayjs.locale(DayJsLocales[lang as Language]);
    window.electron.setConfigKey({ key: 'preferedLanguage', value: lang });
    refreshPreferedLanguage();
  };

  useEffect(() => {
    refreshPreferedLanguage();
  }, []);

  return (
    <div id="language-picker" className="flex flex-1 flex-col items-start space-y-2">
      <p className="text-sm font-medium leading-4 text-gray-80">{i18n('settings.general.language.label')}</p>

      {selectedLanguage && <Select options={languages} value={selectedLanguage} onValueChange={updatePreferedLanguage} />}
    </div>
  );
}
