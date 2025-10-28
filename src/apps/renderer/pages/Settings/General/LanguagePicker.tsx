import { useI18n } from '@/apps/renderer/localize/use-i18n';
import Select, { SelectOptionsType } from '../../../components/Select';
import { Language } from '@/apps/main/config/language.types';

export function LanguagePicker() {
  const { translate, language } = useI18n();

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

  const updatePreferedLanguage = (value: string) => {
    void globalThis.window.electron.setConfigKey({ key: 'preferedLanguage', value: value as Language });
  };

  return (
    <div id="language-picker" className="flex flex-1 flex-col items-start space-y-2">
      <p className="text-sm font-medium leading-4 text-gray-80">{translate('settings.general.language.label')}</p>

      <Select options={languages} value={language} onValueChange={updatePreferedLanguage} />
    </div>
  );
}
