import { useEffect, useState } from 'react';
import i18next from 'i18next';
import Dropdown, { DropdownElement } from '../../../components/Dropdown';
import { useTranslationContext } from '../../../context/LocalContext';
import { Language } from '../../../../shared/Language/Language';

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
  },
];

export default function LanguagePicker(): JSX.Element {
  const { translate } = useTranslationContext();
  const [selectedLanguage, setSelectedLanguage] =
    useState<DropdownElement<Language> | null>(null);

  const updatePreferedLanguage = (lang: DropdownElement<Language>) => {
    i18next.changeLanguage(lang.id);
    window.electron.setConfigKey('preferedLanguage', lang.value.toLowerCase());
    setSelectedLanguage(lang);
  };

  useEffect(() => {
    const getPreferedLanguge = async () => {
      const preferedLanguage = await window.electron.getConfigKey(
        'preferedLanguage'
      ) as Language;

      if (!preferedLanguage) {
        console.log('NO PREFREED LANGUGE SAVsED!!!');
      } else {
        console.log('PREFREED LANGUGE:', preferedLanguage);
      }

      const select = languages.find((lang: DropdownElement<Language>) => {
        return lang.id === preferedLanguage;
      });

      if (!select) return;

      setSelectedLanguage(select);
    };

    getPreferedLanguge();
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
