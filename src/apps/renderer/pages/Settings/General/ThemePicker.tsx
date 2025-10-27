import { useI18n } from '@/apps/renderer/localize/use-i18n';
import Select, { SelectOptionsType } from '../../../components/Select';
import { Theme } from '@/apps/main/config/theme.types';
import { configStore } from '@/apps/renderer/features/config/config.store';

export function ThemePicker() {
  const { translate } = useI18n();
  const configTheme = configStore((s) => s.configTheme);

  const themes: SelectOptionsType[] = [
    {
      value: 'system',
      name: translate('settings.general.theme.options.system'),
    },
    {
      value: 'light',
      name: translate('settings.general.theme.options.light'),
    },
    {
      value: 'dark',
      name: translate('settings.general.theme.options.dark'),
    },
  ];

  const updatePreferedTheme = (value: string) => {
    void globalThis.window.electron.setConfigKey({ key: 'preferedTheme', value: value as Theme });
  };

  return (
    <div id="theme-picker" className="flex flex-1 flex-col items-start space-y-2">
      <p className="text-sm font-medium leading-4 text-gray-80">{translate('settings.general.theme.label')}</p>
      <Select options={themes} value={configTheme} onValueChange={updatePreferedTheme} />
    </div>
  );
}
