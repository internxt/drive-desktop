import { useEffect, useState } from 'react';
import i18next from 'i18next';
import Dropdown, { DropdownElement } from '../../../components/Dropdown';
import { useTranslationContext } from '../../../context/LocalContext';
import { DEFAULT_LANGUAGE, Language } from '../../../../shared/Locale/Language';
import DayJsLocales from '../../../../shared/Locale/DayJsLocales';
import dayjs from 'dayjs';
import useConfig from '../../../hooks/useConfig';

const languages: Array<DropdownElement<Language>> = [
  {
    id: 'en',
    translationKey: 'settings.general.language.avaliable.en',
    value: 'en',
  },
  {
    id: 'es',
    translationKey: 'settings.general.language.avaliable.es',
    value: 'es',
  },
  {
    id: 'fr',
    translationKey: 'settings.general.language.avaliable.fr',
    value: 'fr',
  }
];

export default function LanguagePicker(): JSX.Element {
  const { translate } = useTranslationContext();
  const lang = useConfig('preferedLanguage') as Language;
  const [selectedLanguage, setSelectedLanguage] = useState<
    DropdownElement<Language> | undefined
  >(languages.find((l) => l.value === lang) || languages[0]);

  const updatePreferedLanguage = (lang: DropdownElement<Language>) => {
    i18next.changeLanguage(lang.id);
    dayjs.locale(DayJsLocales[lang.value]);
    window.electron.setConfigKey('preferedLanguage', lang.value.toLowerCase());
    setSelectedLanguage(lang);
  };

  useEffect(() => {
    const getPreferedLanguage = async () => {
      const preferedLanguage = await window.electron.getConfigKey(
        'preferedLanguage'
      ) as Language || DEFAULT_LANGUAGE;

      const select = languages.find((lang: DropdownElement<Language>) => {
        return lang.id === preferedLanguage;
      });

      if (!select) return;

      setSelectedLanguage(select);
    };

    getPreferedLanguage();
  }, []);

  return (
    <section id="language-picker" className="mt-4">
      <h2 className="text-xs tracking-wide text-m-neutral-100">
        {translate('settings.general.language.section')}
      </h2>
      {selectedLanguage && (
        <Dropdown<Language>
          selected={selectedLanguage}
          onChange={updatePreferedLanguage}
          options={languages}
        />
      )}
    </section>
  );
}
