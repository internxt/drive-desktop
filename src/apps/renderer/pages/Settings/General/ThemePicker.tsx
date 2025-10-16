import { Theme } from '../../../../shared/types/Theme';
import Select, { SelectOptionsType } from '../../../components/Select';
import { useTranslationContext } from '../../../context/LocalContext';
import { useTheme } from '../../../hooks/useConfig';

export function ThemePicker() {
  const { translate } = useTranslationContext();
  const theme = useTheme();

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

  const updatePreferedTheme = (theme: string) => {
    window.electron.setConfigKey({ key: 'preferedTheme', value: theme as Theme });
  };

  return (
    <div id="theme-picker" className="flex flex-1 flex-col items-start space-y-2">
      <p className="text-sm font-medium leading-4 text-gray-80">{translate('settings.general.theme.label')}</p>
      <Select options={themes} value={theme} onValueChange={updatePreferedTheme} />
    </div>
  );
}
