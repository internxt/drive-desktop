import Select, { SelectOptionsType } from '../../../components/Select';
import { languageStore } from '@/apps/renderer/localize/language.store';
import { i18n } from '@/apps/renderer/localize/i18n';

export default function LanguagePicker(): JSX.Element {
  const selectedLanguage = languageStore((state) => state.language);

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

  const updatePreferedLanguage = (lang: string) => {
    window.electron.setConfigKey({ key: 'preferedLanguage', value: lang });
  };

  return (
    <div id="language-picker" className="flex flex-1 flex-col items-start space-y-2">
      <p className="text-sm font-medium leading-4 text-gray-80">{i18n('settings.general.language.label')}</p>

      <Select options={languages} value={selectedLanguage} onValueChange={updatePreferedLanguage} />
    </div>
  );
}
